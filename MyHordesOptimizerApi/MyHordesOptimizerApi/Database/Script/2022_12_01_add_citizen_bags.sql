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
