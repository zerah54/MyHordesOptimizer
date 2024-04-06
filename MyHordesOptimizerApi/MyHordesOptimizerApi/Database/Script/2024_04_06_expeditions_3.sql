ALTER TABLE Expedition
ADD COLUMN Position INT NOT NULL DEFAULT(0)
AFTER day;

ALTER TABLE ExpeditionPart
ADD COLUMN Position INT NOT NULL DEFAULT(0)
AFTER idExpedition;

DROP TABLE ExpeditionCitizenOrder;

ALTER TABLE ExpeditionOrder
ADD COLUMN idExpeditionCitizen INT NOT NULL,
ADD FOREIGN KEY expedition_order_fk_citizen(idExpeditionCitizen) REFERENCES ExpeditionCitizen(idExpeditionCitizen) ON DELETE CASCADE;