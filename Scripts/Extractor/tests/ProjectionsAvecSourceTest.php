<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\Config;
use MyHordesOptimizer\Extractor\FixtureHarness;
use MyHordesOptimizer\Extractor\SourceFetcher;
use PHPUnit\Framework\TestCase;

final class ProjectionsAvecSourceTest extends TestCase
{
    use TrouveProjection;

    private static bool $sourcePrete = false;

    public static function setUpBeforeClass(): void
    {
        $racine = dirname(__DIR__);

        try {
            $source = (new SourceFetcher(Config::load($racine)))->recuperer();
            // Instancier le harnais et extraire une chaîne enregistre le chargeur PSR-4,
            // ce qui rend les classes App\Entity\* résolvables.
            (new FixtureHarness($source))->extraire();
            self::$sourcePrete = true;
        } catch (\Throwable) {
            self::$sourcePrete = false;
        }
    }

    protected function setUp(): void
    {
        if (!self::$sourcePrete) {
            self::markTestSkipped('Source MyHordes indisponible (réseau ou configuration).');
        }
    }

    public function testLeTypeDeRecetteDevientLeNomSymbolique(): void
    {
        $resultat = self::parCible('Items/recipes.json')->appliquer([
            'myhordes.fixtures.recipes' => [
                'ws001' => ['type' => 1, 'in' => 'a_#00', 'out' => 'b_#00'],
                'com001' => ['type' => 13, 'in' => ['c_#00'], 'out' => ['d_#00']],
            ],
        ]);

        // C'est exactement la chaîne que compare DiscordBot/Modules/RecipesModule.cs:128.
        self::assertSame('Recipe::WorkshopType', $resultat['ws001']['type']);
        self::assertSame('Recipe::ManualAnywhere', $resultat['com001']['type']);
    }

    public function testUnTypeDeRecetteInconnuEchoue(): void
    {
        $this->expectException(\RuntimeException::class);

        self::parCible('Items/recipes.json')->appliquer([
            'myhordes.fixtures.recipes' => [
                'wsXXX' => ['type' => 9999, 'in' => 'a_#00', 'out' => 'b_#00'],
            ],
        ]);
    }

    public function testLesCausesDeMortPortentLeNomEtLaValeur(): void
    {
        $resultat = self::parCible('CauseOfDeath/cause-of-death.json')->appliquer([
            'myhordes.fixtures.citizen.deaths' => [
                ['ref' => 10, 'label' => 'Inconnu', 'icon' => 'unknown', 'desc' => '...'],
                ['ref' => 6, 'label' => 'Attaque', 'icon' => 'die2nite', 'desc' => '...'],
            ],
        ]);

        self::assertSame('Unknown', $resultat[0]['ref']);
        self::assertSame(10, $resultat[0]['dtype']);
        self::assertSame('Inconnu', $resultat[0]['label']);

        self::assertSame('NightlyAttack', $resultat[1]['ref']);
        self::assertSame(6, $resultat[1]['dtype']);
    }
}
