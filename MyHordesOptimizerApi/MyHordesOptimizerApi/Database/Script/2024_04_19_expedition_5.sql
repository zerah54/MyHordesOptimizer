ALTER TABLE ExpeditionCitizen
MODIFY nombrePaDepart int NULL NULL;

ALTER TABLE ExpeditionCitizen
ADD COLUMN isPreinscritSoif int NULL NULL
AFTER isThirsty;