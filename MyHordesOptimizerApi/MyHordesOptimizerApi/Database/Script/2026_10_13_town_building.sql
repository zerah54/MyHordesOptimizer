-- ============================================================
-- Migration : town-building
-- Description : état des chantiers d'une ville (construits ou non) et
--               défense de la ville, remplacés à chaque mise à jour des outils.
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API.
-- ============================================================

-- idTown : Town.IdTown résolu (clé provisoire -mapId possible, migrée par MigrateTownId) : pas de FK.
-- idBuilding : Building.idBuilding (clé MHO ; l'id MyHordes est résolu via Building.mhId à l'écriture).
-- apRemaining : PA restants BRUTS (paCurrent - investis), sans réduction d'atelier.
-- resourcesCurrent : JSON [{"itemId":int,"count":int}] (idItem MHO), ressources réelles dans la ville.
CREATE TABLE IF NOT EXISTS TownBuilding
(
    idTown
    INT
(
    11
) NOT NULL,
    idBuilding INT
(
    11
) NOT NULL,
    isBuilt TINYINT
(
    1
) NOT NULL DEFAULT 0,
    paCurrent INT
(
    11
) NULL,
    apRemaining INT
(
    11
) NULL,
    life INT
(
    11
) NULL,
    maxLife INT
(
    11
) NULL,
    def INT
(
    11
) NULL,
    level INT
(
    11
) NULL,
    difficulty INT
(
    11
) NULL,
    resourcesCurrent LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    idLastUpdateInfo INT
(
    11
) NULL,
    PRIMARY KEY
(
    idTown,
    idBuilding
),
    KEY TownBuilding_idTown
(
    idTown
)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Défense de la ville (city.defense), une ligne par ville, remplacée à chaque mise à jour des outils.
-- Sert de point de départ à la défense projetée de l'outil de planification.
CREATE TABLE IF NOT EXISTS TownDefense
(
    idTown
    INT
(
    11
) NOT NULL,
    total INT
(
    11
) NULL,
    base INT
(
    11
) NULL,
    buildings INT
(
    11
) NULL,
    upgrades INT
(
    11
) NULL,
    items INT
(
    11
) NULL,
    itemsMul DOUBLE NULL,
    citizenHomes INT
(
    11
) NULL,
    citizenGuardians INT
(
    11
) NULL,
    watchmen INT
(
    11
) NULL,
    souls INT
(
    11
) NULL,
    temp INT
(
    11
) NULL,
    cadavers INT
(
    11
) NULL,
    bonus DOUBLE NULL,
    idLastUpdateInfo INT
(
    11
) NULL,
    PRIMARY KEY
(
    idTown
)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
