CREATE TABLE CauseOfDeath(
	dtype INT PRIMARY KEY NOT NULL,
	ref NVARCHAR(255),
	description_fr TEXT,
	description_en TEXT,
	description_es TEXT,
	description_de TEXT,
	icon NVARCHAR(255),
	label_fr TEXT,
	label_en TEXT,
	label_es TEXT,
	label_de TEXT
);

CREATE TABLE TownCadaverCleanUpType(
	idType INT PRIMARY KEY NOT NULL,
	typeName NVARCHAR(100) UNIQUE,
	myHordesApiName NVARCHAR(100) UNIQUE
);

CREATE TABLE TownCadaverCleanUp(
	idCleanUp INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
	idCleanUpType INT,
	idUserCleanUp INT
);

CREATE TABLE TownCadaver(
	idCadaver INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
	idCitizen INT,
	idLastUpdateInfo INT,
	cadaverName NVARCHAR(255),
	avatar NVARCHAR(255),
	survivalDay INT,
	score INT,
	deathMessage TEXT,
	townMessage TEXT,
	causeOfDeath INT,
	cleanUp INT,
	FOREIGN KEY(idCitizen) REFERENCES Users(idUser),
	FOREIGN KEY(idLastUpdateInfo) REFERENCES LastUpdateInfo(idLastUpdateInfo),
	FOREIGN KEY(causeOfDeath) REFERENCES CauseOfDeath(dtype),
	FOREIGN KEY(cleanUp) REFERENCES TownCadaverCleanUp(idCleanUp)
);

ALTER TABLE TownCitizen ADD COLUMN idCadaver INT NULL DEFAULT 0 AFTER dead;