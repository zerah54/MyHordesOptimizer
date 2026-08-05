<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use PHPUnit\Framework\TestCase;

final class ProjectionsPaliersPandemoniumTest extends TestCase
{
    use TrouveProjection;

    public function testUnBatimentSansHardModeEstAbsentDuResultat(): void
    {
        $resultat = self::parCible('Buildings/hard-resources.json')->appliquer(self::brutMinimal());

        self::assertArrayNotHasKey('sans_hard_mode_#00', $resultat);
    }

    public function testTier0EstLeJeuHardBrut(): void
    {
        $resultat = self::parCible('Buildings/hard-resources.json')->appliquer(self::brutMinimal());

        self::assertSame(['wood2_#00' => 10, 'metal_#00' => 5], $resultat['small_wallimprove_#00']['tier0']['resources']);
        self::assertSame(25, $resultat['small_wallimprove_#00']['tier0']['ap']);
    }

    public function testTier1EstLeJeuEasyBrut(): void
    {
        $resultat = self::parCible('Buildings/hard-resources.json')->appliquer(self::brutMinimal());

        self::assertSame(['wood2_#00' => 8, 'metal_#00' => 4], $resultat['small_wallimprove_#00']['tier1']['resources']);
        self::assertSame(20, $resultat['small_wallimprove_#00']['tier1']['ap']);
    }

    public function testTier2NaPasDeRessourcesCarIdentiquesATier1(): void
    {
        $resultat = self::parCible('Buildings/hard-resources.json')->appliquer(self::brutMinimal());

        self::assertArrayNotHasKey('resources', $resultat['small_wallimprove_#00']['tier2']);
    }

    public function testTier2ApReduitSelonLaRareteEffectiveNommee(): void
    {
        // small_wallimprove_#00 a une rareté de base 0, mais est nommé explicitement à 1 dans la
        // table d'overrides -> facteur 0,65, PAS le facteur de la règle générique '0>'.
        $resultat = self::parCible('Buildings/hard-resources.json')->appliquer(self::brutMinimal());

        self::assertSame((int)floor(20 * 0.65), $resultat['small_wallimprove_#00']['tier2']['ap']);
    }

    public function testTier2ApNestPasReduitQuandLaRareteEffectiveVaut5(): void
    {
        // small_autre_#00 : rareté de base 0, PAS nommé dans la table -> règle générique '0>' = 5
        // -> facteur "default" = 1, aucune réduction.
        $resultat = self::parCible('Buildings/hard-resources.json')->appliquer(self::brutMinimal());

        self::assertSame(30, $resultat['small_autre_#00']['tier2']['ap']);
    }

    /**
     * Constaté sur les données réelles le 2026-08-06 : 18 bâtiments sur 71 n'ont pas de clé
     * `easyAp` du tout. `BuildingPrototypeDataElement.php:123` fait `$this->easyAp ?? $this->ap`
     * côté jeu — l'absence signifie repli sur le PA par défaut, pas une donnée manquante.
     */
    public function testEasyApAbsentReplieSurLePaParDefaut(): void
    {
        $brut = self::brutMinimal();
        $brut['myhordes.fixtures.buildings']['small_wallimprove_#00']['ap'] = 22;
        unset($brut['myhordes.fixtures.buildings']['small_wallimprove_#00']['easyAp']);

        $resultat = self::parCible('Buildings/hard-resources.json')->appliquer($brut);

        self::assertSame(22, $resultat['small_wallimprove_#00']['tier1']['ap']);
    }

    /** Même repli côté hardAp, pour rester fidèle au code source (ligne 117 du même fichier). */
    public function testHardApAbsentReplieSurLePaParDefaut(): void
    {
        $brut = self::brutMinimal();
        $brut['myhordes.fixtures.buildings']['small_wallimprove_#00']['ap'] = 22;
        unset($brut['myhordes.fixtures.buildings']['small_wallimprove_#00']['hardAp']);

        $resultat = self::parCible('Buildings/hard-resources.json')->appliquer($brut);

        self::assertSame(22, $resultat['small_wallimprove_#00']['tier0']['ap']);
    }

    /**
     * Demandé par Hélène le 2026-08-06 : la colonne « Plan » du wiki affiche la rareté de BASE
     * (hors Pandémonium), pas la rareté effective. Un chantier nommément overridé (comme
     * small_wallimprove_#00 ici, rareté de base 0 mais nommé à 1) a réellement besoin d'un plan de
     * niveau 1 en Pandémonium — l'exposer permet de fusionner les colonnes « Plan »/« Plans lus ».
     */
    public function testRareteEffectiveExposeeQuandNommementOverridee(): void
    {
        $resultat = self::parCible('Buildings/hard-resources.json')->appliquer(self::brutMinimal());

        self::assertSame(1, $resultat['small_wallimprove_#00']['rareteEffective']);
    }

    /**
     * `'0>': 5` est un artefact de calcul (facteur "default" = pas de réduction), PAS une vraie
     * rareté de plan au sens du jeu — BlueprintEnum '5' désigne un chantier d'événement Pâques,
     * sans rapport. Ne pas l'exposer évite d'afficher une icône « chantier d'événement » à tort.
     */
    public function testRareteEffectiveAbsenteQuandIssueDeLaRegleGenerique(): void
    {
        $resultat = self::parCible('Buildings/hard-resources.json')->appliquer(self::brutMinimal());

        self::assertArrayNotHasKey('rareteEffective', $resultat['small_autre_#00']);
    }

    /** @return array<string, array<mixed>> */
    private static function brutMinimal(): array
    {
        return [
            'myhordes.fixtures.buildings' => [
                'sans_hard_mode_#00' => [
                    'hasHardMode' => false,
                ],
                'small_wallimprove_#00' => [
                    'hasHardMode' => true,
                    'hardAp' => 25, 'easyAp' => 20,
                    'hardResources' => ['wood2_#00' => 10, 'metal_#00' => 5],
                    'easyResources' => ['wood2_#00' => 8, 'metal_#00' => 4],
                    'blueprintLevel' => 0,
                ],
                'small_autre_#00' => [
                    'hasHardMode' => true,
                    'hardAp' => 40, 'easyAp' => 30,
                    'hardResources' => ['wood2_#00' => 20],
                    'easyResources' => ['wood2_#00' => 15],
                    'blueprintLevel' => 0,
                ],
            ],
            'mho.buildings.rarity_overrides' => [
                '0>' => 5,
                'small_wallimprove_#00' => 1,
            ],
        ];
    }
}
