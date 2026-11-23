-- ============================================================
-- Migration : town-mapid-index
-- Description : index sur Town.mapId pour ResolveTownId (WHERE mapId = ? LIMIT 1),
--               qui parcourait toute la table Town.
-- IDEMPOTENT. En pratique le résultat de ResolveTownId ne change pas : l'index InnoDB (mapId)
-- porte la clé primaire, donc le plus petit idTown est lu en premier, comme dans le parcours
-- actuel de la clé primaire (LIMIT 1 sans ORDER BY : aucune garantie formelle).
-- ============================================================

CREATE INDEX IF NOT EXISTS Town_mapId ON Town (mapId);
