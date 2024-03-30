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