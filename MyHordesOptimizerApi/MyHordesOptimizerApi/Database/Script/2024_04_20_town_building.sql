CREATE TABLE Building(
	idBuilding INT PRIMARY KEY NOT NULL,
	uid NVARCHAR(255) NOT NULL,
	icone NVARCHAR(255),
	label_fr NVARCHAR(255),
	label_en NVARCHAR(255),
	label_es NVARCHAR(255),
	label_de NVARCHAR(255),
	description_fr TEXT,
	description_en TEXT,
	description_es TEXT,
	description_de TEXT,
	nbPaRequired INT NOT NULL,
	maxLife INT NOT NULL,
	breakable BIT NOT NULL,
	defence INT NOT NULL,
	hasUpgrade BIT NOT NULL,
	rarity INT NOT NULL,
	temporary BIT NOT NULL,
	idBuildingParent INT NOT NULL,
	watchBonus INT NOT NULL DEFAULT(0),
	FOREIGN KEY(idBuildingParent) REFERENCES Building(idBuilding)
);

CREATE TABLE BuildingRessources(
	idBuilding INT NOT NULL,
	idItem INT NOT NULL,
	count INT NOT NULL,
	PRIMARY KEY (idBuilding, idItem),
	FOREIGN KEY(idBuilding) REFERENCES Building(idBuilding),
	FOREIGN KEY(idItem) REFERENCES Item(idItem)
);

CREATE TABLE RuinBlueprint(
	idRuin INT NOT NULL,
	idBuilding INT NOT NULL,
	PRIMARY KEY (idRuin, idBuilding),
	FOREIGN KEY(idRuin) REFERENCES Ruin(idRuin),
);

ALTER TABLE Building
MODIFY COLUMN idBuildingParent INT NULL;

CREATE TABLE Jobs(
	jobUID NVARCHAR(30),
	baseWatchSurvival INT NOT NULL,
	PRIMARY KEY (jobUID)
);

ALTER TABLE Building
DROP COLUMN watchBonus;

ALTER TABLE Building
ADD COLUMN watchSurvivalBonusUpgradeLevelRequired INT NOT NULL DEFAULT(0);

CREATE TABLE BuildingWatchSurvivalBonusJobs(
	idBuilding INT NOT NULL,
	jobUID NVARCHAR(30) NOT NULL,
	watchSurvivalBonus INT NOT NULL,
	PRIMARY KEY(idBuilding, jobUID),
	FOREIGN KEY(idBuilding) REFERENCES Building(idBuilding),
	FOREIGN KEY(jobUID) REFERENCES Jobs(jobUID)
);