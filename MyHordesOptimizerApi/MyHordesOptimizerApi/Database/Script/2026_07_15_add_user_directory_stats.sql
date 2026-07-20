-- ----------------------------------------------------------------------------
-- 2026_07_15 — Statistiques dénormalisées sur Users (annuaire)
--
-- La liste des citoyens est paginée côté serveur : un COUNT/MAX joint sur
-- TownCitizen/TownCadaver à chaque page ne tiendrait pas à l'échelle de la
-- population du jeu. Ces trois colonnes sont donc recalculées à l'import
-- (RecomputeUserDirectoryStats) et lues telles quelles par la liste.
--
-- lastTownId sert de proxy temporel : il n'existe AUCUNE date de jeu dans le
-- schéma (Town n'a ni début ni fin, TownCadaver pas de date, et
-- LastUpdateInfo.dateUpdate est la date de notre import). Les idTown MyHordes
-- étant séquentiels, le plus grand identifie la ville la plus récente.
-- ----------------------------------------------------------------------------

ALTER TABLE Users
    ADD COLUMN nbTownsPlayed INT NOT NULL DEFAULT 0,
    ADD COLUMN bestSurvival INT NULL,
    ADD COLUMN lastTownId INT NULL;

-- Tri par défaut de l'annuaire (les plus actifs d'abord) et recherche par pseudo
CREATE INDEX Users_nbTownsPlayed ON Users (nbTownsPlayed);
CREATE INDEX Users_lastTownId ON Users (lastTownId);
CREATE INDEX Users_name ON Users (name);
