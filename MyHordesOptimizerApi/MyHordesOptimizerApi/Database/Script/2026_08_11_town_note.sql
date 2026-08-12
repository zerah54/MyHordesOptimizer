-- ============================================================
-- Migration : town-note
-- Description : Note privée d'un utilisateur sur une ville.
-- ============================================================
CREATE TABLE TownNote
(
    idTownNote   INT      NOT NULL AUTO_INCREMENT,
    idUserAuthor INT      NOT NULL,
    idTown       INT      NOT NULL,
    note         TEXT     NOT NULL,
    updatedAt    DATETIME NOT NULL,
    PRIMARY KEY (idTownNote),
    UNIQUE KEY uq_author_town (idUserAuthor, idTown),
    CONSTRAINT fk_townnote_author FOREIGN KEY (idUserAuthor) REFERENCES Users (idUser)
);
