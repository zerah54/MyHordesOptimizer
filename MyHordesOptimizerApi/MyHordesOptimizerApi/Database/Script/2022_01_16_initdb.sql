CREATE TABLE Category(
	idCategory INT PRIMARY KEY NOT NULL IDENTITY,
	name NVARCHAR(255) NOT NULL,
	label_fr NVARCHAR(255),
	label_en NVARCHAR(255),
	label_es NVARCHAR(255),
	label_de NVARCHAR(255),
	ordering INT
);

CREATE TABLE Property(
	name NVARCHAR(255) PRIMARY KEY NOT NULL
);

CREATE TABLE HeroSkills(
	name NVARCHAR(255) PRIMARY KEY NOT NULL,
	daysNeeded  INT,
	description_fr TEXT,
	description_en TEXT,
	description_es TEXT,
	description_de TEXT,
	icon NVARCHAR(255),
	label_fr TEXT,
	label_en TEXT,
	label_es TEXT,
	label_de TEXT,
	nbUses INT
);

CREATE TABLE Item(
	idItem INT PRIMARY KEY NOT NULL,
	idCategory INT,
	uid NVARCHAR(255),
	deco INT,
	label_fr NVARCHAR(255),
	label_en NVARCHAR(255),
	label_es NVARCHAR(255),
	label_de NVARCHAR(255),
	description_fr NVARCHAR(1000),
	description_en NVARCHAR(1000),
	description_es NVARCHAR(1000),
	description_de NVARCHAR(1000),
	guard INT,
	img NVARCHAR(255),
	isHeaver BIT,
	FOREIGN KEY(idCategory) REFERENCES Category(idCategory),
);

CREATE TABLE Recipe(
	name NVARCHAR(255) PRIMARY KEY NOT NULL,
	action_fr NVARCHAR(255),
	action_en NVARCHAR(255),
	action_de NVARCHAR(255),
	action_es NVARCHAR(255),
	type NVARCHAR(255),
	pictoUid NVARCHAR(255),
	stealthy BIT
);

CREATE TABLE Action(
	name NVARCHAR(255) PRIMARY KEY NOT NULL
);

CREATE TABLE WishList(
	idWishList INT PRIMARY KEY NOT NULL IDENTITY
);

CREATE TABLE Bank(
	idBank INT PRIMARY KEY NOT NULL IDENTITY,
);

CREATE TABLE Town (
	idTown INT PRIMARY KEY NOT NULL
);

CREATE TABLE Citizens(
	idCitizen INT PRIMARY KEY NOT NULL IDENTITY
);

CREATE TABLE Users(
	name NVARCHAR(255) PRIMARY KEY NOT NULL,
	userId INT,
	userKey NVARCHAR(255)
);

CREATE TABLE Ruin(
	idRuin INT PRIMARY KEY NOT NULL,
	label_fr NVARCHAR(255),
	label_en NVARCHAR(255),
	label_es NVARCHAR(255),
	label_de NVARCHAR(255),
	description_fr NVARCHAR(1000),
	description_en NVARCHAR(1000),
	description_es NVARCHAR(1000),
	description_de NVARCHAR(1000),
	explorable BIT,
	img NVARCHAR(255),
	camping INT,
	minDist INT,
	maxDist INT,
	chance INT
);

CREATE TABLE LastUpdateInfo(
	idLastUpdateInfo INT PRIMARY KEY NOT NULL IDENTITY,
	dateUpdate DATETIME2 NOT NULL,
	userName NVARCHAR(255),
	FOREIGN KEY(userName) REFERENCES Users(name)
);

CREATE TABLE TownBank(
	idTown INT,
	idBank INT,
	idLastUpdateInfo INT,
	PRIMARY KEY (idTown, idBank, idLastUpdateInfo),
	FOREIGN KEY(idTown) REFERENCES Town(idTown),
	FOREIGN KEY(idBank) REFERENCES Bank(idBank),
	FOREIGN KEY(idLastUpdateInfo) REFERENCES LastUpdateInfo(idLastUpdateInfo)
);

CREATE TABLE BankItem(
	idBank INT,
	idItem INT,
	count INT,
	isBroken BIT NOT NULL DEFAULT 0,
	FOREIGN KEY(idItem) REFERENCES Item(idItem),
	FOREIGN KEY(idBank) REFERENCES Bank(idBank),
	PRIMARY KEY (idBank, idItem, isBroken)
);

CREATE TABLE CitizensUsers(
	idCitizen INT,
	citizenName NVARCHAR(255),
	homeMessage TEXT,
	jobName TEXT,
	jobUID NVARCHAR(255),
	positionX INT,
	positionY INT,
	isGhost BIT,
	FOREIGN KEY(idCitizen) REFERENCES Citizens(idCitizen),
	FOREIGN KEY(citizenName) REFERENCES Users(name),
	PRIMARY KEY (idCitizen, citizenName)
);

CREATE TABLE TownCitizen(
	idTown INT,
	idCitizen INT,
	idLastUpdateInfo INT,
	PRIMARY KEY (idTown, idCitizen, idLastUpdateInfo),
	FOREIGN KEY(idTown) REFERENCES Town(idTown),
	FOREIGN KEY(idCitizen) REFERENCES Citizens(idCitizen),
	FOREIGN KEY(idLastUpdateInfo) REFERENCES LastUpdateInfo(idLastUpdateInfo)
);

CREATE TABLE TownWishList(
	idTown INT,
	idWishList INT,
	idLastUpdateInfo INT,
	PRIMARY KEY (idTown, idWishList, idLastUpdateInfo),
	FOREIGN KEY(idTown) REFERENCES Town(idTown),
	FOREIGN KEY(idWishList) REFERENCES WishList(idWishList),
	FOREIGN KEY(idLastUpdateInfo) REFERENCES LastUpdateInfo(idLastUpdateInfo)
);

CREATE TABLE WishListItem(
	idWishList INT,
	idItem INT,
	priority INT,
	count INT,
	PRIMARY KEY (idWishList, idItem),
	FOREIGN KEY(idWishList) REFERENCES WishList(idWishList),
	FOREIGN KEY(idItem) REFERENCES Item(idItem)
);

CREATE TABLE ItemAction(
	idItem INT,
	actionName  NVARCHAR(255),
	PRIMARY KEY (idItem, actionName),
	FOREIGN KEY(idItem) REFERENCES Item(idItem),
	FOREIGN KEY(actionName) REFERENCES Action(name)
);

CREATE TABLE ItemProperty(
	idItem INT,
	propertyName NVARCHAR(255),
	PRIMARY KEY (idItem, propertyName),
	FOREIGN KEY(idItem) REFERENCES Item(idItem),
	FOREIGN KEY(propertyName) REFERENCES Property(name)
);

CREATE TABLE RecipeItemResult(
	recipeName NVARCHAR(255),
	idItem INT,
	weight INT,
	probability FLOAT,
	PRIMARY KEY (recipeName, idItem, probability),
	FOREIGN KEY(recipeName) REFERENCES Recipe(name),
	FOREIGN KEY(idItem) REFERENCES Item(idItem)
);

CREATE TABLE RecipeItemComponent(
	recipeName NVARCHAR(255),
	idItem INT,
	count INT,
	PRIMARY KEY (recipeName, idItem),
	FOREIGN KEY(recipeName) REFERENCES Recipe(name),
	FOREIGN KEY(idItem) REFERENCES Item(idItem)
);

CREATE TABLE RuinItemDrop(
	idRuin INT,
	idItem INT,
	weight INT,
	probability FLOAT,
	PRIMARY KEY (idRuin, idItem),
	FOREIGN KEY(idRuin) REFERENCES Ruin(idRuin),
	FOREIGN KEY(idItem) REFERENCES Item(idItem)
);
GO

CREATE VIEW ItemComplet 
AS SELECT item.idItem AS idItem
      ,item.idCategory AS idCategory
      ,item.uid AS itemUid
      ,item.deco AS itemDeco
      ,item.label_fr AS itemLabel_fr
      ,item.label_en AS itemLabel_en
      ,item.label_es AS itemLabel_es
      ,item.label_de AS itemLabel_de
      ,item.description_fr AS itemDescription_fr
      ,item.description_en AS itemDescription_en
      ,item.description_es AS itemDescription_es
      ,item.description_de AS itemDescription_de
      ,item.guard AS itemGuard
      ,item.img AS itemImg
      ,item.isHeaver as itemIsHeaver
	  ,cat.name AS catName
	  ,cat.ordering AS catOrdering
	  ,cat.label_fr AS catLabel_fr
	  ,cat.label_en AS catLabel_en
	  ,cat.label_es AS catLabel_es
	  ,cat.label_de AS catLabel_de
	  ,a.name AS actionName
	  ,p.name AS propertyName
  FROM Item item
  LEFT JOIN ItemAction ie ON ie.idItem = item.idItem
  LEFT JOIN Category cat ON cat.idCategory = item.idCategory
  LEFT JOIN Action a ON a.name = ie.actionName
  LEFT JOIN ItemProperty ip ON ip.idItem = item.idItem
  LEFT JOIN Property p ON ip.propertyName = p.name;
  GO

CREATE VIEW RuinComplete AS 
SELECT r.idRuin AS idRuin
      ,r.label_fr AS ruinLabel_fr
      ,r.label_en AS ruinLabel_en
      ,r.label_es AS ruinLabel_es
      ,r.label_de AS ruinLabel_de
      ,r.description_fr AS ruinDescription_fr
      ,r.description_en AS ruinDescription_en
      ,r.description_es AS ruinDescription_es
      ,r.description_de AS ruinDescription_de
      ,r.explorable AS ruinExplorable
      ,r.img AS ruinImg
      ,r.camping AS ruinCamping
      ,r.minDist AS ruinMinDist
      ,r.maxDist AS ruinMaxDist
      ,r.chance AS ruinChance
	  ,i.idItem AS idItem
	  ,i.uid AS itemUid
	  ,i.label_fr AS itemLabel_fr
	  ,rid.probability AS dropProbability
	  ,rid.weight AS dropWeight
  FROM renack_myhordesoptimizer.dbo.Ruin r
  LEFT JOIN RuinItemDrop rid ON rid.idRuin = r.idRuin
  LEFT JOIN Item i ON i.idItem = rid.idItem
  GO