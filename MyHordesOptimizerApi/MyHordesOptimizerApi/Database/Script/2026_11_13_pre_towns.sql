-- ============================================================
-- Migration : pre-towns
-- Description : pré-villes (préparation d'une ville avant son lancement), membres et journal de lien.
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API.
-- ============================================================

-- linkedIdTown : Town.IdTown de la ville réelle rattachée (pas de FK) ; l'index unique accepte plusieurs NULL.
CREATE TABLE IF NOT EXISTS PreTown
(
    idPreTown
    INT
(
    11
) NOT NULL AUTO_INCREMENT,
    alias VARCHAR
(
    64
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    idCreator INT
(
    11
) NOT NULL,
    createdAt DATETIME NOT NULL,
    linkedIdTown INT
(
    11
) NULL,
    linkedMapId INT
(
    11
) NULL,
    linkedAt DATETIME NULL,
    idLinker INT
(
    11
) NULL,
    PRIMARY KEY
(
    idPreTown
),
    UNIQUE KEY PreTown_linkedIdTown
(
    linkedIdTown
)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS PreTownMember
(
    idPreTown
    INT
(
    11
) NOT NULL,
    idUser INT
(
    11
) NOT NULL,
    isOrganizer TINYINT
(
    1
) NOT NULL DEFAULT 0,
    addedAt DATETIME NOT NULL,
    seen TINYINT
(
    1
) NOT NULL DEFAULT 0,
    PRIMARY KEY
(
    idPreTown,
    idUser
),
    KEY PreTownMember_idUser
(
    idUser
)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- tableName / rowKey : ligne de la ville fantôme réaffectée à la ville réelle.
CREATE TABLE IF NOT EXISTS PreTownLinkEntry
(
    idPreTownLinkEntry
    INT
(
    11
) NOT NULL AUTO_INCREMENT,
    idPreTown INT
(
    11
) NOT NULL,
    tableName VARCHAR
(
    64
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    rowKey VARCHAR
(
    128
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY
(
    idPreTownLinkEntry
),
    KEY PreTownLinkEntry_idPreTown
(
    idPreTown
)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
