<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use PHPUnit\Framework\TestCase;

final class ProjectionsEmotesObjetsTest extends TestCase
{
    use TrouveProjection;

    public function testSeulsLesObjetsMarquesDonnentUnEmoteAuFormatDuForum(): void
    {
        $brut = [
            'myhordes.fixtures.items.list' => [
                'saw_tool_#00' => ['label' => 'Scie', 'icon' => 'saw_tool', 'isEmote' => true],
                'wood2_#00' => ['label' => 'Planche', 'icon' => 'wood2', 'isEmote' => false],
                'water_#00' => ['label' => 'Eau', 'icon' => 'water'],
            ],
        ];

        $resultat = self::parCible('Items/emotes.json')->appliquer($brut);

        self::assertSame(['saw_tool_#00' => ':item_saw_tool:'], $resultat);
    }

    public function testLesUidsNeSontPasSurveillesCommeUnSchema(): void
    {
        self::assertFalse(self::parCible('Items/emotes.json')->detecterLaForme());
    }
}
