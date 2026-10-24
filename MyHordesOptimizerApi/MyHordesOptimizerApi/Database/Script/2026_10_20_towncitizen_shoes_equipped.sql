-- ============================================================
-- Migration : towncitizen-shoes-equipped
-- Description : chaussures équipées d'un citoyen, donnée que MyHordes
--               n'expose pas, déclarée depuis la liste des citoyens ou
--               déduite du sac par l'addon.
--
-- shoesEquipped : 1 si le citoyen porte des chaussures équipées (+1 PE
--                 de départ), 0 sinon.
-- NULL : jamais saisi, servi comme 0 (non équipées).
--
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API qui lit la
-- colonne. Syntaxe MariaDB (ADD COLUMN IF NOT EXISTS).
-- ============================================================

ALTER TABLE TownCitizen
    ADD COLUMN IF NOT EXISTS shoesEquipped BIT (1) NULL;
