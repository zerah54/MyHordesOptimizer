-- ----------------------------------------------------------------------------
-- 2026_07_15 — Users.nameRefreshedAt
--
-- Date du dernier rafraîchissement du pseudo via /json/users (seule source faisant
-- autorité : les chemins « cadavre » renvoient l'alias, cf. TownCitizen.nameInTown).
-- NULL = jamais rafraîchi, donc pseudo potentiellement issu d'un chemin aliasé.
--
-- Sert de file d'attente au refresh incrémental : on traite les NULL d'abord, puis
-- les plus anciens. Renseigné même quand MyHordes ne renvoie rien pour le joueur
-- (compte supprimé), sans quoi il resterait éternellement en tête de file.
-- ----------------------------------------------------------------------------

ALTER TABLE Users
    ADD COLUMN nameRefreshedAt DATETIME NULL;
