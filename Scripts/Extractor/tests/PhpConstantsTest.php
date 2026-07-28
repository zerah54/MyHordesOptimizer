<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\PhpConstants;
use PHPUnit\Framework\TestCase;

final class PhpConstantsTest extends TestCase
{
    public function testInverseLesConstantesEntieres(): void
    {
        $noms = PhpConstants::tousLesNoms(ClasseDeDemonstration::class);

        self::assertSame('Premier', $noms[1]);
        self::assertSame('Second', $noms[2]);
    }

    public function testIgnoreLesConstantesNonEntieres(): void
    {
        $noms = PhpConstants::tousLesNoms(ClasseDeDemonstration::class);

        self::assertNotContains('Texte', $noms);
    }

    public function testProduitUnNomPrefixe(): void
    {
        self::assertSame(
            'Recipe::Premier',
            PhpConstants::nomPour(ClasseDeDemonstration::class, 1, 'Recipe')
        );
    }

    public function testProduitUnNomSansPrefixe(): void
    {
        self::assertSame(
            'Premier',
            PhpConstants::nomPour(ClasseDeDemonstration::class, 1, '')
        );
    }

    public function testEchoueSurUneValeurInconnue(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('99');

        PhpConstants::nomPour(ClasseDeDemonstration::class, 99, 'Recipe');
    }
}

final class ClasseDeDemonstration
{
    public const int Premier = 1;
    public const int Second = 2;
    public const string Texte = 'trois';
}
