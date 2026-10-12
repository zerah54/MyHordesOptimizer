-- ============================================================
-- Migration : mapcell-camp-improvement
-- Description : aménagement de la zone pour le camping
--               (improvementLevel de MyHordes), saisi dans le détail
--               d'une case de la carte.
--
-- campImprovementLevel : niveau d'aménagement au jour de la saisie
--                        (+5 par amélioration, +9 par objet de défense
--                        installé).
-- campImprovementDay   : jour de la saisie. Le niveau courant s'en
--                        déduit : chaque nuit en retire 15, sans
--                        descendre sous 0.
-- NULL pour l'existant : aucun aménagement connu.
--
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API qui lit les
-- colonnes. Syntaxe MariaDB (ADD COLUMN IF NOT EXISTS).
-- ============================================================

ALTER TABLE MapCell
    ADD COLUMN IF NOT EXISTS campImprovementLevel INT (11) NULL AFTER digsObservedDay,
    ADD COLUMN IF NOT EXISTS campImprovementDay INT (11) NULL AFTER campImprovementLevel;
