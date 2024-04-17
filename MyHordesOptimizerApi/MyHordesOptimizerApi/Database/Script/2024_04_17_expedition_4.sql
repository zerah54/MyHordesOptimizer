ALTER TABLE ExpeditionPart
DROP COLUMN Direction;

ALTER TABLE ExpeditionPart
ADD COLUMN Direction int NULL 
AFTER label;

ALTER TABLE ExpeditionCitizen
ADD COLUMN nombrePaDepart int NOT NULL DEFAULT(6)
AFTER pdc;