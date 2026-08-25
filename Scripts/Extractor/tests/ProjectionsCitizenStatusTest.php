<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\Projection;
use MyHordesOptimizer\Extractor\Projections;
use PHPUnit\Framework\TestCase;

final class ProjectionsCitizenStatusTest extends TestCase
{
    use TrouveProjection;

    public function testLaCibleCitizensStatusExiste(): void
    {
        $cibles = array_map(
            static fn(Projection $p): string => $p->fichierCible(),
            Projections::toutes()
        );

        self::assertContains('Citizens/status.json', $cibles);
    }

    public function testLaProjectionRenvoieLeDictionnaireDeStatutsTelQuel(): void
    {
        $projection = self::parCible('Citizens/status.json');

        $brut = [
            'myhordes.fixtures.citizen.status' => [
                'thirst1' => [
                    'name' => 'thirst1',
                    'nw_def' => -5,
                    'label' => 'Durst',
                    'description' => '...',
                    'volatile' => false,
                ],
            ],
        ];

        self::assertSame($brut['myhordes.fixtures.citizen.status'], $projection->appliquer($brut));
    }
}
