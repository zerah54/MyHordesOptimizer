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

CREATE VIEW MapCellComplet AS 
SELECT mc.idCell
	   ,mc.idTown
       ,mc.idLastUpdateInfo
       ,mc.x
       ,mc.y
       ,mc.isVisitedToday
       ,mc.dangerLevel
       ,mc.idRuin
       ,mc.isDryed
       ,mc.nbZombie
       ,mc.nbZombieKilled
       ,mc.nbHero
       ,mc.isRuinCamped
       ,mc.isRuinDryed
       ,mc.nbRuinDig
       ,mc.todayNbDigSucces
       ,mc.previousDayTotalNbDigSucces
       ,mc.averagePotentialRemainingDig
       ,mc.maxPotentialRemainingDig
       ,lui.dateUpdate AS LastUpdateDateUpdate
       ,u.idUser AS LastUpdateInfoUserId
       ,u.name AS LastUpdateInfoUserName
FROM MapCell mc
INNER JOIN LastUpdateInfo lui ON lui.idLastUpdateInfo = mc.idLastUpdateInfo
INNER JOIN Users u ON u.idUser = lui.idUser;


CREATE TABLE MapCellDig(
	idCell INT,
	idUser INT,
	dateUpdate datetime NOT NULL,
	nbSucces INT,
	PRIMARY KEY (idCell, idUser, dateUpdate),
	FOREIGN KEY(idUser) REFERENCES Users(idUser),
	FOREIGN KEY(idCell) REFERENCES MapCell(idCell)
);