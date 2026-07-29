-- ----------------------------------------------------------------------------
-- 2026_07_29 — Recipe.forcedErrorMessage
--
-- Message d'erreur forcé d'une recette, repris tel quel du champ `error` des
-- fixtures MyHordes (RecipeFixtures.php -> setForcedErrorMessage).
--
-- Une recette qui porte ce message n'assemble JAMAIS rien : le jeu sort avant
-- toute exécution en affichant simplement le message
-- (InventoryAwareController::craft, avant l'appel à execute_recipe). Elle
-- n'existe que pour montrer l'assemblage au joueur là où il est impossible et
-- lui en donner la raison.
--
-- Sans cette colonne, rien ne distingue une telle recette d'une vraie : com015
-- (ManualInside, la vraie tronçonneuse) et com015b (ManualOutside, factice) ont
-- exactement les mêmes composants et le même résultat, et apparaissaient donc
-- deux fois à l'identique dans le wiki et dans l'addon.
--
-- La chaîne stockée est l'allemand d'origine, qui est aussi la clé de
-- traduction du jeu (domaine « items ») : elle reste traduisible plus tard sans
-- nouvel import.
--
-- Backfill : com015b est le seul cas du référentiel (1 seule recette porte un
-- `error` sur les 123 de Data/Items/recipes.json). Le poser ici rend le
-- filtrage effectif immédiatement, sans attendre un DataImport ; l'import
-- réécrira la même valeur. `name` est la clé primaire et vient des fixtures :
-- il est stable, contrairement aux identifiants auto-incrémentés.
-- ----------------------------------------------------------------------------

ALTER TABLE Recipe
    ADD COLUMN forcedErrorMessage VARCHAR(255) NULL;

UPDATE Recipe
SET forcedErrorMessage = 'Es ist hier einfach zu staubig, um diesen Gegenstand zusammenbauen zu können...'
WHERE name = 'com015b';