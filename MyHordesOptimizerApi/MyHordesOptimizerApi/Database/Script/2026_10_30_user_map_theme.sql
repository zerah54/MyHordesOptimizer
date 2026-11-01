-- ============================================================
-- Migration : user-map-theme
-- Description : Thèmes de couleurs de carte d'un utilisateur et thème actif.
-- ============================================================
CREATE TABLE UserMapTheme
(
    idUserMapTheme INT                                                          NOT NULL AUTO_INCREMENT,
    idUser         INT                                                          NOT NULL,
    name           VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    colors         TEXT                                                         NOT NULL,
    updatedAt      DATETIME                                                     NOT NULL,
    PRIMARY KEY (idUserMapTheme),
    UNIQUE KEY uq_usermaptheme_user_name (idUser, name),
    CONSTRAINT fk_usermaptheme_user FOREIGN KEY (idUser) REFERENCES Users (idUser)
);

CREATE TABLE UserMapThemePreference
(
    idUser        INT NOT NULL,
    activeThemeId INT NULL,
    PRIMARY KEY (idUser),
    CONSTRAINT fk_usermapthemepref_user FOREIGN KEY (idUser) REFERENCES Users (idUser),
    CONSTRAINT fk_usermapthemepref_theme FOREIGN KEY (activeThemeId) REFERENCES UserMapTheme (idUserMapTheme) ON DELETE SET NULL
);
