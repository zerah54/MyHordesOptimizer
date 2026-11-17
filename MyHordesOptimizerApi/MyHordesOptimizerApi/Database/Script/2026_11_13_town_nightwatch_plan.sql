-- ============================================================
-- Migration : town-nightwatch-plan
-- Description : propositions de plan de veille par ville et par jour.
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API.
-- ============================================================

-- idTown : Town.IdTown résolu (clé provisoire -mapId possible, migrée par MigrateTownId) : pas de FK.
-- content : JSON typé côté API (NightwatchPlanContentDto).
-- isEffective : une seule proposition effective par (idTown, day), garantie par le service (transaction).
-- version : concurrence optimiste, incrémentée à chaque modification.
CREATE TABLE IF NOT EXISTS TownNightwatchPlan
(
    idTownNightwatchPlan
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
    idTownNightwatchPlan
),
    KEY TownNightwatchPlan_idTown_day
(
    idTown,
    day
)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
