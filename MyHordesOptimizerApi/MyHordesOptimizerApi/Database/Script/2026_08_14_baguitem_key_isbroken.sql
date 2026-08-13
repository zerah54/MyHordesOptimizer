-- ============================================================
-- Migration : baguitem-key-isbroken
-- Description : Un item peut exister en 2 exemplaires distincts
--               dans un sac (cassé / non cassé). La PK (idBag,
--               idItem) collisionne dans ce cas et fait planter
--               UpdateBags (EF: "already being tracked"). On
--               ajoute isBroken à la clé.
-- ============================================================

ALTER TABLE BagItem
DROP
PRIMARY KEY,
    ADD PRIMARY KEY (idBag, idItem, isBroken);
