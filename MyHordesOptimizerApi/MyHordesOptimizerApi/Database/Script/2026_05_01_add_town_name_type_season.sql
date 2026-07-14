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
    ADD COLUMN IF NOT EXISTS name       VARCHAR(255) CHARACTER SET utf8mb4 NULL,
    ADD COLUMN IF NOT EXISTS townType   INT          NULL,
    ADD COLUMN IF NOT EXISTS season     INT          NULL,
    ADD COLUMN IF NOT EXISTS phase      INT          NULL,
    ADD COLUMN IF NOT EXISTS language   VARCHAR(10)  CHARACTER SET utf8mb4 NULL,
    ADD COLUMN IF NOT EXISTS score      INT          NULL,
    ADD COLUMN IF NOT EXISTS isFinished BIT          NOT NULL DEFAULT 0;
    ADD COLUMN IF NOT EXISTS mapId      INT          NULL;  

-- ============================================================
-- 2. Season — référentiel des saisons
-- ============================================================
CREATE TABLE IF NOT EXISTS Season (
    idSeason   INT NOT NULL,
    isCurrent  BIT NOT NULL DEFAULT 0,
    isFinished BIT NOT NULL DEFAULT 0,
    PRIMARY KEY (idSeason)
);

-- ============================================================
-- 3. TownPublicCitizen — citoyens des anciennes villes
--    msg et comment sont des chaînes dans l'API MH (/json/towns)
--    utf8mb4 requis pour les noms avec emojis
-- ============================================================
CREATE TABLE IF NOT EXISTS TownPublicCitizen (
    idTown      INT                              NOT NULL,
    idUser      INT                              NOT NULL,
    name        VARCHAR(255) CHARACTER SET utf8mb4 NULL,
    avatar      VARCHAR(255) CHARACTER SET utf8mb4 NULL,
    survivalDay INT                              NULL,
    score       INT                              NULL,
    deathTypeId INT                              NULL,
    message     TEXT         CHARACTER SET utf8mb4 NULL,
    comment     TEXT         CHARACTER SET utf8mb4 NULL,
    PRIMARY KEY (idTown, idUser),
    CONSTRAINT FK_TownPublicCitizen_Town
        FOREIGN KEY (idTown) REFERENCES Town(idTown)
);

-- Correction si la table existait déjà avec NVARCHAR (utf8 3 octets)
ALTER TABLE TownPublicCitizen
    MODIFY COLUMN name    VARCHAR(255) CHARACTER SET utf8mb4 NULL,
    MODIFY COLUMN avatar  VARCHAR(255) CHARACTER SET utf8mb4 NULL,
    MODIFY COLUMN message TEXT         CHARACTER SET utf8mb4 NULL,
    MODIFY COLUMN comment TEXT         CHARACTER SET utf8mb4 NULL;
