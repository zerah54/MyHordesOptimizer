<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\Config;
use PHPUnit\Framework\TestCase;

final class ConfigTest extends TestCase
{
    private string $racine;

    protected function setUp(): void
    {
        $this->racine = sys_get_temp_dir() . '/extracteur_test_' . uniqid('', true);
        mkdir($this->racine);
        file_put_contents(
            $this->racine . '/config.local.php.dist',
            "<?php return ['ref' => 'master', 'chemin_hors_ligne' => null];"
        );
    }

    protected function tearDown(): void
    {
        foreach (glob($this->racine . '/*') ?: [] as $fichier) {
            unlink($fichier);
        }
        rmdir($this->racine);
    }

    public function testRetombeSurLeModeleQuandLaConfigLocaleEstAbsente(): void
    {
        $config = Config::load($this->racine);

        self::assertSame('master', $config->ref());
        self::assertNull($config->cheminHorsLigne());
        self::assertSame($this->racine, $config->racine());
    }

    public function testLaConfigLocalePrimeSurLeModele(): void
    {
        file_put_contents(
            $this->racine . '/config.local.php',
            "<?php return ['ref' => 'abc123', 'chemin_hors_ligne' => 'C:/ailleurs'];"
        );

        $config = Config::load($this->racine);

        self::assertSame('abc123', $config->ref());
        self::assertSame('C:/ailleurs', $config->cheminHorsLigne());
    }

    public function testUneRefVideEstRefusee(): void
    {
        file_put_contents(
            $this->racine . '/config.local.php',
            "<?php return ['ref' => '', 'chemin_hors_ligne' => null];"
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('ref');

        Config::load($this->racine);
    }
}
