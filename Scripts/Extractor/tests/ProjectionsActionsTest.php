<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\Projection;
use MyHordesOptimizer\Extractor\Projections;
use PHPUnit\Framework\TestCase;

final class ProjectionsActionsTest extends TestCase
{
    use TrouveProjection;

    public function testLesSixCiblesIssuesDesActionsExistent(): void
    {
        $cibles = array_map(
            static fn (Projection $p): string => $p->fichierCible(),
            Projections::toutes()
        );

        foreach ([
            'Items/actions.json',
            'Items/item-actions.json',
            'Items/items-nightwatch.json',
            'Items/meta-results.json',
            'Heroes/specials.json',
            'Heroes/powers.json',
        ] as $cible) {
            self::assertContains($cible, $cibles);
        }
    }

    public function testLaRefonteDesPouvoirsCroiseHeroicsEtActions(): void
    {
        $projection = self::parCible('Heroes/powers.json');

        $resultat = $projection->appliquer([
            'myhordes.fixtures.actions' => [
                'heroics' => [
                    ['name' => 'hero_generic_return', 'unlockable' => true],
                ],
                'actions' => [
                    'hero_generic_return' => [
                        'label' => 'Le retour du héros',
                        'tooltip' => 'Tu rentres en ville.',
                    ],
                ],
            ],
        ]);

        self::assertSame([
            'name' => 'hero_generic_return',
            'title' => 'Le retour du héros',
            'description' => 'Tu rentres en ville.',
            'daysNeeded' => 0,
            'unlockable' => true,
            'nbUses' => 1,
        ], $resultat['hero_generic_return']);
    }

    public function testUnPouvoirSansActionCorrespondanteEchoue(): void
    {
        $projection = self::parCible('Heroes/powers.json');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('hero_inconnu');

        $projection->appliquer([
            'myhordes.fixtures.actions' => [
                'heroics' => [['name' => 'hero_inconnu', 'unlockable' => true]],
                'actions' => [],
            ],
        ]);
    }
}
