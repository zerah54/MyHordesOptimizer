<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\UpgradeEffectsReader;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class UpgradeEffectsReaderTest extends TestCase
{
    /**
     * Source factice reprenant les trois formes reconnues, avec la syntaxe PHP 8.4 du jeu (`new X()->y()`).
     */
    private static function source(): string
    {
        $racine = sys_get_temp_dir() . '/mho_evolutions_' . bin2hex(random_bytes(4));

        self::ecrire($racine, UpgradeEffectsReader::LISTENER_EVOLUTION, <<<'PHP'
            <?php
            class BuildingUpgradeListener {
                public function onProcessPreAttackUpgrade($event): void {
                    $event->defenseIncrement = match ($event->building->getPrototype()->getName()) {
                        'small_gather_#00' => [0,20,45][ $event->building->getLevel() ] ?? 0,
                        'oddity_#00' => $this->calcul(),
                        default => $event->defenseIncrement
                    };
                    $event->defenseMultiplier = match ($event->building->getPrototype()->getName()) {
                        'item_tube_#00' => [0, 0.8, -1.6][ $event->building->getLevel() ] ?? 0.0,
                        default => $event->defenseMultiplier
                    };
                    $x = new Foo()->bar();
                }
            }
            PHP);

        self::ecrire($racine, UpgradeEffectsReader::LISTENER_VALEURS, <<<'PHP'
            <?php
            class BuildingQueryListener {
                public function onQueryTownParameter($event): void {
                    $event->value = match ($event->query) {
                        BuildingValueQuery::GuardianDefenseBonus => 5,
                        BuildingValueQuery::OverallTownDefenseScale => match ($this->th()->getBuilding($event->town, 'item_shield_#00', true)?->getLevel() ?? -1) {
                            0 => 1.10,
                            1 => 1.11,
                            default => 1.0
                        },
                        BuildingValueQuery::NightlyZoneDiscoveryRadius => match ($this->th()->getBuilding($event->town, 'item_scope_#00', true)?->getLevel() ?? -1) {
                            0 => 3,
                            2, 3 => 10,
                            default => 0
                        },
                        BuildingValueQuery::ConstructionAPRatio => match ($this->th()->getBuilding($event->town, 'small_refine_#00')?->getLevel()) {
                            4 => 0.75,
                            default => 1.0 - min(0.06, 0.28)
                        },
                    };
                }
            }
            PHP);

        self::ecrire($racine, UpgradeEffectsReader::TOWN_HANDLER, <<<'PHP'
            <?php
            class TownHandler {
                public function calculate_town_def($town): int {
                    foreach ($town->getBuildings() as $building) {
                        if ($building->getPrototype()->getName() === 'item_meca_parts_#00')
                            $factor = 1;
                        else if ($building->getPrototype()->getName() === "small_cemetery_#00") {
                            $ratio = match($building->getLevel()) {
                                0 => 3,
                                1 => 7,
                                default => 14,
                            };
                        }
                    }
                    return 0;
                }
            }
            PHP);

        return $racine;
    }

    private static function ecrire(string $racine, string $relatif, string $code): void
    {
        $chemin = "$racine/$relatif";
        if (!is_dir(dirname($chemin))) {
            mkdir(dirname($chemin), 0777, true);
        }
        file_put_contents($chemin, $code);
    }

    public function testLitLesTableauxParNiveauDuListenerDEvolution(): void
    {
        $effets = (new UpgradeEffectsReader(self::source()))->lire();

        self::assertSame([0, 20, 45], $effets['small_gather_#00']['defenseIncrement']['valeurs']);
        self::assertSame(0, $effets['small_gather_#00']['defenseIncrement']['defaut']);
        self::assertSame([0, 0.8, -1.6], $effets['item_tube_#00']['defenseMultiplier']['valeurs']);
        self::assertSame('BuildingUpgradeListener', $effets['item_tube_#00']['defenseMultiplier']['source']);
    }

    public function testLitLesValeursParNiveauDesRequetes(): void
    {
        $effets = (new UpgradeEffectsReader(self::source()))->lire();

        self::assertSame([0 => 1.10, 1 => 1.11], $effets['item_shield_#00']['OverallTownDefenseScale']['valeurs']);
        self::assertSame(1.0, $effets['item_shield_#00']['OverallTownDefenseScale']['defaut']);
        self::assertSame([0 => 3, 2 => 10, 3 => 10], $effets['item_scope_#00']['NightlyZoneDiscoveryRadius']['valeurs']);
        self::assertArrayNotHasKey('GuardianDefenseBonus', $effets['item_shield_#00']);
    }

    public function testLitLesValeursParNiveauDuTownHandler(): void
    {
        $effets = (new UpgradeEffectsReader(self::source()))->lire();

        self::assertSame([0 => 3, 1 => 7], $effets['small_cemetery_#00']['calculate_town_def.ratio']['valeurs']);
        self::assertSame(14, $effets['small_cemetery_#00']['calculate_town_def.ratio']['defaut']);
        self::assertArrayNotHasKey('item_meca_parts_#00', $effets);
    }

    public function testSignaleLesFormesNonReconnuesSansLesInterpreter(): void
    {
        $lecteur = new UpgradeEffectsReader(self::source());
        $effets = $lecteur->lire();

        self::assertArrayNotHasKey('oddity_#00', $effets);
        self::assertNull($effets['small_refine_#00']['ConstructionAPRatio']['defaut']);
        self::assertSame([4 => 0.75], $effets['small_refine_#00']['ConstructionAPRatio']['valeurs']);
        self::assertCount(2, $lecteur->ignores());
    }

    public function testUnFichierDisparuArreteLExtraction(): void
    {
        $this->expectException(RuntimeException::class);

        (new UpgradeEffectsReader(sys_get_temp_dir() . '/mho_absent_' . bin2hex(random_bytes(4))))->lire();
    }
}
