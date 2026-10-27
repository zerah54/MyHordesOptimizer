-- ----------------------------------------------------------------------------
-- 2026_10_27 — Rattachement des lignes laissées orphelines par MigrateTownId
--
-- MigrateTownId (ville provisoire -mapId → townId stable) ne migrait que les tables
-- d'une liste codée en dur : TownCitizenPicto, TownNote et UserNote restaient sous
-- -mapId, sans ville (FOREIGN_KEY_CHECKS = 0), ou ré-adoptées par une ville
-- provisoire ultérieure de même mapId (mapId recyclé d'une saison à l'autre).
--
-- Règle : une ligne est rattachée à la ville stable de même mapId dont le joueur
-- concerné est citoyen ou cadavre, seulement si cette ville est unique. Une ligne
-- de picto déjà présente sur la ville cible (import postérieur à la migration)
-- prévaut sur l'orpheline.
-- Les pictos restés sans ville sont ensuite supprimés : ils sont réimportables
-- (import des pictos du joueur) et seraient sinon ré-adoptés par la prochaine
-- ville provisoire de même mapId. Les notes non rattachables sont conservées.
--
-- Idempotent. À lancer APRÈS le déploiement du correctif de MigrateTownId, sur
-- MHO_BETA d'abord (aucune orpheline : valide la syntaxe), puis sur mho.
-- Se termine par ROLLBACK : vérifier les volumes du « Contrôle », puis relancer
-- avec COMMIT.
-- ----------------------------------------------------------------------------

-- Villes stables par mapId (Town.mapId n'est pas indexé)
CREATE TEMPORARY TABLE tmp_town_by_map (mapId INT NOT NULL, idTown INT NOT NULL, PRIMARY KEY (mapId, idTown))
SELECT mapId, idTown FROM Town WHERE idTown > 0 AND mapId IS NOT NULL;

-- Pictos suspects : sans ville, ou sur une ville provisoire dont le joueur n'est ni citoyen ni cadavre
CREATE TEMPORARY TABLE tmp_tcp_suspect (idTown INT NOT NULL, idUser INT NOT NULL, idPicto INT NOT NULL, orpheline TINYINT NOT NULL, PRIMARY KEY (idTown, idUser, idPicto))
SELECT p.idTown, p.idUser, p.idPicto, NOT EXISTS (SELECT 1 FROM Town t WHERE t.idTown = p.idTown) AS orpheline
FROM TownCitizenPicto p
WHERE p.idTown < 0
  AND (NOT EXISTS (SELECT 1 FROM Town t WHERE t.idTown = p.idTown)
       OR (NOT EXISTS (SELECT 1 FROM TownCitizen tc WHERE tc.idTown = p.idTown AND tc.idUser = p.idUser)
           AND NOT EXISTS (SELECT 1 FROM TownCadaver c WHERE c.idTown = p.idTown AND c.idUser = p.idUser)));

-- Cible unique de chaque picto suspect
CREATE TEMPORARY TABLE tmp_tcp_cible (idTown INT NOT NULL, idUser INT NOT NULL, idPicto INT NOT NULL, newIdTown INT NOT NULL, PRIMARY KEY (idTown, idUser, idPicto))
SELECT s.idTown, s.idUser, s.idPicto, MIN(m.idTown) AS newIdTown
FROM tmp_tcp_suspect s
JOIN tmp_town_by_map m ON m.mapId = -s.idTown
WHERE EXISTS (SELECT 1 FROM TownCitizen tc WHERE tc.idTown = m.idTown AND tc.idUser = s.idUser)
   OR EXISTS (SELECT 1 FROM TownCadaver c WHERE c.idTown = m.idTown AND c.idUser = s.idUser)
GROUP BY s.idTown, s.idUser, s.idPicto
HAVING COUNT(*) = 1;

-- Notes orphelines (sans ville), rattachées par leur auteur
CREATE TEMPORARY TABLE tmp_townnote_cible (idTownNote INT NOT NULL PRIMARY KEY, newIdTown INT NOT NULL)
SELECT n.idTownNote, MIN(m.idTown) AS newIdTown
FROM TownNote n
JOIN tmp_town_by_map m ON m.mapId = -n.idTown
WHERE n.idTown < 0
  AND NOT EXISTS (SELECT 1 FROM Town t WHERE t.idTown = n.idTown)
  AND (EXISTS (SELECT 1 FROM TownCitizen tc WHERE tc.idTown = m.idTown AND tc.idUser = n.idUserAuthor)
       OR EXISTS (SELECT 1 FROM TownCadaver c WHERE c.idTown = m.idTown AND c.idUser = n.idUserAuthor))
GROUP BY n.idTownNote
HAVING COUNT(*) = 1;

CREATE TEMPORARY TABLE tmp_usernote_cible (idUserNote INT NOT NULL PRIMARY KEY, newIdTown INT NOT NULL)
SELECT n.idUserNote, MIN(m.idTown) AS newIdTown
FROM UserNote n
JOIN tmp_town_by_map m ON m.mapId = -n.idTown
WHERE n.idTown < 0
  AND NOT EXISTS (SELECT 1 FROM Town t WHERE t.idTown = n.idTown)
  AND (EXISTS (SELECT 1 FROM TownCitizen tc WHERE tc.idTown = m.idTown AND tc.idUser = n.idUserAuthor)
       OR EXISTS (SELECT 1 FROM TownCadaver c WHERE c.idTown = m.idTown AND c.idUser = n.idUserAuthor))
GROUP BY n.idUserNote
HAVING COUNT(*) = 1;

-- Contrôle (MariaDB < 11.2 : une table temporaire ne peut apparaître qu'une fois par requête)
SELECT COUNT(*)              AS pictos_suspects,
       SUM(s.orpheline)      AS pictos_sans_ville,
       COUNT(c.idTown)       AS pictos_rattaches,
       SUM(s.orpheline = 1 AND c.idTown IS NULL) AS pictos_supprimes
FROM tmp_tcp_suspect s
LEFT JOIN tmp_tcp_cible c ON c.idTown = s.idTown AND c.idUser = s.idUser AND c.idPicto = s.idPicto;

SELECT COUNT(*) AS pictos_deja_sur_la_cible
FROM tmp_tcp_cible c
JOIN TownCitizenPicto e ON e.idTown = c.newIdTown AND e.idUser = c.idUser AND e.idPicto = c.idPicto;

SELECT (SELECT COUNT(*) FROM tmp_townnote_cible) AS townnotes_rattachees,
       (SELECT COUNT(*) FROM tmp_usernote_cible) AS usernotes_rattachees;
-- ---------------------------------------------------------------------------

START TRANSACTION;

DELETE p FROM TownCitizenPicto p
JOIN tmp_tcp_cible c ON c.idTown = p.idTown AND c.idUser = p.idUser AND c.idPicto = p.idPicto
JOIN TownCitizenPicto e ON e.idTown = c.newIdTown AND e.idUser = c.idUser AND e.idPicto = c.idPicto;

UPDATE TownCitizenPicto p
JOIN tmp_tcp_cible c ON c.idTown = p.idTown AND c.idUser = p.idUser AND c.idPicto = p.idPicto
SET p.idTown = c.newIdTown;

DELETE p FROM TownCitizenPicto p
WHERE p.idTown < 0 AND NOT EXISTS (SELECT 1 FROM Town t WHERE t.idTown = p.idTown);

UPDATE TownNote n JOIN tmp_townnote_cible c ON c.idTownNote = n.idTownNote SET n.idTown = c.newIdTown;
UPDATE UserNote n JOIN tmp_usernote_cible c ON c.idUserNote = n.idUserNote SET n.idTown = c.newIdTown;

-- Attendu : 0 partout
SELECT (SELECT COUNT(*) FROM TownCitizenPicto p WHERE p.idTown < 0 AND NOT EXISTS (SELECT 1 FROM Town t WHERE t.idTown = p.idTown)) AS pictos_sans_ville,
       (SELECT COUNT(*) FROM TownCitizenPicto p JOIN tmp_tcp_cible c ON c.idTown = p.idTown AND c.idUser = p.idUser AND c.idPicto = p.idPicto) AS pictos_non_deplaces;

-- ROLLBACK par défaut : remplacer par COMMIT une fois les volumes du contrôle validés.
ROLLBACK;
-- COMMIT;

DROP TEMPORARY TABLE tmp_usernote_cible, tmp_townnote_cible, tmp_tcp_cible, tmp_tcp_suspect, tmp_town_by_map;
