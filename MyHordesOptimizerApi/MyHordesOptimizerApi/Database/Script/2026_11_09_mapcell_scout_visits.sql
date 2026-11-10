-- ============================================================
-- Migration : mapcell-scout-visits
-- Description : Nombre de passages d'éclaireur sur une case
-- ============================================================
--
-- scoutVisits : passages d'éclaireur (0-15), saisis manuellement. MyHordes
--               en déduit le niveau d'exploration : min(3, floor(passages / 5)).
--               scoutZoneLevel prime : le nombre est ramené dans sa plage.
--               NULL = non renseigné.
-- ============================================================

ALTER TABLE MapCell
    ADD COLUMN IF NOT EXISTS scoutVisits INT (11) NULL AFTER scoutZoneLevel;
