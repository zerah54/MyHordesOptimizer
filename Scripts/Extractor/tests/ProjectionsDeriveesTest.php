<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use PHPUnit\Framework\TestCase;

final class ProjectionsDeriveesTest extends TestCase
{
    use TrouveProjection;

    public function testUnObjetQuiArriveIntactNEstPasFragile(): void
    {
        $resultat = self::parCible('Items/item-properties.json')->appliquer(self::brutCatapulte());

        self::assertNotContains('fragile', $resultat['wood2_#00']);
    }

    public function testUnObjetDetruitEstFragile(): void
    {
        $resultat = self::parCible('Items/item-properties.json')->appliquer(self::brutCatapulte());

        self::assertContains('fragile', $resultat['angryc_#00']);
    }

    public function testUnObjetTransformeEstFragile(): void
    {
        $resultat = self::parCible('Items/item-properties.json')->appliquer(self::brutCatapulte());

        self::assertContains('fragile', $resultat['vodka_#00']);
    }

    public function testFragileNEcrasePasLesProprietesExistantes(): void
    {
        $resultat = self::parCible('Items/item-properties.json')->appliquer(self::brutCatapulte());

        self::assertSame(['weapon', 'fragile'], $resultat['angryc_#00']);
    }

    public function testUnObjetAbsentDeItemsCataNEstPasFragile(): void
    {
        $resultat = self::parCible('Items/item-properties.json')->appliquer(self::brutCatapulte());

        self::assertSame(['ressource'], $resultat['inconnu_#00']);
    }

    /**
     * Un effet de catapulte sans résultat défini ne doit SURTOUT PAS être traité comme « ne
     * contient pas morph_cata_fine », ce qui marquerait l'objet fragile sur une absence.
     */
    public function testUnEffetSansResultatEchoueAuLieuDeMarquerFragile(): void
    {
        $brut = self::brutCatapulte();
        $brut['myhordes.fixtures.actions']['items_cata']['mystere_#00'] = 'cata_effet_inconnu';

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('cata_effet_inconnu');

        self::parCible('Items/item-properties.json')->appliquer($brut);
    }

    /**
     * Cas distinct du précédent : ici l'effet EXISTE dans `actions`, mais son entrée n'a pas de
     * clé `result` du tout (par exemple parce qu'elle ne comporte qu'un `label`). C'est le cas
     * qu'un `?? []` masquerait silencieusement — l'effet inconnu ci-dessus échoue déjà pour une
     * autre raison (absence totale de l'entrée), donc les deux méritent chacun leur test.
     */
    public function testUneActionExistanteSansCleResultatEchoueAussi(): void
    {
        $brut = self::brutCatapulte();
        $brut['myhordes.fixtures.actions']['items_cata']['mystere_#00'] = 'cata_sans_resultat';
        $brut['myhordes.fixtures.actions']['actions']['cata_sans_resultat'] = ['label' => 'Effet mal renseigné'];

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('cata_sans_resultat');

        self::parCible('Items/item-properties.json')->appliquer($brut);
    }

    public function testUneChaineAuxiliaireManquanteEchoue(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('items_cata');

        self::parCible('Items/item-properties.json')->appliquer([
            'myhordes.fixtures.items.properties' => ['wood2_#00' => ['ressource']],
            'myhordes.fixtures.actions' => ['actions' => []],
        ]);
    }

    /** @return array<string, array<mixed>> */
    private static function brutCatapulte(): array
    {
        return [
            'myhordes.fixtures.items.properties' => [
                'wood2_#00' => ['ressource'],
                'angryc_#00' => ['weapon'],
                'vodka_#00' => [],
                'inconnu_#00' => ['ressource'],
            ],
            'myhordes.fixtures.actions' => [
                'items_cata' => [
                    'wood2_#00' => 'cata_rsc_fine',
                    'angryc_#00' => 'cata_wpn_destroy_1_high',
                    'vodka_#00' => 'cata_rsc_remains',
                ],
                'actions' => [
                    'cata_rsc_fine' => ['result' => ['morph_cata_fine']],
                    'cata_wpn_destroy_1_high' => ['result' => ['consume_item', 'cata_kill_1_high']],
                    'cata_rsc_remains' => ['result' => ['morph_cata_remains']],
                ],
            ],
        ];
    }
}
