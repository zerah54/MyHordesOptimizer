<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor;

/**
 * ③ Table de projection : les fichiers de `MyHordesOptimizerApi/MyHordesOptimizerApi/Data/**`
 * produits par l'extracteur.
 *
 * Ne figurent PAS ici, volontairement : `Building/building.json`, `Jobs/jobs.json`, `Camping/`,
 * `Glossary/` et `Wishlist/`, qui ne proviennent pas des fixtures (§8 de la spécification).
 */
final class Projections
{
    /** @return list<Projection> */
    public static function toutes(): array
    {
        return [
            new Projection('Items/categories.json', 'myhordes.fixtures.items.categories'),

            new Projection(
                'Items/find.json',
                'myhordes.fixtures.items.groups',
                null,
                static fn (array $groupes): array => self::enveloppeNiveau2($groupes),
                // Pas de schéma d'entrée fixe : les clés de premier niveau sont des noms de
                // groupes et celles de deuxième niveau des codes d'objets — des données, pas des
                // champs. Y détecter une dérive de forme ferait crier au loup à chaque ajout
                // d'objet dans une table de fouille.
                false
            ),

            new Projection(
                'Items/recipes.json',
                'myhordes.fixtures.recipes',
                null,
                static fn (array $recettes): array => self::normaliserRecettes($recettes)
            ),

            new Projection(
                'Ruins/ruins.json',
                'myhordes.fixtures.ruins.data',
                null,
                static fn (array $ruines): array => self::normaliserRuines($ruines)
            ),

            new Projection('Heroes/capacities.json', 'myhordes.fixtures.heroskills'),

            new Projection('Heroes/jobs.json', 'myhordes.fixtures.citizen.professions'),

            new Projection('Items/actions.json', 'myhordes.fixtures.actions', 'actions'),
            new Projection('Items/item-actions.json', 'myhordes.fixtures.actions', 'items'),
            new Projection('Items/items-nightwatch.json', 'myhordes.fixtures.actions', 'items_nw'),
            new Projection('Items/meta-results.json', 'myhordes.fixtures.actions', 'meta_results'),
            new Projection('Heroes/specials.json', 'myhordes.fixtures.actions', 'specials'),

            new Projection(
                'Heroes/powers.json',
                'myhordes.fixtures.actions',
                'heroics',
                static fn (array $heroics, array $brut): array => self::refondrePouvoirs(
                    $heroics,
                    self::auxiliaire($brut, 'myhordes.fixtures.actions', 'actions')
                )
            ),

            new Projection(
                'Items/item-properties.json',
                'myhordes.fixtures.items.properties',
                null,
                static fn (array $proprietes, array $brut): array => self::ajouterFragile(
                    $proprietes,
                    self::auxiliaire($brut, 'myhordes.fixtures.actions', 'items_cata'),
                    self::auxiliaire($brut, 'myhordes.fixtures.actions', 'actions')
                )
            ),

            new Projection(
                'CauseOfDeath/cause-of-death.json',
                'myhordes.fixtures.citizen.deaths',
                null,
                static fn (array $causes): array => self::nommerCausesDeMort($causes)
            ),
        ];
    }

    /**
     * `find.json` : chaque chance d'apparition est un tableau, même quand la source donne un entier.
     *
     * @param array<string, array<string, mixed>> $groupes
     * @return array<string, array<string, list<mixed>>>
     */
    private static function enveloppeNiveau2(array $groupes): array
    {
        foreach ($groupes as $nomGroupe => $objets) {
            foreach ($objets as $objet => $chances) {
                $groupes[$nomGroupe][$objet] = is_array($chances) ? $chances : [$chances];
            }
        }

        return $groupes;
    }

    /**
     * `recipes.json` : `in` et `out` sont toujours des tableaux, et `type` reprend le nom
     * symbolique de la constante PHP au lieu d'un entier — c'est ce que compare
     * `DiscordBot/Modules/RecipesModule.cs:128`.
     *
     * @param array<string, array<string, mixed>> $recettes
     * @return array<string, array<string, mixed>>
     */
    private static function normaliserRecettes(array $recettes): array
    {
        foreach ($recettes as $code => $recette) {
            foreach (['in', 'out'] as $champ) {
                if (isset($recette[$champ]) && !is_array($recette[$champ])) {
                    $recettes[$code][$champ] = [$recette[$champ]];
                }
            }

            if (isset($recette['type']) && is_int($recette['type'])) {
                $recettes[$code]['type'] = PhpConstants::nomPour(
                    \App\Entity\Recipe::class,
                    $recette['type'],
                    'Recipe'
                );
            }
        }

        return $recettes;
    }

    /**
     * `ruins.json` : chaque taux de butin est un tableau `[chance]` ou `[chance, mode]`.
     *
     * Le jeu accepte trois formes de déclaration (`FixtureHelper::_assembleGroup`), qui se
     * ramènent toutes au triplet (objet, chance, mode) : un scalaire, une liste `[chance, mode]`,
     * et une forme « alias » traitée ci-dessous.
     *
     * @param array<string, array<string, mixed>> $ruines
     * @return array<string, array<string, mixed>>
     */
    private static function normaliserRuines(array $ruines): array
    {
        foreach ($ruines as $code => $ruine) {
            if (!isset($ruine['drops']) || !is_array($ruine['drops'])) {
                continue;
            }

            foreach ($ruine['drops'] as $objet => $chances) {
                // Forme « alias » : la clé n'est pas un nom d'objet mais un identifiant
                // synthétique, et le vrai nom se trouve dans « item ». Le jeu s'en sert pour
                // déclarer deux fois le même objet dans un groupe avec des modes d'événement
                // différents, ce qu'une clé PHP interdit.
                //
                // Le modèle MHO n'a pas de dimension « mode » : ImportRuins ne lit que la chance
                // et cherche l'objet PAR LA CLÉ (Items.Single(x => x.Uid == drop.Key)), donc un
                // alias y lèverait une exception. Ces variantes d'événement ne sont donc pas
                // représentables : on écarte l'alias au profit de l'entrée de base, qui porte la
                // valeur hors événement. Les représenter demanderait d'ajouter le mode au modèle,
                // ce qui relève de la phase 2.
                if (is_array($chances) && isset($chances['item'])) {
                    unset($ruines[$code]['drops'][$objet]);

                    // Adopté sous son vrai nom seulement si l'objet n'est pas déjà déclaré pour
                    // lui-même — vérifié sur l'instantané d'origine, donc sans dépendre de
                    // l'ordre de parcours. `?? 0` reprend le `?? DropMod::None` du jeu.
                    if (!array_key_exists($chances['item'], $ruine['drops'])) {
                        $ruines[$code]['drops'][$chances['item']] = [
                            $chances['count'],
                            $chances['mod'] ?? 0,
                        ];
                    }

                    continue;
                }

                $ruines[$code]['drops'][$objet] = is_array($chances) ? $chances : [$chances];
            }
        }

        return $ruines;
    }

    /**
     * `powers.json` croise les pouvoirs héroïques avec leur action homonyme : le libellé et
     * l'infobulle de l'action deviennent le titre et la description du pouvoir.
     *
     * @param array<string, array<string, mixed>> $heroics
     * @param array<string, array<string, mixed>> $actions
     * @return array<string, array<string, mixed>>
     */
    private static function refondrePouvoirs(array $heroics, array $actions): array
    {
        $pouvoirs = [];

        foreach ($heroics as $heroique) {
            $nom = $heroique['name'];

            if (!isset($actions[$nom])) {
                throw new \RuntimeException(
                    "Le pouvoir héroïque « $nom » n'a pas d'action correspondante."
                );
            }

            // Tolérance DÉLIBÉRÉE, et non un repli commode : trois actions du jeu (dont
            // « hero_armag ») ont troqué « tooltip » contre « tooltip_key », une clé de
            // traduction. Le champ est donc réellement absent en amont, et le powers.json
            // déjà livré porte lui aussi null pour ces pouvoirs — la phase 1 tient le
            // contrat existant. Résoudre ces clés relève du chantier « traductions » de la
            // phase 2 ; lever une exception ici casserait un contrat que rien ne demande
            // de changer.
            $pouvoirs[$nom] = [
                'name' => $nom,
                'title' => $actions[$nom]['label'],
                'description' => $actions[$nom]['tooltip'] ?? null,
                'daysNeeded' => 0,
                'unlockable' => $heroique['unlockable'],
                'nbUses' => 1,
            ];
        }

        return $pouvoirs;
    }

    /**
     * La propriété `fragile` — « se casse en cas d'envoi par catapulte » — n'est plus une liste
     * écrite à la main : un objet est fragile dès lors que le résultat de son effet de catapulte
     * ne contient pas `morph_cata_fine`, c'est-à-dire qu'il n'arrive pas intact.
     *
     * @param array<string, list<string>> $proprietes
     * @param array<string, string> $itemsCata objet → nom de l'effet de catapulte
     * @param array<string, array<string, mixed>> $actions
     * @return array<string, list<string>>
     */
    private static function ajouterFragile(array $proprietes, array $itemsCata, array $actions): array
    {
        foreach ($itemsCata as $objet => $effet) {
            // Surtout PAS de `?? []` ici : un effet inconnu donnerait un résultat vide, donc sans
            // `morph_cata_fine`, donc l'objet serait marqué fragile. Une absence deviendrait une
            // affirmation. On échoue bruyamment à la place.
            if (!isset($actions[$effet]['result'])) {
                throw new \RuntimeException(
                    "L'effet de catapulte « $effet » de l'objet « $objet » n'a aucun résultat défini."
                );
            }

            if (in_array('morph_cata_fine', $actions[$effet]['result'], true)) {
                continue;
            }

            $proprietes[$objet] = [...($proprietes[$objet] ?? []), 'fragile'];
        }

        return $proprietes;
    }

    /**
     * Récupère une sous-clé d'une chaîne AUXILIAIRE, c'est-à-dire d'une chaîne autre que celle
     * déclarée par la projection. `Projection::appliquer()` ne contrôle que la chaîne déclarée ;
     * sans ce garde-fou, une chaîne disparue en amont provoquerait un `TypeError` au moment
     * d'écrire, au lieu d'un message clair.
     *
     * @param array<string, array<mixed>> $brut
     * @return array<mixed>
     */
    private static function auxiliaire(array $brut, string $chaine, string $sousCle): array
    {
        if (!isset($brut[$chaine][$sousCle]) || !is_array($brut[$chaine][$sousCle])) {
            throw new \RuntimeException(
                "Sous-clé auxiliaire « $sousCle » introuvable dans la chaîne « $chaine »."
            );
        }

        return $brut[$chaine][$sousCle];
    }

    /**
     * La source donne `ref` sous forme d'entier. L'API attend le nom symbolique dans `ref` et la
     * valeur dans `dtype` ; les deux sont reconstitués depuis les constantes de la classe amont.
     *
     * @param array<int, array<string, mixed>> $causes
     * @return array<int, array<string, mixed>>
     */
    private static function nommerCausesDeMort(array $causes): array
    {
        foreach ($causes as $index => $cause) {
            $valeur = $cause['ref'];

            $causes[$index]['ref'] = PhpConstants::nomPour(
                \App\Entity\CauseOfDeath::class,
                $valeur,
                ''
            );
            $causes[$index]['dtype'] = $valeur;
        }

        return $causes;
    }
}
