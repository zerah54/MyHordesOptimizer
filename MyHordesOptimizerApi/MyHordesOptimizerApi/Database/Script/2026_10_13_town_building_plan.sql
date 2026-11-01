-- ============================================================
-- Migration : town-building-plan
-- Description : propositions de plan de chantiers par ville et par jour,
--               et réglages de valeur des objets (équivalent PA) par ville.
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API.
-- ============================================================

-- idTown : Town.IdTown résolu (clé provisoire -mapId possible, migrée par MigrateTownId) : pas de FK.
-- content : JSON typé côté API (BuildingPlanContentDto).
-- isEffective : une seule proposition effective par (idTown, day), garantie par le service (transaction).
-- version : concurrence optimiste, incrémentée à chaque modification.
CREATE TABLE IF NOT EXISTS TownBuildingPlan
(
    idTownBuildingPlan
    INT
(
    11
) NOT NULL AUTO_INCREMENT,
    idTown INT
(
    11
) NOT NULL,
    day INT
(
    11
) NOT NULL,
    name VARCHAR
(
    64
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    isEffective TINYINT
(
    1
) NOT NULL DEFAULT 0,
    content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    version INT
(
    11
) NOT NULL DEFAULT 0,
    idAuthor INT
(
    11
) NOT NULL,
    idLastUpdateInfo INT
(
    11
) NULL,
    PRIMARY KEY
(
    idTownBuildingPlan
),
    KEY TownBuildingPlan_idTown_day
(
    idTown,
    day
)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- itemValues : JSON {"<idItem>": <PA>} ; pas de ligne = aucune valeur saisie.
CREATE TABLE IF NOT EXISTS TownBuildingPlanSettings
(
    idTown
    INT
(
    11
) NOT NULL,
    itemValues LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    version INT
(
    11
) NOT NULL DEFAULT 0,
    idLastUpdateInfo INT
(
    11
) NULL,
    PRIMARY KEY
(
    idTown
)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
