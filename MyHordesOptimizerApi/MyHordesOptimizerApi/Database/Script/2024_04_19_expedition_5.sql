ALTER TABLE ExpeditionCitizen
MODIFY nombrePaDepart int NULL NULL;

ALTER TABLE ExpeditionCitizen
ADD COLUMN isPreinscritSoif INT NULL NULL
AFTER isThirsty;

ALTER TABLE ExpeditionCitizen
MODIFY isPreinscritSoif BIT NULL NULL;