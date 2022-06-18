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
	idProperty INT PRIMARY KEY NOT NULL IDENTITY,
	name NVARCHAR(255)
);

CREATE TABLE HeroSkills(
	idHeroSkill INT PRIMARY KEY NOT NULL IDENTITY,
	name NVARCHAR(255),
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
	idRecipe INT PRIMARY KEY NOT NULL IDENTITY,
	isShamanOnly BIT,
	action_fr NVARCHAR(255),
	action_en NVARCHAR(255),
	action_de NVARCHAR(255),
	action_es NVARCHAR(255),
	name NVARCHAR(255),
	type NVARCHAR(255)
);

CREATE TABLE Action(
	idAction INT PRIMARY KEY NOT NULL IDENTITY,
	name NVARCHAR(255)
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
	idAction INT,
	PRIMARY KEY (idItem, idAction),
	FOREIGN KEY(idItem) REFERENCES Item(idItem),
	FOREIGN KEY(idAction) REFERENCES Action(idAction)
);

CREATE TABLE ItemProperty(
	idItem INT,
	idProperty INT,
	PRIMARY KEY (idItem, idProperty),
	FOREIGN KEY(idItem) REFERENCES Item(idItem),
	FOREIGN KEY(idProperty) REFERENCES Property(idProperty)
);

CREATE TABLE RecipeItemResult(
	idRecipe INT,
	idItem INT,
	weight INT,
	probability FLOAT,
	PRIMARY KEY (idRecipe, idItem),
	FOREIGN KEY(idRecipe) REFERENCES Recipe(idRecipe),
	FOREIGN KEY(idItem) REFERENCES Item(idItem)
);

CREATE TABLE RecipeItemComponent(
	idRecipe INT,
	idItem INT,
	count INT,
	PRIMARY KEY (idRecipe, idItem),
	FOREIGN KEY(idRecipe) REFERENCES Recipe(idRecipe),
	FOREIGN KEY(idItem) REFERENCES Item(idItem)
);
