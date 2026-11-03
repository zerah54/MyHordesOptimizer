<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\Projection;
use MyHordesOptimizer\Extractor\Projections;
use PHPUnit\Framework\TestCase;

final class ProjectionsHabitationsTest extends TestCase
{
    use TrouveProjection;

    public function testLesCiblesHabitationsExistent(): void
    {
        $cibles = array_map(
            static fn(Projection $p): string => $p->fichierCible(),
            Projections::toutes()
        );

        self::assertContains('Citizens/home-levels.json', $cibles);
        self::assertContains('Citizens/home-upgrades.json', $cibles);
    }

    public function testLesNiveauxSontRenvoyesTelsQuels(): void
    {
        $brut = ['myhordes.fixtures.citizen.home.levels' => [
            ['label' => 'Zelt', 'icon' => 'home_lv1', 'def' => 1, 'ap' => 2, 'ap_urbanism' => 2,
                'resources' => [], 'resources_urbanism' => [], 'building' => null, 'upgrades' => true, 'theft' => false],
        ]];

        self::assertSame(
            $brut['myhordes.fixtures.citizen.home.levels'],
            self::parCible('Citizens/home-levels.json')->appliquer($brut)
        );
    }

    public function testLesAmeliorationsSontRenvoyeesTellesQuelles(): void
    {
        $brut = ['myhordes.fixtures.citizen.home.upgrades' => [
            ['name' => 'curtain', 'label' => 'Großer Vorhang', 'desc' => '...', 'levels' => ['1' => [4, []]]],
        ]];

        self::assertSame(
            $brut['myhordes.fixtures.citizen.home.upgrades'],
            self::parCible('Citizens/home-upgrades.json')->appliquer($brut)
        );
    }
}
