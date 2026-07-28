-- ----------------------------------------------------------------------------
-- 2026_07_29 — Town.rankingImportedAt
--
-- Date du dernier import de la ville depuis le classement (/json/towns).
--
-- Sert de point de reprise à l'import des villes d'une saison. MyHordes tronque
-- /json/towns à 50 identifiants (array_slice dans JSONv1Controller::api_json_town)
-- et limite la clé personnelle à 150 requêtes par heure glissante
-- (authenticated_personal_api) : l'import d'une saison ancienne épuise donc le
-- quota bien avant la fin. Jusqu'ici, la relance repartait du premier lot de la
-- liste renvoyée par /json/townlist et rejouait indéfiniment les mêmes villes.
--
-- NULL n'est pas remplaçable par « la ville existe en base » : UpsertPlayedMaps
-- crée des lignes Town pour les villes jouées d'un compte, sans jamais importer
-- leurs cadavres. Les sauter au motif qu'elles existent les condamnerait à
-- rester vides.
--
-- Backfill : marquer ce qui a manifestement déjà été importé, pour ne pas payer
-- une passe de quota entière à réimporter l'acquis. Deux conditions cumulées,
-- calibrées pour ne JAMAIS sur-marquer — un marquage à tort serait définitif et
-- condamnerait la ville, alors qu'un marquage manquant se corrige tout seul au
-- premier import suivant.
--
--  1. nameInTown renseigné sur au moins un citoyen. Cette colonne n'est écrite
--     que par UpsertTownCitizens (/json/towns) et par la branche cadavres de
--     UpsertTownCitizensFromMap (/json/map) : la ville a donc vu l'une des deux.
--  2. width à 0, c'est-à-dire jamais passée par /json/map — seule source de wid
--     et hei (UpdateFromMapDetails). Ce qui reste ne peut venir que du
--     classement.
--
-- Limite assumée : les villes vues par /json/map et les villes importées avant
-- l'ajout de nameInTown (2026_07_15) ne sont pas marquées, et seront donc
-- réimportées une fois — après quoi elles le seront définitivement.
-- ----------------------------------------------------------------------------

ALTER TABLE Town
    ADD COLUMN rankingImportedAt DATETIME NULL;

UPDATE Town t
SET t.rankingImportedAt = UTC_TIMESTAMP()
WHERE t.width = 0
  AND EXISTS (SELECT 1
              FROM TownCitizen tc
              WHERE tc.idTown = t.idTown
                AND tc.nameInTown IS NOT NULL);
