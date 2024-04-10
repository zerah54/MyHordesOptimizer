ALTER TABLE Expedition
ADD COLUMN Position INT NOT NULL DEFAULT(0)
AFTER day;

ALTER TABLE ExpeditionPart
ADD COLUMN Position INT NOT NULL DEFAULT(0)
AFTER idExpedition;

DROP TABLE ExpeditionCitizenOrder;

ALTER TABLE ExpeditionOrder
ADD COLUMN idExpeditionCitizen INT NULL,
ADD FOREIGN KEY expedition_order_fk_citizen(idExpeditionCitizen) REFERENCES ExpeditionCitizen(idExpeditionCitizen) ON DELETE CASCADE;


ALTER TABLE ExpeditionCitizen 
DROP FOREIGN KEY ExpeditionCitizen_ibfk_4;
ALTER TABLE ExpeditionCitizen 
ADD CONSTRAINT ExpeditionCitizen_ibfk_4
  FOREIGN KEY (idExpeditionBag)
  REFERENCES ExpeditionBag (idExpeditionBag)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE ExpeditionBagItem 
DROP FOREIGN KEY ExpeditionBagItem_ibfk_2;
ALTER TABLE ExpeditionBagItem 
ADD CONSTRAINT ExpeditionBagItem_ibfk_2
  FOREIGN KEY (idExpeditionBag)
  REFERENCES ExpeditionBag (idExpeditionBag)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE TownCitizen
ADD COLUMN isShunned BIT(1) NULL DEFAULT 0 AFTER dead;