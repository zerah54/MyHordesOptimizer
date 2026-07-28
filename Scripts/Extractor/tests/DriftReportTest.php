<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\DriftReport;
use PHPUnit\Framework\TestCase;

final class DriftReportTest extends TestCase
{
    public function testDetecteLesClesAjouteesEtRetirees(): void
    {
        $rapport = DriftReport::comparer(
            ['a' => ['x' => 1], 'b' => ['x' => 1]],
            ['a' => ['x' => 1], 'c' => ['x' => 1]]
        );

        self::assertSame(['c'], $rapport->clesAjoutees());
        self::assertSame(['b'], $rapport->clesRetirees());
    }

    public function testDetecteLesClesModifiees(): void
    {
        $rapport = DriftReport::comparer(
            ['a' => ['x' => 1]],
            ['a' => ['x' => 2]]
        );

        self::assertSame(['a'], $rapport->clesModifiees());
    }

    public function testDetecteUnChampApparu(): void
    {
        $rapport = DriftReport::comparer(
            ['a' => ['x' => 1]],
            ['a' => ['x' => 1, 'y' => 2]]
        );

        self::assertSame(['y'], $rapport->champsApparus());
        self::assertSame([], $rapport->champsDisparus());
    }

    public function testDetecteUnChampDisparu(): void
    {
        $rapport = DriftReport::comparer(
            ['a' => ['x' => 1, 'daysNeeded' => 3]],
            ['a' => ['x' => 1, 'unlockAt' => 3]]
        );

        self::assertSame(['unlockAt'], $rapport->champsApparus());
        self::assertSame(['daysNeeded'], $rapport->champsDisparus());
    }

    public function testCalculeLaProportionDeClesPerdues(): void
    {
        $rapport = DriftReport::comparer(
            ['a' => [], 'b' => [], 'c' => [], 'd' => []],
            ['a' => [], 'b' => []]
        );

        self::assertEqualsWithDelta(0.5, $rapport->proportionPerdue(), 0.001);
    }

    public function testUnPremierPassageNePerdRien(): void
    {
        $rapport = DriftReport::comparer(null, ['a' => []]);

        self::assertSame(0.0, $rapport->proportionPerdue());
        self::assertSame(['a'], $rapport->clesAjoutees());
    }

    public function testUnFichierQuiSeVideEstUneProportionTotale(): void
    {
        $rapport = DriftReport::comparer(['a' => [], 'b' => []], []);

        self::assertEqualsWithDelta(1.0, $rapport->proportionPerdue(), 0.001);
    }

    public function testLaDetectionDeFormePeutEtreDesactivee(): void
    {
        $rapport = DriftReport::comparer(
            ['a' => ['x' => 1]],
            ['a' => ['x' => 1, 'y' => 2]],
            false
        );

        self::assertSame([], $rapport->champsApparus());
        self::assertSame([], $rapport->champsDisparus());
    }

    public function testUneListeNeProduitPasDeClesModifieesParIndex(): void
    {
        // Une entrée insérée en tête décale tout ce qui suit : à index égal, chaque paire
        // ancien/nouveau diffère. Sur une liste, ce n'est pas une « modification », c'est un
        // décalage de position — comparer par identité n'a pas de sens ici.
        $rapport = DriftReport::comparer(
            [['id' => 'a'], ['id' => 'b'], ['id' => 'c']],
            [['id' => 'x'], ['id' => 'a'], ['id' => 'b'], ['id' => 'c']]
        );

        self::assertSame([], $rapport->clesModifiees());
        self::assertSame(['3'], $rapport->clesAjoutees());
        self::assertSame([], $rapport->clesRetirees());
    }

    public function testResumeSansDeriveDeFormeNAfficheQueLaLigneDeDonnees(): void
    {
        $rapport = DriftReport::comparer(
            ['a' => ['x' => 1], 'b' => ['x' => 1]],
            ['a' => ['x' => 1], 'c' => ['x' => 1]]
        );

        self::assertSame('    données : +1  -1  ~0', $rapport->resume());
    }

    public function testResumeAvecDeriveDeFormeAfficheLaLigneForme(): void
    {
        $rapport = DriftReport::comparer(
            ['a' => ['x' => 1, 'daysNeeded' => 3]],
            ['a' => ['x' => 1, 'unlockAt' => 3]]
        );

        self::assertSame(
            '    données : +0  -0  ~1' . PHP_EOL
                . '    FORME   : champs apparus [unlockAt]  disparus [daysNeeded]  → vérifier le modèle C#',
            $rapport->resume()
        );
    }

    public function testResumeDUneListeRapporteLesEffectifsAuLieuDesModifications(): void
    {
        $rapport = DriftReport::comparer(
            [['id' => 'a'], ['id' => 'b'], ['id' => 'c']],
            [['id' => 'x'], ['id' => 'a'], ['id' => 'b'], ['id' => 'c']]
        );

        self::assertSame(
            '    données : +1  -0  liste : 3 → 4 entrée(s) (pas de comparaison par identité)',
            $rapport->resume()
        );
    }
}
