-- ============================================================
-- Migration : expedition-part-drop-path
-- Description : supprime ExpeditionPart.path, l'ancien « Nom du
--               tracé » en texte libre, remplacé par le lien vers un
--               tracé (idMapRoute) au lot 4 des tracés d'expédition.
--               Plus aucun code ne lit la colonne : l'API renvoie
--               encore `path`, calculé (nom du tracé lié), pour les
--               anciennes versions du script.
-- IRRÉVERSIBLE : les noms saisis avant le lot 4 sont perdus.
-- IDEMPOTENT. À exécuter APRÈS le déploiement de l'API du lot 4
-- (une API antérieure lit la colonne).
-- Syntaxe MariaDB (DROP COLUMN IF EXISTS).
-- ============================================================

ALTER TABLE ExpeditionPart
DROP
COLUMN IF EXISTS path;
