CREATE TABLE TownCitizenDailyAction
(
    idTown           INT,
    idUser           INT,
    idLastUpdateInfo INT,
    day              INT,
    actionKey        VARCHAR(64),
    PRIMARY KEY (idTown, idUser, idLastUpdateInfo, day, actionKey),
    FOREIGN KEY (idTown) REFERENCES Town (idTown) ON DELETE CASCADE,
    FOREIGN KEY (idUser) REFERENCES Users (idUser) ON DELETE CASCADE,
    FOREIGN KEY (idLastUpdateInfo) REFERENCES LastUpdateInfo (idLastUpdateInfo) ON DELETE CASCADE
);

INSERT INTO TownCitizenDailyAction (idTown, idUser, idLastUpdateInfo, day, actionKey)
SELECT idTown, idUser, idLastUpdateInfo, day, 'home_pool'
FROM TownCitizenBath;

DROP TABLE TownCitizenBath;
