 CREATE TABLE TownCitizenItem(
	idTown INT,
	idUser INT,
	idItem INT,
	idLastUpdateInfo INT,
	count INT,
	isBroken BIT NOT NULL DEFAULT 0,
	PRIMARY KEY (idTown, idItem, idUser, idLastUpdateInfo, isBroken),
	FOREIGN KEY(idTown) REFERENCES Town(idTown),
	FOREIGN KEY(idItem) REFERENCES Item(idItem),
	FOREIGN KEY(idUser) REFERENCES Users(idUser),
	FOREIGN KEY(idLastUpdateInfo) REFERENCES LastUpdateInfo(idLastUpdateInfo)
);

ALTER TABLE TownCitizen
ADD COLUMN avatar VARCHAR(255) NULL DEFAULT NULL AFTER idLastUpdateInfo;


DROP TABLE TownCitizenItem;

CREATE TABLE Bag(
	idBag INT AUTO_INCREMENT,
	idLastUpdateInfo INT,
	PRIMARY KEY (idBag)
);

CREATE TABLE BagItem(
	idBag INT,
	idItem INT,
	count INT,
	isBroken BIT NOT NULL DEFAULT 0,
	PRIMARY KEY (idBag, idItem),
	FOREIGN KEY(idItem) REFERENCES Item(idItem)
);

ALTER TABLE TownCitizen
ADD COLUMN idBag INT NULL DEFAULT NULL REFERENCES Bag(idBag);