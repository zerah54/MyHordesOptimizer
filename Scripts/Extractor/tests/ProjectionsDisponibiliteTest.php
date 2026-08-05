<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use PHPUnit\Framework\TestCase;

final class ProjectionsDisponibiliteTest extends TestCase
{
    use TrouveProjection;

    public function testLaDisponibiliteEstProjeteeTelleQuelle(): void
    {
        $resultat = self::parCible('Buildings/availability.json')->appliquer([
            'mho.buildings.availability' => [
                'small_vaudoudoll_#00' => ['RNE' => 'disabled', 'RE' => 'disabled'],
            ],
        ]);

        self::assertSame(['RNE' => 'disabled', 'RE' => 'disabled'], $resultat['small_vaudoudoll_#00']);
    }
}
