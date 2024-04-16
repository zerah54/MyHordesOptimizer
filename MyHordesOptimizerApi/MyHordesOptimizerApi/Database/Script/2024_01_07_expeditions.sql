CREATE TABLE Expedition(
	idExpedition INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
	idTown INT,
	idLastUpdateInfo INT,
	day INT,
	state NVARCHAR(255),
	label NVARCHAR(255),
	minPdc INT,
	FOREIGN KEY(idTown) REFERENCES Town(idTown),
	FOREIGN KEY(idLastUpdateInfo) REFERENCES LastUpdateInfo(idLastUpdateInfo)
);

CREATE TABLE ExpeditionPart(
	idExpeditionPart INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
	idExpedition INT,
	path NVARCHAR(255),
	label NVARCHAR(255),
	direction NVARCHAR(255),
	FOREIGN KEY(idExpedition) REFERENCES Expedition(idExpedition)
);

CREATE TABLE ExpeditionBag(
	idExpeditionBag INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
	idItem INT,
	count INT,
	isBroken BIT,
	FOREIGN KEY(idItem) REFERENCES Item(idItem)
);

CREATE TABLE ExpeditionCitizen(
	idExpeditionCitizen INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
	idExpeditionPart INT,
	idUser INT,
	idExpeditionBag INT,
	isPreinscrit BIT NOT NULL,
    preinscritJob NVARCHAR(255),
    preinscritHeroic NVARCHAR(255),
    pdc INT,
    isThirsty BIT,
	FOREIGN KEY(idExpeditionPart) REFERENCES ExpeditionPart(idExpeditionPart),
	FOREIGN KEY(idUser) REFERENCES Users(idUser),
	FOREIGN KEY(preinscritHeroic) REFERENCES HeroSkills(name),
	FOREIGN KEY(idExpeditionBag) REFERENCES ExpeditionBag(idExpeditionBag)
);

CREATE TABLE ExpeditionOrder(
	idExpeditionOrder INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
	type NVARCHAR(255),
	text LONGTEXT,
	position INT NOT NULL,
	isDone BIT
);

CREATE TABLE ExpeditionCitizenOrder(
	idExpeditionOrder INT,
	idExpeditionCitizen INT,
	PRIMARY KEY (idExpeditionOrder, idExpeditionCitizen),
	FOREIGN KEY(idExpeditionOrder) REFERENCES ExpeditionOrder(idExpeditionOrder),
	FOREIGN KEY(idExpeditionCitizen) REFERENCES ExpeditionCitizen(idExpeditionCitizen)
);

CREATE TABLE ExpeditionPartOrder(
	idExpeditionOrder INT,
	idExpeditionPart INT,
	PRIMARY KEY (idExpeditionOrder, idExpeditionPart),
	FOREIGN KEY(idExpeditionOrder) REFERENCES ExpeditionOrder(idExpeditionOrder),
	FOREIGN KEY(idExpeditionPart) REFERENCES ExpeditionPart(idExpeditionPart)
);

ALTER TABLE Users MODIFY UserKey varchar(255) NULL;

ALTER TABLE BagItem
ADD CONSTRAINT BagItem_fk_bag 
FOREIGN KEY (idBag) 
REFERENCES Bag(idBag);

ALTER TABLE Bag
ADD CONSTRAINT BagItem_fk_lastupdate
FOREIGN KEY (idLastUpdateInfo) 
REFERENCES LastUpdateInfo(idLastUpdateInfo);

ALTER TABLE RuinItemDrop
drop CONSTRAINT RuinItemDrop_ibfk_1;
ALTER TABLE RuinItemDrop
ADD CONSTRAINT RuinItemDrop_ibfk_1
    FOREIGN KEY (Idruin)
    REFERENCES Ruin(Idruin)
    ON DELETE CASCADE;

ALTER TABLE Town
ADD CONSTRAINT Town_fkuserwishlist
	FOREIGN KEY(idUserWishListUpdater)
	REFERENCES Users(idUser);