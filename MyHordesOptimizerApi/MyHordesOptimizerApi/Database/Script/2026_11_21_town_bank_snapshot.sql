-- ============================================================
-- Migration : town-bank-snapshot
-- Description : en-tête des versions de la banque d'une ville (une ligne par
--               photo de TownBankItem) : jour de jeu et empreinte du contenu.
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API, puis lancer la reprise
-- POST /Admin/bank-history/backfill.
-- ============================================================

-- idTown : Town.IdTown résolu (clé provisoire -mapId possible) : pas de FK vers Town.
-- day : numéro de jour MyHordes de la photo.
-- contentHash : SHA-256 hexadécimal du contenu normalisé (voir BankHistoryRules.Fingerprint).
CREATE TABLE IF NOT EXISTS TownBankSnapshot
(
    idTown
    INT
(
    11
) NOT NULL,
    idLastUpdateInfo INT
(
    11
) NOT NULL,
    day INT
(
    11
) NOT NULL,
    contentHash CHAR
(
    64
) NOT NULL,
    PRIMARY KEY
(
    idTown,
    idLastUpdateInfo
),
    KEY TownBankSnapshot_idTown_day
(
    idTown,
    day,
    idLastUpdateInfo
),
    KEY TownBankSnapshot_idLastUpdateInfo
(
    idLastUpdateInfo
),
    CONSTRAINT TownBankSnapshot_ibfk_1 FOREIGN KEY
(
    idLastUpdateInfo
) REFERENCES LastUpdateInfo
(
    idLastUpdateInfo
)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;
