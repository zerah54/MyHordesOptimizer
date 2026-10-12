-- ============================================================
-- Migration : towncitizen-camping-skills
-- Description : données du citoyen que MyHordes n'expose pas, saisies
--               depuis la liste des citoyens (ou le camping d'une case).
--
-- campingCount     : campings déjà effectués dans la ville (le jeu
--                    l'augmente pour chaque nuit survécue en campant).
-- heroSkillLevelS…R : niveau de chaque groupe de capacités héroïques
--                    (S, U, P, E, R) : 0 aucun, 1 à 4. Figés par le jeu
--                    à l'arrivée en ville, d'où un enregistrement par ville.
-- NULL : jamais saisi. Les campings sont alors servis comme 0, les
-- capacités comme inconnues.
--
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API qui lit les
-- colonnes. Syntaxe MariaDB (ADD COLUMN IF NOT EXISTS).
-- ============================================================

ALTER TABLE TownCitizen
    ADD COLUMN IF NOT EXISTS campingCount INT (11) NULL,
    ADD COLUMN IF NOT EXISTS heroSkillLevelS INT (11) NULL,
    ADD COLUMN IF NOT EXISTS heroSkillLevelU INT (11) NULL,
    ADD COLUMN IF NOT EXISTS heroSkillLevelP INT (11) NULL,
    ADD COLUMN IF NOT EXISTS heroSkillLevelE INT (11) NULL,
    ADD COLUMN IF NOT EXISTS heroSkillLevelR INT (11) NULL;
