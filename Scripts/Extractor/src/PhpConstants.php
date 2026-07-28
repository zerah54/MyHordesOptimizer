<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor;

use ReflectionClass;
use RuntimeException;

/**
 * Inversion valeur → nom des constantes entières d'une classe PHP.
 *
 * Permet de reconstituer les noms symboliques attendus par l'API (`Recipe::WorkshopType`,
 * `Unknown`…) au lieu de les recopier à la main. Un renommage en amont devient ainsi visible
 * dans le rapport de dérive plutôt que de casser silencieusement une comparaison de chaînes.
 */
final class PhpConstants
{
    /** @var array<string, array<int, string>> */
    private static array $cache = [];

    /** @return array<int, string> */
    public static function tousLesNoms(string $classe): array
    {
        if (isset(self::$cache[$classe])) {
            return self::$cache[$classe];
        }

        $noms = [];

        foreach ((new ReflectionClass($classe))->getConstants() as $nom => $valeur) {
            if (is_int($valeur)) {
                $noms[$valeur] = $nom;
            }
        }

        return self::$cache[$classe] = $noms;
    }

    public static function nomPour(string $classe, int $valeur, string $prefixeAffiche): string
    {
        $noms = self::tousLesNoms($classe);

        if (!isset($noms[$valeur])) {
            throw new RuntimeException(
                "Aucune constante entière de $classe ne vaut $valeur — le contrat amont a changé."
            );
        }

        return $prefixeAffiche === '' ? $noms[$valeur] : $prefixeAffiche . '::' . $noms[$valeur];
    }
}
