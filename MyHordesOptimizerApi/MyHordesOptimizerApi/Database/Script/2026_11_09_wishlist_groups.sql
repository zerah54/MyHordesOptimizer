-- ============================================================
-- Migration : wishlist-groups
-- Description : groupes de la liste de courses (par ville, et groupes personnels d'un utilisateur),
--               et rattachement d'une ligne de liste à un groupe.
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API.
-- ============================================================

-- idTown : Town.IdTown résolu (clé provisoire -mapId possible, migrée par MigrateTownId) : pas de FK.
CREATE TABLE IF NOT EXISTS TownWishListGroup
(
    idTown
    INT
    NOT
    NULL,
    uid
    VARCHAR
(
    36
) NOT NULL,
    name VARCHAR
(
    64
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    priority INT NOT NULL,
    zoneXPa INT NOT NULL,
    depot INT NOT NULL,
    count INT NOT NULL,
    PRIMARY KEY
(
    idTown,
    uid
)
    );

ALTER TABLE TownWishListItem
    ADD COLUMN IF NOT EXISTS groupUid VARCHAR (36) NULL;

-- uid/groupUid en VARCHAR et non CHAR(36) : MySqlConnector lirait un CHAR(36) comme un Guid, pas comme un string.
-- Les MODIFY rattrapent une base où le script a déjà été passé avec CHAR(36).
ALTER TABLE TownWishListGroup
    MODIFY COLUMN uid VARCHAR (36) NOT NULL;
ALTER TABLE TownWishListItem
    MODIFY COLUMN groupUid VARCHAR (36) NULL;

-- itemUids : tableau JSON d'uid d'objets.
CREATE TABLE IF NOT EXISTS UserWishListGroup
(
    idUserWishListGroup
    INT
    NOT
    NULL
    AUTO_INCREMENT,
    idUser
    INT
    NOT
    NULL,
    name
    VARCHAR
(
    64
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    itemUids TEXT NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY
(
    idUserWishListGroup
),
    UNIQUE KEY uq_userwishlistgroup_user_name
(
    idUser,
    name
),
    CONSTRAINT fk_userwishlistgroup_user FOREIGN KEY
(
    idUser
) REFERENCES Users
(
    idUser
)
    );
