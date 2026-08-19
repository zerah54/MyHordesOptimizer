-- MyHordesOptimizerApi/MyHordesOptimizerApi/Database/Script/2026_08_18_chest_storage.sql
-- ----------------------------------------------------------------------------
-- 2026-08-18 — Coffre citoyen (Chest / ChestItem)
--
-- Mirroir exact de Bag/BagItem : un coffre par citoyen, contenu scrapé par
-- l'addon (page améliorations/maison) ou saisi à la main depuis la liste des
-- citoyens. isBroken fait partie de la clé (un item peut exister cassé ET
-- intact dans le même coffre), comme pour BagItem depuis
-- 2026_08_14_baguitem_key_isbroken.sql.
-- ----------------------------------------------------------------------------

CREATE TABLE Chest
(
    idChest          INT(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    idLastUpdateInfo INT(11) NULL,
    CONSTRAINT ChestItem_fk_lastupdate FOREIGN KEY (idLastUpdateInfo) REFERENCES LastUpdateInfo (idLastUpdateInfo)
);

CREATE TABLE ChestItem
(
    idChest  INT(11) NOT NULL,
    idItem   INT(11) NOT NULL,
    isBroken BIT(1) NOT NULL DEFAULT b'0',
    count    INT(11) NULL,
    PRIMARY KEY (idChest, idItem, isBroken),
    CONSTRAINT ChestItem_fk_chest FOREIGN KEY (idChest) REFERENCES Chest (idChest),
    CONSTRAINT ChestItem_fk_item FOREIGN KEY (idItem) REFERENCES Item (idItem)
);

ALTER TABLE TownCitizen
    ADD COLUMN idChest INT(11) NULL AFTER idBag,
    ADD COLUMN idLastUpdateInfoChest INT(11) NULL AFTER idLastUpdateInfoHome;

ALTER TABLE TownCitizen
    ADD CONSTRAINT TownCitizen_fk_chest FOREIGN KEY (idChest) REFERENCES Chest (idChest),
    ADD CONSTRAINT TownCitizen_fk_chest_lastupdate FOREIGN KEY (idLastUpdateInfoChest) REFERENCES LastUpdateInfo (idLastUpdateInfo);
