-- ============================================================
-- Migration : user-account
-- Description : Compte utilisateur — avatar, pictos, notes,
--               config script
-- ============================================================

-- ============================================================
-- 1. Users : suppression UserKey, ajout avatar
-- ============================================================
ALTER TABLE Users
DROP
COLUMN UserKey,
    ADD COLUMN avatar VARCHAR(255) NULL;

-- Migration one-shot : peuple Users.avatar depuis la dernière
-- entrée TownCitizen connue (avatar non NULL, idTown le plus récent)
UPDATE Users u
    INNER JOIN (
    SELECT tc.idUser, tc.avatar
    FROM TownCitizen tc
    INNER JOIN (
    SELECT idUser, MAX (idTown) AS latestTown
    FROM TownCitizen
    WHERE avatar IS NOT NULL
    GROUP BY idUser
    ) latest ON tc.idUser = latest.idUser
    AND tc.idTown = latest.latestTown
    ) src
ON u.idUser = src.idUser
    SET u.avatar = src.avatar;

-- ============================================================
-- 2. TownCitizen : suppression avatar (déplacé dans Users)
-- ============================================================
ALTER TABLE TownCitizen DROP COLUMN avatar;

-- ============================================================
-- 3. Picto — référentiel global (alimenté via /json/pictos)
--    idPicto : ID MH, pas d'AUTO_INCREMENT
-- ============================================================
CREATE TABLE Picto
(
    idPicto   INT          NOT NULL,
    img       VARCHAR(255) NOT NULL,
    nameFr    VARCHAR(255) NULL,
    nameEn    VARCHAR(255) NULL,
    nameEs    VARCHAR(255) NULL,
    nameDe    VARCHAR(255) NULL,
    descFr    TEXT NULL,
    descEn    TEXT NULL,
    descEs    TEXT NULL,
    descDe    TEXT NULL,
    rare      BIT          NOT NULL DEFAULT 0,
    community BIT          NOT NULL DEFAULT 0,
    PRIMARY KEY (idPicto)
);

-- ============================================================
-- 4. UserPicto — pictos obtenus par utilisateur
--    Alimenté à la connexion via /me → rewards
--    Alimenté à la demande si le picto est inconnu de Picto
-- ============================================================
CREATE TABLE UserPicto
(
    idUser     INT      NOT NULL,
    idPicto    INT      NOT NULL,
    count      INT      NOT NULL DEFAULT 0,
    lastUpdate DATETIME NOT NULL,
    PRIMARY KEY (idUser, idPicto),
    CONSTRAINT fk_userpicto_user FOREIGN KEY (idUser) REFERENCES Users (idUser),
    CONSTRAINT fk_userpicto_picto FOREIGN KEY (idPicto) REFERENCES Picto (idPicto)
);

-- ============================================================
-- 5. UserScriptConfig — sets de paramètres nommés du script
--    Un utilisateur peut avoir plusieurs sets nommés
-- ============================================================
CREATE TABLE UserScriptConfig
(
    idUserScriptConfig INT          NOT NULL AUTO_INCREMENT,
    idUser             INT          NOT NULL,
    configName         VARCHAR(100) NOT NULL,
    configData         JSON         NOT NULL,
    createdAt          DATETIME     NOT NULL,
    updatedAt          DATETIME     NOT NULL,
    PRIMARY KEY (idUserScriptConfig),
    UNIQUE KEY uq_user_configname (idUser, configName),
    CONSTRAINT fk_scriptconfig_user FOREIGN KEY (idUser) REFERENCES Users (idUser)
);

-- ============================================================
-- 6. UserNote — notes privées d'un utilisateur sur un autre
--    idTown = 0  → note globale (sentinelle, pas de FK)
--    idTown > 0  → note contextualisée à une ville commune
--    La contrainte UNIQUE garantit une seule note par
--    (auteur, cible, contexte)
-- ============================================================
CREATE TABLE UserNote
(
    idUserNote   INT      NOT NULL AUTO_INCREMENT,
    idUserAuthor INT      NOT NULL,
    idUserTarget INT      NOT NULL,
    idTown       INT      NOT NULL DEFAULT 0,
    note         TEXT     NOT NULL,
    updatedAt    DATETIME NOT NULL,
    PRIMARY KEY (idUserNote),
    UNIQUE KEY uq_author_target_town (idUserAuthor, idUserTarget, idTown),
    CONSTRAINT fk_usernote_author FOREIGN KEY (idUserAuthor) REFERENCES Users (idUser),
    CONSTRAINT fk_usernote_target FOREIGN KEY (idUserTarget) REFERENCES Users (idUser)
);
