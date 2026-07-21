-- ----------------------------------------------------------------------------
-- 2026_07_22 — Users.playedMapsImportedAt
--
-- Date du dernier import de l'historique des villes jouées (playedMaps).
--
-- Jusqu'ici, UpsertPlayedMaps tournait à CHAQUE getMe, sous le verrou global de
-- MyHordesFetcherService : ~2,3 s en moyenne et jusqu'à 10 s par connexion, à
-- réécrire un historique qui ne change qu'en fin de ville. Au pic de connexions
-- de minuit, la file d'attente atteignait 15 minutes et nginx renvoyait des 502.
-- L'import ne se fait donc plus qu'une fois (NULL = jamais fait), puis à la
-- demande via l'import des pictos, qui remonte le même historique en plus riche
-- (playedMaps.fields(...,rewards), sur-ensemble strict de ce que renvoie getMe).
--
-- Backfill à UTC_TIMESTAMP() : l'import tournant à chaque connexion jusqu'à ce
-- jour, l'historique de tout compte déjà en base est à jour. Sans ce backfill,
-- tous les comptes existants relanceraient leur import au premier login suivant
-- — c'est-à-dire en masse au pic du soir, ce que ce correctif vise à supprimer.
-- ----------------------------------------------------------------------------

ALTER TABLE Users
    ADD COLUMN playedMapsImportedAt DATETIME NULL;

UPDATE Users
SET playedMapsImportedAt = UTC_TIMESTAMP();
