-- ============================================================
-- Migration : add-town-map-id
-- Description : Stocke le mapId (/json/map) séparément de idTown
--               (= id /json/towns, clé naturelle MyHordes)
--               Reset des données Town pour repartir proprement
--               avec le bon idTown.
-- ============================================================

ALTER TABLE Town
    ADD COLUMN IF NOT EXISTS mapId INT NULL;

-- Nettoyage complet dans l'ordre des FK
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM TownPublicCitizen;
DELETE FROM TownEstimation;
DELETE FROM TownWishListItem;
DELETE FROM TownBankItem;
DELETE FROM TownCitizenBath;
DELETE FROM TownCadaver;
DELETE FROM TownCitizen;
DELETE FROM MapCellDig;
DELETE FROM MapCellItem;
DELETE FROM MapCellDigUpdate;
DELETE FROM MapCell;
DELETE FROM ExpeditionOrder;
DELETE FROM ExpeditionBagItem;
DELETE FROM ExpeditionBag;
DELETE FROM ExpeditionCitizen;
DELETE FROM ExpeditionPart;
DELETE FROM Expedition;
DELETE FROM Town;
SET FOREIGN_KEY_CHECKS = 1;
