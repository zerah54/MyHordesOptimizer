-- ============================================================
-- Migration : expedition-citizen-requirements
-- Description : exigences de PE et de chaussures sur une place
--               d'expédition (ExpeditionCitizen).
--
-- nombrePeDepart         : PE de départ attendus du citoyen de la place.
-- nombrePeDepartOperator : sens de l'exigence ('min' au moins, 'max' au
--                          plus, 'exact' exactement).
-- isPreinscritChaussures : 1 si la place exige des chaussures équipées,
--                          0 si elle les interdit.
-- NULL : aucune exigence (places existantes). Un opérateur NULL vaut
-- 'min'.
--
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API qui lit les
-- colonnes. Syntaxe MariaDB (ADD COLUMN IF NOT EXISTS).
-- ============================================================

ALTER TABLE ExpeditionCitizen
    ADD COLUMN IF NOT EXISTS nombrePeDepart INT (11) NULL,
    ADD COLUMN IF NOT EXISTS nombrePeDepartOperator VARCHAR (5) NULL,
    ADD COLUMN IF NOT EXISTS isPreinscritChaussures BIT (1) NULL;
