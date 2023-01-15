CREATE TABLE MapCell(
	idCell INT AUTO_INCREMENT,
	idTown INT,
	idLastUpdateInfo INT,
	x INT NOT NULL,
	y INT NOT NULL,
	isVisitedToday BIT DEFAULT 0,
	dangerLevel INT,
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

ALTER TABLE MapCell
ADD COLUMN isTown BIT NULL DEFAULT 0 AFTER y;

CREATE TABLE MapCellItem(
	idCell INT,
	idItem INT,
	count INT,
	isBroken BIT NOT NULL DEFAULT 0,
	PRIMARY KEY (idCell, idItem, isBroken),
	FOREIGN KEY(idItem) REFERENCES Item(idItem),
	FOREIGN KEY(idCell) REFERENCES MapCell(idCell)
);

ALTER TABLE Town ADD COLUMN x INT NOT NULL;
ALTER TABLE Town ADD COLUMN y INT NOT NULL;
ALTER TABLE Town ADD COLUMN width INT NOT NULL;
ALTER TABLE Town ADD COLUMN height INT NOT NULL;
ALTER TABLE Town ADD COLUMN day INT NOT NULL;
ALTER TABLE Town ADD COLUMN waterWell INT NOT NULL;
ALTER TABLE Town ADD COLUMN isDoorOpen BIT NOT NULL;
ALTER TABLE Town ADD COLUMN isChaos BIT NOT NULL;
ALTER TABLE Town ADD COLUMN isDevasted BIT NOT NULL;

ALTER TABLE TownCitizen ADD COLUMN houseDefense INT NULL DEFAULT NULL AFTER idLastUpdateInfoHeroicAction;

CREATE VIEW MapCellComplet AS 
SELECT mc.idCell
	   ,t.idTown
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
	   ,mc.isTown
       ,lui.dateUpdate AS LastUpdateDateUpdate
       ,u.idUser AS LastUpdateInfoUserId
       ,u.name AS LastUpdateInfoUserName
       ,t.x AS TownX
       ,t.y AS TownY
       ,t.height AS MapHeight
       ,t.width AS MapWidth
       ,t.isChaos
       ,t.isDevasted
       ,t.isDoorOpen
       ,t.waterWell
       ,t.day
       ,citizen.name AS CitizenName
       ,citizen.idUser AS CitizenId
       ,mci.idItem AS ItemId
       ,mci.count AS ItemCount
       ,mci.isBroken AS IsItemBroken
FROM Town t
LEFT JOIN MapCell mc ON t.idTown = mc.idTown
LEFT JOIN MapCellItem mci ON mci.idCell = mc.idCell
LEFT JOIN TownCitizen tc ON tc.idTown = t.idTown AND tc.positionX = mc.x AND tc.positionY = mc.y
LEFT JOIN Users citizen ON citizen.idUser = tc.idUser
LEFT JOIN LastUpdateInfo lui ON lui.idLastUpdateInfo = mc.idLastUpdateInfo
LEFT JOIN Users u ON u.idUser = lui.idUser;

CREATE TABLE MapCellDig(
	idCell INT,
	idUser INT,
	day INT,
	nbSucces INT,
	nbTotalDig INT,
	idLastUpdateInfo INT,
	PRIMARY KEY (idCell, idUser, day),
	FOREIGN KEY(idUser) REFERENCES Users(idUser),
	FOREIGN KEY(idCell) REFERENCES MapCell(idCell),
	FOREIGN KEY(idLastUpdateInfo) REFERENCES LastUpdateInfo(idLastUpdateInfo)
);

CREATE TABLE MapCellDigUpdate(
	idTown INT,
	day INT,
	PRIMARY KEY (idTown, day),
	FOREIGN KEY(idTown) REFERENCES Town(idTown)
)