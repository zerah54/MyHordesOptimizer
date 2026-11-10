<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\BuildingTranslationsReader;
use PHPUnit\Framework\TestCase;

final class ProjectionsEvolutionsTest extends TestCase
{
    use TrouveProjection;

    /** @return array<string, array<mixed>> */
    private static function brut(): array
    {
        return [
            'myhordes.fixtures.buildings' => [
                'small_gather_#00' => [
                    'voteLevel' => 3,
                    'baseVoteText' => 'Basis',
                    'upgradeTexts' => ['Stufe 1', 'Stufe 2', 'Stufe 3'],
                ],
                'small_wallimprove_#00' => ['voteLevel' => 0],
            ],
            'mho.buildings.upgrade_effects' => [
                'small_gather_#00' => [
                    'defenseIncrement' => ['valeurs' => [0, 20, 45], 'defaut' => 0, 'source' => 'BuildingUpgradeListener'],
                ],
                'item_scope_#00' => [
                    'NightlyZoneDiscoveryRadius' => ['valeurs' => [0 => 3, 2 => 10], 'defaut' => 0, 'source' => 'BuildingQueryListener'],
                ],
            ],
            'mho.buildings.translations' => [
                'fr' => ['Basis' => 'Base', 'Stufe 1' => 'Niveau 1'],
                'en' => [],
                'es' => [],
            ],
        ];
    }

    public function testNiveauMaximumTextesTraduitsEtValeursParNiveau(): void
    {
        $resultat = self::parCible('Buildings/upgrades.json')->appliquer(self::brut());

        $fosse = $resultat['small_gather_#00'];
        self::assertSame(3, $fosse['maxLevel']);
        self::assertSame(['de' => 'Basis', 'fr' => 'Base', 'en' => 'Basis', 'es' => 'Basis'], $fosse['texts']['base']);
        self::assertSame('Niveau 1', $fosse['texts']['levels'][0]['fr']);
        self::assertSame('Stufe 2', $fosse['texts']['levels'][1]['fr']);
        // Pas de valeur propre au niveau 3 : le défaut comble.
        self::assertSame([0, 20, 45, 0], $fosse['effects']['defenseIncrement']['levels']);
    }

    public function testUnChantierSansEvolutionNiEffetEstOmis(): void
    {
        $resultat = self::parCible('Buildings/upgrades.json')->appliquer(self::brut());

        self::assertArrayNotHasKey('small_wallimprove_#00', $resultat);
    }

    public function testUnChantierAEffetsHorsFixturesGardeSesNiveauxConnus(): void
    {
        $resultat = self::parCible('Buildings/upgrades.json')->appliquer(self::brut());

        self::assertSame(0, $resultat['item_scope_#00']['maxLevel']);
        self::assertArrayNotHasKey('texts', $resultat['item_scope_#00']);
        self::assertSame([3, 0, 10], $resultat['item_scope_#00']['effects']['NightlyZoneDiscoveryRadius']['levels']);
    }

    public function testUnTexteSansTraductionResteEnAllemand(): void
    {
        self::assertSame(
            ['de' => 'Text', 'fr' => 'Text', 'en' => 'Text', 'es' => 'Text'],
            BuildingTranslationsReader::traduire('Text', ['fr' => [], 'en' => [], 'es' => []])
        );
    }
}
