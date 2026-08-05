<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\RulesYamlReader;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class RulesYamlReaderTest extends TestCase
{
    private static function ecrireFixture(string $contenu): string
    {
        $chemin = tempnam(sys_get_temp_dir(), 'mho_rules') . '.yml';
        file_put_contents($chemin, $contenu);

        return $chemin;
    }

    public function testUnChantierDesactiveParDefautResteDesactiveEnReEtCustom(): void
    {
        $chemin = self::ecrireFixture(<<<YAML
            parameters:
              rules:
                default:
                  disabled_buildings: ['small_vaudoudoll_#00']
                small: {}
                remote: {}
                panda: {}
                custom: {}
            YAML
        );

        $resultat = (new RulesYamlReader())->disponibilite($chemin);

        self::assertSame('disabled', $resultat['small_vaudoudoll_#00']['RE']);
        self::assertSame('disabled', $resultat['small_vaudoudoll_#00']['CUSTOM']);
    }

    public function testUneListeNueRedefinieRemplaceCelleDeDefaut(): void
    {
        $chemin = self::ecrireFixture(<<<YAML
            parameters:
              rules:
                default:
                  initial_buildings: []
                  unlocked_buildings: []
                small:
                  unlocked_buildings: ['small_gather_#02']
                remote: {}
                panda: {}
                custom: {}
            YAML
        );

        $resultat = (new RulesYamlReader())->disponibilite($chemin);

        self::assertSame('unlocked', $resultat['small_gather_#02']['RNE']);
        self::assertArrayNotHasKey('RE', $resultat['small_gather_#02']);
    }

    public function testUnMergeAjouteAuxElementsDeDefautSansLesRemplacer(): void
    {
        $chemin = self::ecrireFixture(<<<YAML
            parameters:
              rules:
                default:
                  disabled_buildings: ['small_vaudoudoll_#00']
                small:
                  disabled_buildings:
                    merge: ['small_novlamps_#00']
                remote: {}
                panda: {}
                custom: {}
            YAML
        );

        $resultat = (new RulesYamlReader())->disponibilite($chemin);

        self::assertSame('disabled', $resultat['small_vaudoudoll_#00']['RNE']);
        self::assertSame('disabled', $resultat['small_novlamps_#00']['RNE']);
        // RE hérite de `default` seul : le merge de `small` ne doit pas y fuiter.
        self::assertArrayNotHasKey('RE', $resultat['small_novlamps_#00'] ?? []);
    }

    public function testUnBlocDeModeManquantEchoue(): void
    {
        $chemin = self::ecrireFixture(<<<YAML
            parameters:
              rules:
                default: {}
                small: {}
                remote: {}
                custom: {}
            YAML
        );

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('panda');

        (new RulesYamlReader())->disponibilite($chemin);
    }

    public function testOverridesRareteLitLaTableComplete(): void
    {
        $chemin = self::ecrireFixture(<<<YAML
            parameters:
              rules:
                default: {}
                small: {}
                remote: {}
                custom: {}
                panda:
                  overrides:
                    building_rarity:
                      '0>': 5
                      small_dig_#01: 1
            YAML
        );

        $resultat = (new RulesYamlReader())->overridesRarete($chemin);

        self::assertSame(5, $resultat['0>']);
        self::assertSame(1, $resultat['small_dig_#01']);
    }
}
