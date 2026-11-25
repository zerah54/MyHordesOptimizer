-- ============================================================
-- Migration : town-nightwatch-simulation
-- Description : simulations de veille par ville (stock hypothétique, dernier jour)
--               et rattachement optionnel d'une proposition de plan à une simulation.
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API.
-- Syntaxe MariaDB, comme les autres scripts.
-- ============================================================

-- idTown : Town.IdTown résolu (clé provisoire -mapId possible, migrée par MigrateTownId) : pas de FK.
-- stock : JSON Dictionary<IdItem, quantité>. version : concurrence optimiste.
CREATE TABLE IF NOT EXISTS TownNightwatchSimulation
(
    idTownNightwatchSimulation
    INT
(
    11
) NOT NULL AUTO_INCREMENT,
    idTown INT
(
    11
) NOT NULL,
    name VARCHAR
(
    64
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    lastDay INT
(
    11
) NOT NULL,
    stock LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
    idTownNightwatchSimulation
),
    KEY TownNightwatchSimulation_idTown
(
    idTown
)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE TownNightwatchPlan
    ADD COLUMN IF NOT EXISTS idTownNightwatchSimulation INT (11) NULL;

CREATE INDEX IF NOT EXISTS TownNightwatchPlan_idSimulation ON TownNightwatchPlan (idTownNightwatchSimulation);
