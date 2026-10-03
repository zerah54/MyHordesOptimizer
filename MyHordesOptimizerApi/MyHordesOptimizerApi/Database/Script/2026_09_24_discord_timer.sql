-- ============================================================
-- Migration : discord-timer
-- Description : Compteurs du bot Discord (/aa, /timer) en attente
--               d'échéance, rechargés au démarrage de l'API.
--               Dates en UTC. channelId NULL : message privé.
--               locale : langue de l'auteur (fr, en, de, es).
-- ============================================================
CREATE TABLE IF NOT EXISTS DiscordTimer
(
    idDiscordTimer
    INT
    NOT
    NULL
    AUTO_INCREMENT,
    userId
    BIGINT
    UNSIGNED
    NOT
    NULL,
    channelId
    BIGINT
    UNSIGNED
    NULL,
    message
    VARCHAR
(
    1000
) NOT NULL,
    locale VARCHAR
(
    8
) NOT NULL DEFAULT 'fr',
    dueAt DATETIME NOT NULL,
    createdAt DATETIME NOT NULL,
    PRIMARY KEY
(
    idDiscordTimer
),
    KEY idx_discordtimer_user
(
    userId
)
    );
