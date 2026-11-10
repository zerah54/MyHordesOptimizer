<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use PHPUnit\Framework\TestCase;

final class ProjectionsFichesObjetsTest extends TestCase
{
    use TrouveProjection;

    public function testLesExtrasNeGardentQueWatchimpactEtBagExtensionType(): void
    {
        $brut = [
            'myhordes.fixtures.items.list' => [
                'shield_#00' => ['watchimpact' => 5],
                'bag_#00' => ['bagExtensionType' => 1],
                'wood2_#00' => ['label' => 'x'],
            ],
        ];

        $resultat = self::parCible('Items/item-extras.json')->appliquer($brut);

        self::assertSame(
            ['shield_#00' => ['watchImpact' => 5], 'bag_#00' => ['bagExtensionType' => 1]],
            $resultat
        );
    }

    public function testLesGroupesNommesSontProjetesTelsQuels(): void
    {
        $groupes = ['g_break_20' => [[['do_nothing'], 80], [['break_item'], 20]]];
        $brut = ['myhordes.fixtures.actions' => ['results' => ['group' => $groupes]]];

        self::assertSame($groupes, self::parCible('Items/result-groups.json')->appliquer($brut));
    }

    public function testLesConditionsSontProjeteesTellesQuelles(): void
    {
        $conditions = ['must_be_outside' => ['type' => 'location', 'collection' => ['min' => 1]]];
        $brut = ['myhordes.fixtures.actions' => ['meta_requirements' => $conditions]];

        self::assertSame($conditions, self::parCible('Items/meta-requirements.json')->appliquer($brut));
    }

    public function testAucuneDeCesCiblesNeSurveilleLaForme(): void
    {
        foreach (['Items/item-extras.json', 'Items/result-groups.json', 'Items/meta-requirements.json'] as $cible) {
            self::assertFalse(self::parCible($cible)->detecterLaForme(), $cible);
        }
    }
}
