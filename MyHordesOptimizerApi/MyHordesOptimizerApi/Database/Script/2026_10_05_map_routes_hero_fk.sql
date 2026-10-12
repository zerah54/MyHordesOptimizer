-- ============================================================
-- Migration : map-routes-hero-fk
-- Description : consignes typées « Action héroïque » (lot 4 des
--               tracés d'expédition). Pour les bases où la première
--               version de 2026_10_05_map_routes.sql a déjà créé la
--               clé étrangère ; sans effet ailleurs.
-- IDEMPOTENT. À exécuter APRÈS 2026_10_05_map_routes.sql et AVANT
-- le déploiement de l'API.
-- Syntaxe MariaDB (BEGIN NOT ATOMIC), comme les autres scripts.
-- ============================================================

-- ExpeditionOrder.heroSkill : la clé étrangère vers HeroSkills(name) refuse les actions héroïques
--   génériques (hero_generic_rescue, hero_generic_punch, hero_generic_return), absentes de HeroSkills.
--   Elle est retirée : l'API contrôle la valeur (liste des actions de la page Expéditions).
DELIMITER
$$

BEGIN
NOT ATOMIC
    IF EXISTS (SELECT 1
               FROM information_schema.TABLE_CONSTRAINTS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'ExpeditionOrder'
                 AND CONSTRAINT_NAME = 'ExpeditionOrder_fk_heroSkill') THEN
ALTER TABLE ExpeditionOrder
DROP
FOREIGN KEY ExpeditionOrder_fk_heroSkill;
END IF;
END $$

DELIMITER ;
