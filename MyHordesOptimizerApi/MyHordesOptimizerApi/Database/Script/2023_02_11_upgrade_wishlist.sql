CREATE TABLE WishlistCategorie
(
	idCategory INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
	idUserAuthor INT NULL,
	name NVARCHAR(255) NOT NULL,
	label_fr NVARCHAR(255),
	label_en NVARCHAR(255),
	label_es NVARCHAR(255),
	label_de NVARCHAR(255),
	FOREIGN KEY(idUserAuthor) REFERENCES Users(idUser)
);

CREATE TABLE WishlistCategorieItem
(
   idCategory INT NOT NULL,
   idItem INT NOT NULL,
   PRIMARY KEY (idCategory, idItem),
   FOREIGN KEY(idItem) REFERENCES Item(idItem),
   FOREIGN KEY(idCategory) REFERENCES WishlistCategorie(idCategory)
);

ALTER TABLE TownWishListItem ADD COLUMN zoneXPa INT DEFAULT 0 AFTER priority;

CREATE TABLE DefaultWishlistItem
(
   idDefaultWishlist INT NOT NULL,
   idItem INT NOT NULL,
   idUserAuthor INT NULL,
   name NVARCHAR(255) NOT NULL,
   label_fr NVARCHAR(255),
   label_en NVARCHAR(255),
   label_es NVARCHAR(255),
   label_de NVARCHAR(255),
   count INT DEFAULT 0,
   priority INT DEFAULT 0,
   zoneXPa INT DEFAULT 0,
   PRIMARY KEY (idDefaultWishlist, idItem),
   FOREIGN KEY(idItem) REFERENCES Item(idItem)
);

