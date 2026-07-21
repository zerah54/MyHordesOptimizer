-- ============================================================
-- Migration : town-season-import
-- Description : Champs Town issus de /json/towns + tables
--               Season et TownPublicCitizen
-- ============================================================

-- ============================================================
-- 1. Town — champs complémentaires issus de /json/towns
--    (idempotent : ignore les colonnes déjà présentes)
-- ============================================================
ALTER TABLE Town
    ADD COLUMN IF NOT EXISTS language NVARCHAR(10) NULL,
    ADD COLUMN IF NOT EXISTS score INT NULL,
    ADD COLUMN IF NOT EXISTS soulPoints INT NULL,
    ADD COLUMN IF NOT EXISTS isFinished BIT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS idLastUpdateInfoApiSync INT NULL;

ALTER TABLE Town
    ADD CONSTRAINT IF NOT EXISTS FK_Town_LastUpdateInfoApiSync
    FOREIGN KEY (idLastUpdateInfoApiSync) REFERENCES LastUpdateInfo(idLastUpdateInfo);

-- ============================================================
-- 2. Season — référentiel des saisons
-- ============================================================
CREATE TABLE IF NOT EXISTS Season
(
    idSeason
    INT
    NOT
    NULL,
    isCurrent
    BIT
    NOT
    NULL
    DEFAULT
    0,
    isFinished
    BIT
    NOT
    NULL
    DEFAULT
    0,
    idLastUpdateInfoSync
    INT
    NULL,
    PRIMARY
    KEY
(
    idSeason
),
    CONSTRAINT FK_Season_LastUpdateInfo
    FOREIGN KEY
(
    idLastUpdateInfoSync
) REFERENCES LastUpdateInfo
(
    idLastUpdateInfo
)
    );

-- ============================================================
-- 3. TownPublicCitizen — citoyens des anciennes villes
-- ============================================================
CREATE TABLE IF NOT EXISTS TownPublicCitizen
(
    idTown
    INT
    NOT
    NULL,
    idUser
    INT
    NOT
    NULL,
    name
    NVARCHAR
(
    255
) NULL,
    avatar NVARCHAR
(
    255
) NULL,
    survivalDay INT NULL,
    score INT NULL,
    deathTypeId INT NULL,
    message TEXT NULL,
    comment TEXT NULL,
    PRIMARY KEY
(
    idTown,
    idUser
),
    CONSTRAINT FK_TownPublicCitizen_Town
    FOREIGN KEY
(
    idTown
) REFERENCES Town
(
    idTown
)
    );
