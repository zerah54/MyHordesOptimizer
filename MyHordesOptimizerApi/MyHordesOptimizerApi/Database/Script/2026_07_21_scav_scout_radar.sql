-- ============================================================
-- Migration : scav-scout-radar
-- Description : Informations des métiers Fouineur et Éclaireur
--               sur la case courante et les cases adjacentes
-- ============================================================
--
-- scavZoneLevel  : niveau d'abondance de la zone (0-3), lu sur la case
--                  où se trouve le Fouineur. 0 = zone épuisée.
-- scoutZoneLevel : niveau d'exploration de la zone (0-3), lu sur la case
--                  où se trouve l'Éclaireur. Distinct de dangerLevel.
--
-- scoutEstimationZombie : estimation du nombre de zombies portée par le
--                  radar de l'Éclaireur sur une case ADJACENTE. C'est une
--                  valeur bruitée (zombies + rand(-range, range) côté
--                  MyHordes), donc jamais une valeur certaine, sauf 0.
-- idScoutEstimationLastUpdateInfo : fraîcheur propre à l'estimation. Elle
--                  doit être comparée à idLastUpdateInfo de la case pour
--                  savoir si l'estimation est plus récente que la dernière
--                  mise à jour réelle de la case.
--
-- Le radar du Fouineur (case adjacente épuisée ou non) n'a pas de colonne
-- dédiée : il alimente directement isDryed et isRuinDryed.
-- ============================================================

ALTER TABLE MapCell
    ADD COLUMN IF NOT EXISTS scavZoneLevel                   INT NULL,
    ADD COLUMN IF NOT EXISTS scoutZoneLevel                  INT NULL,
    ADD COLUMN IF NOT EXISTS scoutEstimationZombie           INT NULL,
    ADD COLUMN IF NOT EXISTS idScoutEstimationLastUpdateInfo INT NULL;

-- Clé étrangère vers LastUpdateInfo (idempotent : ignore la contrainte déjà présente)
ALTER TABLE MapCell
    ADD CONSTRAINT MapCell_ibfk_4 FOREIGN KEY IF NOT EXISTS (idScoutEstimationLastUpdateInfo)
        REFERENCES LastUpdateInfo(idLastUpdateInfo);
