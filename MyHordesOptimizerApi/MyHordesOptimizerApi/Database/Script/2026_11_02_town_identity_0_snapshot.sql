-- ----------------------------------------------------------------------------
-- 2026_11_02 — Identité des villes : instantané de vérité
--
-- Réponse brute de /json/towns pour les villes suspectes, avant toute réparation.
-- Additif et rejouable. À lancer sur MHO_BETA, puis sur mho avant de livrer la capture.
-- ----------------------------------------------------------------------------

-- rankingId et non idTown : ces tables n'ont pas à suivre le re-clé des villes
CREATE TABLE IF NOT EXISTS TownRankingSnapshot
(
    rankingId
    INT
(
    11
) NOT NULL,
    mapId INT
(
    11
) NULL,
    phaseLabel VARCHAR
(
    16
) NULL,
    season INT
(
    11
) NULL,
    language VARCHAR
(
    10
) NULL,
    name VARCHAR
(
    255
) NULL,
    day INT
(
    11
) NULL,
    score INT
(
    11
) NULL,
    suspectClass VARCHAR
(
    8
) NOT NULL,
    isAbsent TINYINT
(
    1
) NOT NULL,
    capturedAt DATETIME NOT NULL,
    PRIMARY KEY
(
    rankingId
)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- NVARCHAR vaut utf8mb3 sous MariaDB : un nom de ville avec emoji ferait échouer tout un lot
ALTER TABLE TownRankingSnapshot CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Sans FK vers Users : un citoyen de l'instantané peut être inconnu de notre base
CREATE TABLE IF NOT EXISTS TownRankingSnapshotCitizen
(
    rankingId
    INT
(
    11
) NOT NULL,
    idUser INT
(
    11
) NOT NULL,
    PRIMARY KEY
(
    rankingId,
    idUser
)
    );
