-- ============================================================
-- Migration : town-is-hard
-- Description : Indicateur de difficulté « attaques sévères » (hard) de la ville,
--               issu de /json (MyHordesCity.hard). Utilisé par le solveur d'attaque :
--               en mode hard, le nombre de zombies est un re-tirage uniforme dans
--               [targetMin, targetMax], la bande cible ne peut donc pas être resserrée.
-- ============================================================
ALTER TABLE Town
    ADD COLUMN IF NOT EXISTS isHard BIT NOT NULL DEFAULT 0;
