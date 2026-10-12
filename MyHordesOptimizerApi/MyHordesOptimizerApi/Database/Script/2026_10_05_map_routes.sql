-- ============================================================
-- Migration : map-routes
-- Description : tracés d'expédition sur la carte (MapRoute,
--               MapRouteShare), itinéraires du jeu importés
--               (MapRouteGame), lien partie d'expédition → tracé,
--               colonnes des consignes typées par case.
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API.
-- Syntaxe MariaDB (BEGIN NOT ATOMIC), comme les autres scripts.
-- ============================================================

-- idTown : Town.IdTown résolu (peut être une clé provisoire -mapId, migrée par
--   MigrateTownId) : pas de clé étrangère, comme TownNote ou TownAttackSetting.
-- color : clé de palette (blue, violet…) ; la teinte affichée dépend du thème du site.
-- isPrivate : 0 = visible de toute la ville, 1 = privé (MapRouteShare liste les citoyens autorisés).
-- isEditableByAll : 0 = modifiable par l'auteur seul, 1 = par tous ceux qui voient le tracé.
-- cells : chemin case par case, [[x,y],…] en coordonnées absolues.
-- stops : destinations cliquées, [{"x":…,"y":…,"mode":"best"|"l"}].
-- length : PA du trajet (nombre de cases - 1).
-- version : concurrence optimiste, incrémentée à chaque modification.
CREATE TABLE IF NOT EXISTS MapRoute
(
    idMapRoute
    INT
(
    11
) NOT NULL AUTO_INCREMENT,
    idTown INT
(
    11
) NOT NULL,
    label VARCHAR
(
    64
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    color VARCHAR
(
    16
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    idAuthor INT
(
    11
) NOT NULL,
    isPrivate TINYINT
(
    1
) NOT NULL DEFAULT 0,
    isEditableByAll TINYINT
(
    1
) NOT NULL DEFAULT 0,
    cells LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    stops LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    length INT
(
    11
) NOT NULL,
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
    idMapRoute
),
    KEY MapRoute_idTown
(
    idTown
)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS MapRouteShare
(
    idMapRoute
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
    idMapRoute,
    idUser
),
    CONSTRAINT MapRouteShare_fk_mapRoute FOREIGN KEY
(
    idMapRoute
) REFERENCES MapRoute
(
    idMapRoute
) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Itinéraires créés dans MyHordes, remplacés en bloc à chaque mise à jour MHO. Le jeu les
-- efface chaque nuit : seuls ceux du jour courant de la ville (day) sont renvoyés.
-- stops : points d'arrêt [[x,y],…] en coordonnées absolues (segments alignés entre eux).
CREATE TABLE IF NOT EXISTS MapRouteGame
(
    idMapRouteGame
    INT
(
    11
) NOT NULL AUTO_INCREMENT,
    idTown INT
(
    11
) NOT NULL,
    idAuthor INT
(
    11
) NULL,
    label VARCHAR
(
    32
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    length INT
(
    11
) NOT NULL,
    stops LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    day INT
(
    11
) NOT NULL,
    idLastUpdateInfo INT
(
    11
) NULL,
    PRIMARY KEY
(
    idMapRouteGame
),
    KEY MapRouteGame_idTown_day
(
    idTown,
    day
)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ExpeditionPart.idMapRoute : supprimer un tracé délie la partie, ses consignes restent.
-- ExpeditionOrder : case visée (x, y absolus ; NULL = consigne générale) et paramètres des
--   consignes typées. heroSkill : action héroïque contrôlée par l'API, sans clé étrangère (les
--   actions génériques comme hero_generic_rescue ne sont pas dans HeroSkills) ; clés ASCII.
DELIMITER
$$

BEGIN
NOT ATOMIC
    IF NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'ExpeditionPart'
                     AND COLUMN_NAME = 'idMapRoute') THEN
ALTER TABLE ExpeditionPart
    ADD COLUMN idMapRoute INT(11) NULL AFTER idExpedition;
END IF;
    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.TABLE_CONSTRAINTS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'ExpeditionPart'
                     AND CONSTRAINT_NAME = 'ExpeditionPart_fk_mapRoute') THEN
ALTER TABLE ExpeditionPart
    ADD CONSTRAINT ExpeditionPart_fk_mapRoute FOREIGN KEY (idMapRoute) REFERENCES MapRoute (idMapRoute) ON DELETE SET NULL;
END IF;

ALTER TABLE ExpeditionOrder
    ADD COLUMN IF NOT EXISTS x INT (11) NULL,
    ADD COLUMN IF NOT EXISTS y INT (11) NULL,
    ADD COLUMN IF NOT EXISTS kind VARCHAR (16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    ADD COLUMN IF NOT EXISTS idItem INT (11) NULL,
    ADD COLUMN IF NOT EXISTS quantity INT (11) NULL,
    ADD COLUMN IF NOT EXISTS heroSkill VARCHAR (255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL,
    ADD COLUMN IF NOT EXISTS idTargetUser INT (11) NULL;

IF
NOT EXISTS (SELECT 1
                   FROM information_schema.TABLE_CONSTRAINTS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'ExpeditionOrder'
                     AND CONSTRAINT_NAME = 'ExpeditionOrder_fk_item') THEN
ALTER TABLE ExpeditionOrder
    ADD CONSTRAINT ExpeditionOrder_fk_item FOREIGN KEY (idItem) REFERENCES Item (idItem) ON DELETE SET NULL;
END IF;
    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.TABLE_CONSTRAINTS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'ExpeditionOrder'
                     AND CONSTRAINT_NAME = 'ExpeditionOrder_fk_targetUser') THEN
ALTER TABLE ExpeditionOrder
    ADD CONSTRAINT ExpeditionOrder_fk_targetUser FOREIGN KEY (idTargetUser) REFERENCES Users (idUser) ON DELETE SET NULL;
END IF;
END $$

DELIMITER ;
