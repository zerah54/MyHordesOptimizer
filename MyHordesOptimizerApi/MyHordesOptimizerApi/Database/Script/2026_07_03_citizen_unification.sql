-- ----------------------------------------------------------------------------
-- 2026_07_03 — Unification des tables citoyens
--
-- Objectif :
--   - TownCitizen devient LA table de participation d'un joueur à une ville,
--     vivant ou mort (colonne `dead`, la ligne n'est plus jamais supprimée).
--     Sa PK passe de (idTown, idUser, idLastUpdateInfo) à (idTown, idUser).
--   - TownCadaver ne porte plus que le détail du décès : name et avatar
--     ne vivent plus que sur User.
--   - TownPublicCitizen (données publiques dupliquées) est migrée vers
--     User / TownCitizen / TownCadaver puis supprimée.
--
-- Pré-requis : 2026_06_30_town_season_import.sql (création de TownPublicCitizen)
-- ----------------------------------------------------------------------------

ALTER TABLE Users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- 1. Users manquants référencés par TownPublicCitizen (pas de FK User sur cette table)
INSERT INTO Users (idUser, name, avatar)
SELECT tpc.idUser, MAX(COALESCE(tpc.name, '')), MAX(tpc.avatar)
FROM TownPublicCitizen tpc
LEFT JOIN Users u ON u.idUser = tpc.idUser
WHERE u.idUser IS NULL
GROUP BY tpc.idUser;

-- 2. Compléter l'avatar des Users existants qui n'en ont pas encore
UPDATE Users u
JOIN (
    SELECT idUser, MAX(avatar) AS avatar
    FROM TownPublicCitizen
    WHERE avatar IS NOT NULL
    GROUP BY idUser
) tpc ON tpc.idUser = u.idUser
SET u.avatar = tpc.avatar
WHERE u.avatar IS NULL;

-- 2bis. Idem depuis TownCadaver, avant suppression de ses colonnes name/avatar
UPDATE Users u
JOIN (
    SELECT idUser, MAX(avatar) AS avatar
    FROM TownCadaver
    WHERE avatar IS NOT NULL
    GROUP BY idUser
) cad ON cad.idUser = u.idUser
SET u.avatar = cad.avatar
WHERE u.avatar IS NULL;

-- 3. Nouvelle PK de TownCitizen : (idTown, idUser).
--    L'unicité était déjà garantie par l'index unique idTown, qui devient
--    redondant et est supprimé dans la foulée.
ALTER TABLE TownCitizen
    DROP PRIMARY KEY,
    ADD PRIMARY KEY (idTown, idUser),
    DROP INDEX idTown;

-- 4. LastUpdateInfo « système » (idUser NULL) porté par les lignes migrées
INSERT INTO LastUpdateInfo (dateUpdate, idUser) VALUES (UTC_TIMESTAMP(), NULL);
SET @lastUpdateMigration = LAST_INSERT_ID();

-- 5. TownCitizen manquants depuis TownPublicCitizen (mort si deathTypeId connu)
INSERT INTO TownCitizen (idTown, idUser, idLastUpdateInfo, dead)
SELECT tpc.idTown, tpc.idUser, @lastUpdateMigration,
       CASE WHEN tpc.deathTypeId IS NOT NULL THEN 1 ELSE 0 END
FROM TownPublicCitizen tpc
LEFT JOIN TownCitizen tc ON tc.idTown = tpc.idTown AND tc.idUser = tpc.idUser
WHERE tc.idTown IS NULL;

-- 5bis. Propager le décès sur les TownCitizen qui existaient déjà
UPDATE TownCitizen tc
JOIN TownPublicCitizen tpc ON tpc.idTown = tc.idTown AND tpc.idUser = tc.idUser
SET tc.dead = 1
WHERE tpc.deathTypeId IS NOT NULL;

-- 5ter. Marquer morts les TownCitizen ayant déjà un TownCadaver
UPDATE TownCitizen tc
JOIN TownCadaver cad ON cad.idTown = tc.idTown AND cad.idUser = tc.idUser
SET tc.dead = 1;

-- 6. TownCadaver manquants pour les morts connus de TownPublicCitizen.
--    causeOfDeath est protégé par sa FK : NULL si le dtype est inconnu en base.
INSERT INTO TownCadaver (idTown, idUser, survivalDay, score, causeOfDeath, deathMessage, townMessage)
SELECT tpc.idTown, tpc.idUser, tpc.survivalDay, tpc.score,
       CASE WHEN cod.dtype IS NOT NULL THEN tpc.deathTypeId ELSE NULL END,
       tpc.message, tpc.comment
FROM TownPublicCitizen tpc
LEFT JOIN TownCadaver cad ON cad.idTown = tpc.idTown AND cad.idUser = tpc.idUser
LEFT JOIN CauseOfDeath cod ON cod.dtype = tpc.deathTypeId
WHERE tpc.deathTypeId IS NOT NULL
  AND cad.idTown IS NULL;

-- 7. Name et avatar ne vivent plus que sur User
ALTER TABLE TownCadaver
    DROP COLUMN cadaverName,
    DROP COLUMN avatar;

-- 8. Suppression de la table dupliquée
DROP TABLE TownPublicCitizen;
