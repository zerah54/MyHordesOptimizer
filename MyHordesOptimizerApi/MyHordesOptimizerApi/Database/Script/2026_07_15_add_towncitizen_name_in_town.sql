-- ----------------------------------------------------------------------------
-- 2026_07_15 — TownCitizen.nameInTown
--
-- Nom sous lequel un joueur est apparu DANS une ville donnée. Dans les villes
-- ayant l'option `features.citizen_alias` (désactivée par défaut, réservée aux
-- villes custom), un joueur choisit un nom d'emprunt à l'onboarding.
--
-- Côté MyHordes, `getCadaversInformation` renvoie `getAlias() ?? getUser()->getName()`
-- sans jamais distinguer les deux : l'alias n'est donc PAS récupérable en tant que
-- tel. On stocke ici le nom brut vu dans la ville — un fait, sans interprétation.
-- L'alias se déduit à la lecture : nameInTown != Users.name ⟹ c'était un alias.
--
-- Conséquence : ce chemin ne doit JAMAIS écrire Users.name, sinon le pseudo réel
-- est écrasé par le nom d'emprunt (name ne vit que sur User depuis 2026_07_03).
--
-- Renseigné uniquement pour les morts : un joueur vivant est renvoyé par
-- getUserData, donc toujours sous son vrai pseudo, jamais sous son alias.
-- ----------------------------------------------------------------------------

ALTER TABLE TownCitizen
    ADD COLUMN nameInTown VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER idUser;
