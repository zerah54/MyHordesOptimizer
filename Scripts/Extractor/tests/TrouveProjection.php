<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\Projection;
use MyHordesOptimizer\Extractor\Projections;

/**
 * Recherche d'une projection par son fichier cible dans `Projections::toutes()`. Partagé par
 * plusieurs classes de test qui ont besoin d'inspecter une projection précise sans recopier sa
 * construction ni la recherche qui va avec.
 */
trait TrouveProjection
{
    private static function parCible(string $cible): Projection
    {
        foreach (Projections::toutes() as $projection) {
            if ($projection->fichierCible() === $cible) {
                return $projection;
            }
        }

        self::fail("Projection introuvable pour $cible");
    }
}
