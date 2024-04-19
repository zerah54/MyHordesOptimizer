ALTER TABLE TownCitizen DROP COLUMN idCadaver;
DELETE FROM TownCadaver;

ALTER TABLE TownCadaver ADD COLUMN idTown INT NOT NULL FIRST,
ADD FOREIGN KEY town_cadaver_fk_town(idTown) REFERENCES Town(idTown);

ALTER TABLE TownCadaver 
DROP FOREIGN KEY TownCadaver_ibfk_1;
ALTER TABLE TownCadaver 
DROP COLUMN idCadaver;
ALTER TABLE TownCadaver 
DROP COLUMN idCitizen;

ALTER TABLE TownCadaver ADD COLUMN idUser INT NOT NULL AFTER idTown,
ADD FOREIGN KEY TownCadaver_ibfk_1(idUser) REFERENCES Users(idUser);

ALTER TABLE TownCadaver ADD PRIMARY KEY(idTown,idUser);