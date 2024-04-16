ALTER TABLE Expedition
drop CONSTRAINT Expedition_ibfk_1;
ALTER TABLE Expedition
ADD CONSTRAINT Expedition_ibfk_1
    FOREIGN KEY (idTown)
    REFERENCES Town(idTown)
    ON DELETE CASCADE;

ALTER TABLE Expedition
drop CONSTRAINT Expedition_ibfk_2;
ALTER TABLE Expedition
ADD CONSTRAINT Expedition_ibfk_2
    FOREIGN KEY (idLastUpdateInfo)
    REFERENCES LastUpdateInfo(idLastUpdateInfo)
    ON DELETE CASCADE;

ALTER TABLE ExpeditionCitizen
drop CONSTRAINT ExpeditionCitizen_ibfk_1;
ALTER TABLE ExpeditionCitizen
ADD CONSTRAINT ExpeditionCitizen_ibfk_1
    FOREIGN KEY (idExpeditionPart)
    REFERENCES ExpeditionPart(idExpeditionPart)
    ON DELETE CASCADE;
    
ALTER TABLE ExpeditionCitizen
drop CONSTRAINT ExpeditionCitizen_ibfk_4;
ALTER TABLE ExpeditionCitizen
ADD CONSTRAINT ExpeditionCitizen_ibfk_4
    FOREIGN KEY (idExpeditionBag)
    REFERENCES ExpeditionBag(idExpeditionBag)
    ON DELETE CASCADE;

ALTER TABLE ExpeditionPart
drop CONSTRAINT ExpeditionPart_ibfk_1;
ALTER TABLE ExpeditionPart
ADD CONSTRAINT ExpeditionPart_ibfk_1
    FOREIGN KEY (idExpedition)
    REFERENCES Expedition(idExpedition)
    ON DELETE CASCADE;
    
ALTER TABLE ExpeditionPartOrder
drop CONSTRAINT ExpeditionPartOrder_ibfk_1;
ALTER TABLE ExpeditionPartOrder
ADD CONSTRAINT ExpeditionPartOrder_ibfk_1
    FOREIGN KEY (idExpeditionOrder)
    REFERENCES ExpeditionOrder(idExpeditionOrder)
    ON DELETE CASCADE;
    
ALTER TABLE ExpeditionPartOrder
drop CONSTRAINT ExpeditionPartOrder_ibfk_2;
ALTER TABLE ExpeditionPartOrder
ADD CONSTRAINT ExpeditionPartOrder_ibfk_2
    FOREIGN KEY (idExpeditionPart)
    REFERENCES ExpeditionPart(idExpeditionPart)
    ON DELETE CASCADE;
   
ALTER TABLE ExpeditionCitizenOrder
drop CONSTRAINT ExpeditionCitizenOrder_ibfk_1;
ALTER TABLE ExpeditionCitizenOrder
ADD CONSTRAINT ExpeditionCitizenOrder_ibfk_1
    FOREIGN KEY (idExpeditionOrder)
    REFERENCES ExpeditionOrder(idExpeditionOrder)
    ON DELETE CASCADE;

ALTER TABLE ExpeditionCitizenOrder
drop CONSTRAINT ExpeditionCitizenOrder_ibfk_2;
ALTER TABLE ExpeditionCitizenOrder
ADD CONSTRAINT ExpeditionCitizenOrder_ibfk_2
    FOREIGN KEY (idExpeditionCitizen)
    REFERENCES ExpeditionCitizen(idExpeditionCitizen)
    ON DELETE CASCADE;


ALTER TABLE ExpeditionCitizen 
DROP FOREIGN KEY ExpeditionCitizen_ibfk_4;
ALTER TABLE ExpeditionCitizen 
DROP COLUMN idExpeditionBag,
ADD COLUMN idBag INT NULL AFTER isThirsty;

ALTER TABLE ExpeditionCitizen 
ADD CONSTRAINT ExpeditionCitizen_ibfk_4
  FOREIGN KEY (idBag)
  REFERENCES Bag (idBag)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

DROP TABLE ExpeditionBag;

CREATE TABLE ExpeditionBag(
	idExpeditionBag INT AUTO_INCREMENT,
	PRIMARY KEY (idExpeditionBag)
);

CREATE TABLE ExpeditionBagItem(
	idExpeditionBag INT,
	idItem INT,
	count INT,
	isBroken BIT NOT NULL DEFAULT 0,
	PRIMARY KEY (idExpeditionBag, idItem),
	FOREIGN KEY(idItem) REFERENCES Item(idItem)
);

ALTER TABLE ExpeditionCitizen 
DROP FOREIGN KEY ExpeditionCitizen_ibfk_4;
ALTER TABLE ExpeditionCitizen 
DROP COLUMN idBag,
ADD COLUMN idExpeditionBag INT NULL AFTER isThirsty;

ALTER TABLE ExpeditionCitizen 
ADD CONSTRAINT ExpeditionCitizen_ibfk_4
  FOREIGN KEY (idExpeditionBag)
  REFERENCES ExpeditionBag (idExpeditionBag)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

ALTER TABLE ExpeditionBagItem 
ADD CONSTRAINT ExpeditionBagItem_ibfk_2
  FOREIGN KEY (idExpeditionBag)
  REFERENCES ExpeditionBag (idExpeditionBag)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;
