-- ============================================================
-- Migration : users-pictos-import-map-id
-- Description : ville MyHordes (mapId) du joueur lors du dernier
--               import de ses pictos : 0 hors ville, NULL si non
--               retenue. Un joueur qui a quitté cette ville est
--               réimporté sans attendre la fin des 24 h.
-- IDEMPOTENT.
-- ============================================================

ALTER TABLE Users
    ADD COLUMN IF NOT EXISTS pictosImportMapId INT NULL;
