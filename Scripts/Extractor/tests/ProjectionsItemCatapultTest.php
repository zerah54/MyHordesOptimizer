<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use PHPUnit\Framework\TestCase;

final class ProjectionsItemCatapultTest extends TestCase
{
    use TrouveProjection;

    public function testLaProjectionRestitueItemsCataTelleQuelle(): void
    {
        $brut = [
            'myhordes.fixtures.actions' => [
                'items_cata' => [
                    'wood2_#00' => 'cata_rsc_fine',
                    'angryc_#00' => 'cata_wpn_destroy_1_high',
                ],
            ],
        ];

        $resultat = self::parCible('Items/item-catapult.json')->appliquer($brut);

        self::assertSame([
            'wood2_#00' => 'cata_rsc_fine',
            'angryc_#00' => 'cata_wpn_destroy_1_high',
        ], $resultat);
    }
}
