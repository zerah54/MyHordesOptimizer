-- ============================================================
-- Migration : affinage-mixte
-- Description : âmes et niveau SPA par famille d'estimation (tour,
--               planificateur), réglages d'attaque par jour attaqué
--               (âmes, SPA, feux d'artifice) et affinages d'attaque
--               partagés par ville (candidats seed/configuration).
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API.
-- ============================================================

DELIMITER
$$

BEGIN
NOT ATOMIC
    IF NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'TownEstimation'
                     AND COLUMN_NAME = 'souls') THEN
ALTER TABLE TownEstimation
    ADD COLUMN souls LONGTEXT NULL,
            ADD COLUMN spaLevel INT(11)  NULL;
END IF;
END $$

DELIMITER ;

-- idTown : Town.IdTown résolu (peut être une clé provisoire -mapId, migrée par MigrateTownId).
-- day : jour attaqué.
CREATE TABLE IF NOT EXISTS TownAttackSetting
(
    idTown
    INT
(
    11
) NOT NULL,
    day INT
(
    11
) NOT NULL,
    souls INT
(
    11
) NULL,
    spaLevel INT
(
    11
) NULL,
    fireworks BIT
(
    1
) NOT NULL DEFAULT b'0',
    idLastUpdateInfo INT
(
    11
) NULL,
    PRIMARY KEY
(
    idTown,
    day
)
    );

-- candidates : couples (seed uint32 LE, somme uint8, base uint8), 6 octets chacun ; NULL après purge.
CREATE TABLE IF NOT EXISTS TownAttackRefinement
(
    idTown
    INT
(
    11
) NOT NULL,
    day INT
(
    11
) NOT NULL,
    input LONGTEXT NOT NULL,
    candidates LONGBLOB NULL,
    candidateCount INT
(
    11
) NOT NULL,
    status VARCHAR
(
    16
) NOT NULL,
    stale BIT
(
    1
) NOT NULL DEFAULT b'0',
    valueMin INT
(
    11
) NULL,
    valueMax INT
(
    11
) NULL,
    reductionMin INT
(
    11
) NULL,
    reductionMax INT
(
    11
) NULL,
    idLastUpdateInfo INT
(
    11
) NULL,
    computedAt DATETIME NOT NULL,
    PRIMARY KEY
(
    idTown,
    day
)
    );
