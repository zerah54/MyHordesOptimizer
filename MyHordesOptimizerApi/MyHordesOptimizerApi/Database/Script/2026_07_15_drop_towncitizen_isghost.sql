-- ----------------------------------------------------------------------------
-- 2026_07_15 — Suppression de TownCitizen.isGhost
--
-- La colonne était alimentée depuis les citoyens de /json/me. Côté MyHordes,
-- getCitizensData ne renvoie que les citoyens vivants de la ville et calcule
-- isGhost = (getActiveCitizen() === null) : un citoyen vivant a toujours un
-- citoyen actif, la valeur était donc systématiquement false.
--
-- L'information n'a de sens qu'au niveau du joueur (« rattaché à aucune
-- ville ») et n'est pas exposée par /json/me. Elle n'est pas réintroduite sur
-- User : trop volatile pour un import de fond.
-- ----------------------------------------------------------------------------

ALTER TABLE TownCitizen
    DROP COLUMN isGhost;
