<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\Projection;
use MyHordesOptimizer\Extractor\Projections;
use PHPUnit\Framework\TestCase;

final class ProjectionTest extends TestCase
{
    use TrouveProjection;

    public function testUneProjectionSansTransformationRendLaChaineTelleQuelle(): void
    {
        $projection = new Projection('Items/categories.json', 'ma.chaine', null, null);

        $resultat = $projection->appliquer(['ma.chaine' => [['name' => 'Rsc']]]);

        self::assertSame([['name' => 'Rsc']], $resultat);
    }

    public function testUneProjectionExtraitUneSousCle(): void
    {
        $projection = new Projection('Items/actions.json', 'ma.chaine', 'actions', null);

        $resultat = $projection->appliquer(['ma.chaine' => ['actions' => ['a' => 1], 'items' => []]]);

        self::assertSame(['a' => 1], $resultat);
    }

    public function testUneChaineManquanteEchoue(): void
    {
        $projection = new Projection('X.json', 'absente', null, null);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('absente');

        $projection->appliquer([]);
    }

    public function testUneSousCleManquanteEchoue(): void
    {
        $projection = new Projection('X.json', 'ma.chaine', 'introuvable', null);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('introuvable');

        $projection->appliquer(['ma.chaine' => ['autre' => 1]]);
    }

    public function testLaNormalisationDeFindEnveloppeLesScalaires(): void
    {
        $projection = self::parCible('Items/find.json');

        $resultat = $projection->appliquer([
            'myhordes.fixtures.items.groups' => [
                'base_dig' => ['wood2_#00' => 170, 'special_#00' => [12, 3]],
            ],
        ]);

        self::assertSame([170], $resultat['base_dig']['wood2_#00']);
        self::assertSame([12, 3], $resultat['base_dig']['special_#00']);
    }

    public function testLaNormalisationDesRuinesEnveloppeLesDrops(): void
    {
        $projection = self::parCible('Ruins/ruins.json');

        $resultat = $projection->appliquer([
            'myhordes.fixtures.ruins.data' => [
                'home' => ['drops' => ['can_#00' => 95, 'infect_#00' => [429, 51]]],
            ],
        ]);

        self::assertSame([95], $resultat['home']['drops']['can_#00']);
        self::assertSame([429, 51], $resultat['home']['drops']['infect_#00']);
    }

    /**
     * Forme « alias » : la clé est synthétique et le vrai nom d'objet est dans « item ».
     * L'import cherche l'objet PAR LA CLÉ, donc laisser passer un alias fait échouer l'import.
     */
    public function testUnAliasDeButinNeSurvitPasSousSaCleSynthetique(): void
    {
        $projection = self::parCible('Ruins/ruins.json');

        $resultat = $projection->appliquer([
            'myhordes.fixtures.ruins.data' => [
                'post' => ['drops' => [
                    'postal_box_#01' => [3, 102],
                    'postal_box_#01_xmas_alt_1' => ['item' => 'postal_box_#01', 'count' => 3, 'mod' => 1021],
                ]],
            ],
        ]);

        self::assertArrayNotHasKey('postal_box_#01_xmas_alt_1', $resultat['post']['drops']);
        // L'entrée de base est conservée telle quelle : c'est la valeur hors événement.
        self::assertSame([3, 102], $resultat['post']['drops']['postal_box_#01']);
    }

    public function testUnAliasEstAdopteSousSonVraiNomQuandLObjetNEstPasDejaDeclare(): void
    {
        $projection = self::parCible('Ruins/ruins.json');

        $resultat = $projection->appliquer([
            'myhordes.fixtures.ruins.data' => [
                'post' => ['drops' => [
                    'cadeau_#00_alias' => ['item' => 'cadeau_#00', 'count' => 7, 'mod' => 1022],
                ]],
            ],
        ]);

        self::assertArrayNotHasKey('cadeau_#00_alias', $resultat['post']['drops']);
        self::assertSame([7, 1022], $resultat['post']['drops']['cadeau_#00']);
    }

    public function testUnAliasSansModePrendLeModeNeutre(): void
    {
        $projection = self::parCible('Ruins/ruins.json');

        $resultat = $projection->appliquer([
            'myhordes.fixtures.ruins.data' => [
                'post' => ['drops' => ['x_alias' => ['item' => 'x_#00', 'count' => 4]]],
            ],
        ]);

        self::assertSame([4, 0], $resultat['post']['drops']['x_#00']);
    }

    public function testAucuneValeurDeButinNeResteUnObjet(): void
    {
        $projection = self::parCible('Ruins/ruins.json');

        $resultat = $projection->appliquer([
            'myhordes.fixtures.ruins.data' => [
                'post' => ['drops' => [
                    'a_#00' => 5,
                    'b_#00' => [3, 102],
                    'c_alias' => ['item' => 'c_#00', 'count' => 3, 'mod' => 1021],
                ]],
            ],
        ]);

        foreach ($resultat['post']['drops'] as $objet => $valeur) {
            self::assertTrue(
                is_array($valeur) && array_is_list($valeur),
                "Le butin « $objet » n'est pas une liste : l'import C# attend un tableau JSON."
            );
        }
    }

    /**
     * Volontairement sans clé `type` : la conversion de `type` demande la classe
     * `App\Entity\Recipe`, donc une source téléchargée. Elle est couverte en tâche 7.
     */
    public function testLesRecettesEnveloppentInEtOut(): void
    {
        $projection = self::parCible('Items/recipes.json');

        $resultat = $projection->appliquer([
            'myhordes.fixtures.recipes' => [
                'ws001' => ['in' => 'a_#00', 'out' => 'b_#00'],
                'ws011' => ['in' => 'c_#00', 'out' => [['d_#00', 15], ['e_#00', 16]]],
            ],
        ]);

        self::assertSame(['a_#00'], $resultat['ws001']['in']);
        self::assertSame(['b_#00'], $resultat['ws001']['out']);
        self::assertSame([['d_#00', 15], ['e_#00', 16]], $resultat['ws011']['out']);
    }

    public function testLaDetectionDeFormeEstActiveParDefaut(): void
    {
        $projection = new Projection('Items/categories.json', 'ma.chaine', null, null);

        self::assertTrue($projection->detecterLaForme());
    }

    public function testFindJsonDesactiveLaDetectionDeForme(): void
    {
        // `find.json` n'a pas de schéma d'entrée fixe : ses clés sont des données (noms de
        // groupes, codes d'objets), pas des champs.
        $projection = self::parCible('Items/find.json');

        self::assertFalse($projection->detecterLaForme());
    }

    public function testToutesLesProjectionsOntUneCibleDistincte(): void
    {
        $cibles = array_map(
            static fn (Projection $p): string => $p->fichierCible(),
            Projections::toutes()
        );

        self::assertSame($cibles, array_unique($cibles));
    }
}
