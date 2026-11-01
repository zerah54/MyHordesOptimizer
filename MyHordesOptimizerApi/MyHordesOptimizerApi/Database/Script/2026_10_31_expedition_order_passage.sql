-- ============================================================
-- Migration : expedition-order-passage
-- Description : consignes d'expédition :
--               - passage : rang du passage de l'itinéraire sur la
--                 case visée, à partir de 1 ; NULL vaut le premier.
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API.
-- Syntaxe MariaDB (BEGIN NOT ATOMIC), comme les autres scripts.
-- ============================================================

DELIMITER
$$

BEGIN
NOT ATOMIC
ALTER TABLE ExpeditionOrder
    ADD COLUMN IF NOT EXISTS passage INT (11) NULL;
END $$

DELIMITER ;
