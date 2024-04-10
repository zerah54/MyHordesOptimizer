CREATE TABLE TownCitizenBath(
idTown INT,
idUser INT,
idLastUpdateInfo INT,
day INT,
PRIMARY KEY (idTown, idUser, idLastUpdateInfo, day),
FOREIGN KEY(idTown) REFERENCES Town(idTown) ON DELETE CASCADE,
FOREIGN KEY(idUser) REFERENCES Users(idUser) ON DELETE CASCADE,
FOREIGN KEY(idLastUpdateInfo) REFERENCES LastUpdateInfo(idLastUpdateInfo) ON DELETE CASCADE
)
