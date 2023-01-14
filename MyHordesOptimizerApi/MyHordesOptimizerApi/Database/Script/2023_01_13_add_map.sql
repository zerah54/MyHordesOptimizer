CREATE TABLE MapCell(
	idCell INT AUTO_INCREMENT,
	idTown INT,
	idLastUpdateInfo INT,
	x INT NOT NULL,
	y INT NOT NULL,
	isVisitedToday BIT DEFAULT 0,
	dangerLevel INT NOT NULL,
	idRuin INT,
	isDryed BIT DEFAULT 0,
	nbZombie INT,
	nbZombieKilled INT,
	nbHero INT,
	isRuinCamped BIT,
	isRuinDryed BIT,
	nbRuinDig INT,
	todayNbDigSucces INT,
	previousDayTotalNbDigSucces INT DEFAULT 0,
	averagePotentialRemainingDig INT,
	maxPotentialRemainingDig INT,
	PRIMARY KEY (idCell),
	FOREIGN KEY(idTown) REFERENCES Town(idTown),
	FOREIGN KEY(idLastUpdateInfo) REFERENCES LastUpdateInfo(idLastUpdateInfo),
	FOREIGN KEY(idRuin) REFERENCES Ruin(idRuin)
);

CREATE TABLE MapCellItem(
	idCell INT,
	idItem INT,
	count INT,
	isBroken BIT NOT NULL DEFAULT 0,
	PRIMARY KEY (idCell, idItem),
	FOREIGN KEY(idItem) REFERENCES Item(idItem),
	FOREIGN KEY(idCell) REFERENCES MapCell(idCell)
);