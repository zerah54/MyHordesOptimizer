-- ----------------------------------------------------------------------------
-- 2026_11_01 — Pictos rangés sur une ville Twinoid homonyme
--
-- PersistUserPictos rattachait par ResolveTownId (premier idTown de même mapId, presque
-- toujours une ville Twinoid) au lieu de la ville retenue pour la vie passée.
--
-- Une ligne est suspecte si elle porte sur une ville Twinoid dont le joueur n'est ni citoyen
-- ni cadavre. Sa vraie ville est celle de même mapId dont il est citoyen ou cadavre :
--   rattache        : ville unique, ligne déplacée
--   cible_existante : le picto existe déjà sur cette ville, qui prévaut
--   doublon         : plusieurs suspectes pour le même picto, la plus récente est déplacée
--   ambigu          : plusieurs villes possibles
--   sans_cible      : aucune ville possible
--
-- Rien n'est perdu : TownCitizenPictoRepair garde chaque ligne traitée, déplacée ou retirée.
--
-- À lancer APRÈS le déploiement du correctif de PersistUserPictos, sur MHO_BETA puis sur mho.
-- Se termine par ROLLBACK : vérifier les volumes du « Contrôle » et les attendus, puis relancer
-- avec COMMIT.
-- ----------------------------------------------------------------------------

-- Hors transaction : CREATE TABLE valide implicitement la transaction en cours.
CREATE TABLE IF NOT EXISTS TownCitizenPictoRepair
(
    idTown
    INT
    NOT
    NULL,
    idUser
    INT
    NOT
    NULL,
    idPicto
    INT
    NOT
    NULL,
    `count`
    INT
    NOT
    NULL,
    lastUpdate
    DATETIME
    NOT
    NULL,
    newIdTown
    INT
    NULL,
    action
    VARCHAR
(
    20
) NOT NULL,
    repairedAt DATETIME NOT NULL,
    PRIMARY KEY
(
    idTown,
    idUser,
    idPicto
)
    );

-- Town.mapId n'est pas indexé
CREATE
TEMPORARY TABLE tmp_town_by_map (mapId INT NOT NULL, idTown INT NOT NULL, PRIMARY KEY (mapId, idTown))
SELECT mapId, idTown
FROM Town
WHERE mapId IS NOT NULL;

CREATE
TEMPORARY TABLE tmp_picto_suspect (idTown INT NOT NULL, idUser INT NOT NULL, idPicto INT NOT NULL, mapId INT NOT NULL, lastUpdate DATETIME NOT NULL, PRIMARY KEY (idTown, idUser, idPicto), KEY suspect_couple (idUser, mapId))
SELECT p.idTown, p.idUser, p.idPicto, t.mapId, p.lastUpdate
FROM TownCitizenPicto p
         JOIN Town t ON t.idTown = p.idTown
WHERE t.phase = 2
  AND t.mapId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM TownCitizen tc WHERE tc.idTown = p.idTown AND tc.idUser = p.idUser)
  AND NOT EXISTS (SELECT 1 FROM TownCadaver c WHERE c.idTown = p.idTown AND c.idUser = p.idUser);

CREATE
TEMPORARY TABLE tmp_couple (idUser INT NOT NULL, mapId INT NOT NULL, PRIMARY KEY (idUser, mapId))
SELECT DISTINCT idUser, mapId
FROM tmp_picto_suspect;

CREATE
TEMPORARY TABLE tmp_cible (idUser INT NOT NULL, mapId INT NOT NULL, nbCibles INT NOT NULL, newIdTown INT NOT NULL, PRIMARY KEY (idUser, mapId))
SELECT k.idUser, k.mapId, COUNT(*) AS nbCibles, MIN(m.idTown) AS newIdTown
FROM tmp_couple k
         JOIN tmp_town_by_map m ON m.mapId = k.mapId
WHERE EXISTS (SELECT 1 FROM TownCitizen tc WHERE tc.idTown = m.idTown AND tc.idUser = k.idUser)
   OR EXISTS (SELECT 1 FROM TownCadaver c WHERE c.idTown = m.idTown AND c.idUser = k.idUser)
GROUP BY k.idUser, k.mapId;

CREATE
TEMPORARY TABLE tmp_picto_plan (idTown INT NOT NULL, idUser INT NOT NULL, idPicto INT NOT NULL, newIdTown INT NULL, action VARCHAR(20) NOT NULL, PRIMARY KEY (idTown, idUser, idPicto))
SELECT x.idTown,
       x.idUser,
       x.idPicto,
       CASE WHEN x.nbCibles = 1 THEN x.newIdTown END AS newIdTown,
       CASE
           WHEN x.nbCibles IS NULL THEN 'sans_cible'
           WHEN x.nbCibles > 1 THEN 'ambigu'
           WHEN x.cibleExistante = 1 THEN 'cible_existante'
           WHEN x.rang > 1 THEN 'doublon'
           ELSE 'rattache' END AS action
FROM (SELECT s.idTown, s.idUser, s.idPicto, c.nbCibles, c.newIdTown, EXISTS (SELECT 1 FROM TownCitizenPicto e WHERE e.idTown = c.newIdTown AND e.idUser = s.idUser AND e.idPicto = s.idPicto) AS cibleExistante, ROW_NUMBER() OVER (PARTITION BY c.newIdTown, s.idUser, s.idPicto ORDER BY s.lastUpdate DESC, s.idTown) AS rang
    FROM tmp_picto_suspect s
    LEFT JOIN tmp_cible c ON c.idUser = s.idUser AND c.mapId = s.mapId) x;

-- Contrôle (MariaDB < 11.2 : une table temporaire ne peut apparaître qu'une fois par requête)
SELECT action, COUNT (*) AS lignes, COUNT (DISTINCT idUser) AS joueurs, COUNT (DISTINCT idTown) AS villes_source, COUNT (DISTINCT newIdTown) AS villes_cible
FROM tmp_picto_plan
GROUP BY action;

-- Lignes retirées alors que la ligne conservée porte un autre compteur
SELECT COUNT(*) AS cible_existante_autre_compteur
FROM tmp_picto_plan l
         JOIN TownCitizenPicto p ON p.idTown = l.idTown AND p.idUser = l.idUser AND p.idPicto = l.idPicto
         JOIN TownCitizenPicto e ON e.idTown = l.newIdTown AND e.idUser = l.idUser AND e.idPicto = l.idPicto
WHERE l.action = 'cible_existante'
  AND e.`count` <> p.`count`;
-- ---------------------------------------------------------------------------

SET
@repairedAt = UTC_TIMESTAMP();

START TRANSACTION;

SELECT COUNT(*)
INTO @totalAvant
FROM TownCitizenPicto;

INSERT INTO TownCitizenPictoRepair (idTown, idUser, idPicto, `count`, lastUpdate, newIdTown, action, repairedAt)
SELECT p.idTown,
       p.idUser,
       p.idPicto,
       p.`count`,
       p.lastUpdate,
       l.newIdTown,
       l.action,
       @repairedAt
FROM TownCitizenPicto p
         JOIN tmp_picto_plan l ON l.idTown = p.idTown AND l.idUser = p.idUser AND l.idPicto = p.idPicto;

DELETE
p FROM TownCitizenPicto p
JOIN tmp_picto_plan l ON l.idTown = p.idTown AND l.idUser = p.idUser AND l.idPicto = p.idPicto
WHERE l.action <> 'rattache';

UPDATE TownCitizenPicto p
    JOIN tmp_picto_plan l
ON l.idTown = p.idTown AND l.idUser = p.idUser AND l.idPicto = p.idPicto
    SET p.idTown = l.newIdTown
WHERE l.action = 'rattache';

-- Attendus : ecart = 0, suspectes_restantes = 0, sans_ville = 0
SELECT @totalAvant - (SELECT COUNT(*) FROM TownCitizenPicto)
           -
       (SELECT COUNT(*) FROM TownCitizenPictoRepair WHERE repairedAt = @repairedAt AND action <> 'rattache') AS ecart, (
SELECT COUNT (*)
FROM TownCitizenPicto p JOIN Town t
ON t.idTown = p.idTown
WHERE t.phase = 2
  AND NOT EXISTS (SELECT 1 FROM TownCitizen tc WHERE tc.idTown = p.idTown
  AND tc.idUser = p.idUser)
  AND NOT EXISTS (SELECT 1 FROM TownCadaver c WHERE c.idTown = p.idTown
  AND c.idUser = p.idUser)) AS suspectes_restantes
    , (
SELECT COUNT (*)
FROM TownCitizenPicto p
WHERE NOT EXISTS (SELECT 1 FROM Town t WHERE t.idTown = p.idTown)) AS sans_ville;

-- ROLLBACK par défaut : remplacer par COMMIT une fois les volumes du contrôle validés.
ROLLBACK;
-- COMMIT;

DROP
TEMPORARY TABLE tmp_picto_plan, tmp_cible, tmp_couple, tmp_picto_suspect, tmp_town_by_map;
