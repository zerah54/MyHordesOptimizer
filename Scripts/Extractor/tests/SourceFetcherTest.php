<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\Config;
use MyHordesOptimizer\Extractor\SourceFetcher;
use PHPUnit\Framework\TestCase;
use ZipArchive;

final class SourceFetcherTest extends TestCase
{
    private string $racine;

    protected function setUp(): void
    {
        $this->racine = sys_get_temp_dir() . '/extracteur_fetch_' . uniqid('', true);
        mkdir($this->racine);
        file_put_contents(
            $this->racine . '/config.local.php.dist',
            "<?php return ['ref' => 'master', 'chemin_hors_ligne' => null];"
        );
    }

    protected function tearDown(): void
    {
        self::supprimer($this->racine);
    }

    public function testTelechargeEtExtraitLesQuatreArchives(): void
    {
        $urlsDemandees = [];
        $transport = function (string $url) use (&$urlsDemandees): string {
            $urlsDemandees[] = $url;

            if (str_contains($url, '/repository/commits/')) {
                return json_encode([
                    'id' => 'abc123def456',
                    'short_id' => 'abc123d',
                    'created_at' => '2026-07-20T19:19:05.000+02:00',
                ], JSON_THROW_ON_ERROR);
            }

            return self::archiveFactice('mh-abc123/marqueur.txt', 'contenu');
        };

        $fetcher = new SourceFetcher(Config::load($this->racine), $transport);
        $chemin = $fetcher->recuperer();

        self::assertSame($this->racine . '/.source/abc123def456', $chemin);
        self::assertFileExists($chemin . '/_source.json');

        // 1 appel d'API + 4 archives
        self::assertCount(5, $urlsDemandees);
        foreach (['path=src', 'path=packages/myhordes-fixtures', 'path=packages/myhordes-plugins', 'path=config/app'] as $attendu) {
            self::assertTrue(
                (bool) array_filter($urlsDemandees, static fn (string $u): bool => str_contains(urldecode($u), $attendu)),
                "Archive manquante : $attendu"
            );
        }
    }

    public function testNeRetelechargePasQuandLeShaEstDejaEnCache(): void
    {
        $appels = 0;
        $transport = function (string $url) use (&$appels): string {
            $appels++;

            if (str_contains($url, '/repository/commits/')) {
                return json_encode([
                    'id' => 'abc123def456',
                    'short_id' => 'abc123d',
                    'created_at' => '2026-07-20T19:19:05.000+02:00',
                ], JSON_THROW_ON_ERROR);
            }

            return self::archiveFactice('mh-abc123/marqueur.txt', 'contenu');
        };

        $config = Config::load($this->racine);

        (new SourceFetcher($config, $transport))->recuperer();
        $apresPremier = $appels;

        (new SourceFetcher($config, $transport))->recuperer();

        // Le second passage ne fait que l'appel d'API, aucune archive.
        self::assertSame($apresPremier + 1, $appels);
    }

    public function testLesMetadonneesPortentLeShaEtLaDateDuCommit(): void
    {
        $transport = static function (string $url): string {
            if (str_contains($url, '/repository/commits/')) {
                return json_encode([
                    'id' => 'abc123def456',
                    'short_id' => 'abc123d',
                    'created_at' => '2026-07-20T19:19:05.000+02:00',
                ], JSON_THROW_ON_ERROR);
            }

            return self::archiveFactice('mh-abc123/marqueur.txt', 'contenu');
        };

        $fetcher = new SourceFetcher(Config::load($this->racine), $transport);
        $fetcher->recuperer();
        $meta = $fetcher->metadonnees();

        self::assertSame('abc123def456', $meta['sha']);
        self::assertSame('2026-07-20T19:19:05.000+02:00', $meta['date_commit']);
        self::assertSame('master', $meta['ref']);
    }

    public function testUneEntreeDArchiveQuiSortDeLaDestinationEstRefusee(): void
    {
        $transport = static function (string $url): string {
            if (str_contains($url, '/repository/commits/')) {
                return json_encode([
                    'id' => 'abc123def456',
                    'short_id' => 'abc123d',
                    'created_at' => '2026-07-20T19:19:05.000+02:00',
                ], JSON_THROW_ON_ERROR);
            }

            // Une fois le premier segment retiré, ce chemin remonte hors du répertoire de
            // destination : c'est une entrée d'archive corrompue ou malveillante (« zip slip »).
            return self::archiveFactice('mh-abc123/../../evil.txt', 'contenu');
        };

        $fetcher = new SourceFetcher(Config::load($this->racine), $transport);

        try {
            $fetcher->recuperer();
            self::fail('Une exception aurait dû être levée pour un chemin hors destination.');
        } catch (\RuntimeException $exception) {
            self::assertStringContainsString('evil.txt', $exception->getMessage());
        }

        self::assertFileDoesNotExist($this->racine . '/evil.txt');
    }

    public function testUneEntreeDArchiveAvecTraverseeParAntislashEstRefusee(): void
    {
        $transport = static function (string $url): string {
            if (str_contains($url, '/repository/commits/')) {
                return json_encode([
                    'id' => 'abc123def456',
                    'short_id' => 'abc123d',
                    'created_at' => '2026-07-20T19:19:05.000+02:00',
                ], JSON_THROW_ON_ERROR);
            }

            // Un seul vrai slash pour satisfaire le retrait obligatoire du premier segment, puis
            // une traversée entièrement à l'antislash : un nom d'entrée ZIP brut parfaitement
            // valide sous Windows, que la vérification doit détecter au même titre qu'avec des
            // slashs.
            return self::archiveFactice('mh-abc123/..\..\evil.txt', 'contenu');
        };

        $fetcher = new SourceFetcher(Config::load($this->racine), $transport);

        try {
            $fetcher->recuperer();
            self::fail('Une exception aurait dû être levée pour un chemin hors destination (antislash).');
        } catch (\RuntimeException $exception) {
            self::assertStringContainsString('evil.txt', $exception->getMessage());
        }

        self::assertFileDoesNotExist($this->racine . '/evil.txt');
    }

    public function testUnEchecDeTransportPendantUneArchiveNeLaissePasDeFichierTemporaire(): void
    {
        // Note : tempnam() tronque le préfixe à 3 caractères sous Windows (« mho1A2B.tmp »),
        // d'où la comparaison sur ce préfixe court plutôt que sur 'mho_src' en entier.
        $avant = self::fichiersTemporairesMho();

        $appelsArchive = 0;
        $transport = function (string $url) use (&$appelsArchive): string {
            if (str_contains($url, '/repository/commits/')) {
                return json_encode([
                    'id' => 'abc123def456',
                    'short_id' => 'abc123d',
                    'created_at' => '2026-07-20T19:19:05.000+02:00',
                ], JSON_THROW_ON_ERROR);
            }

            $appelsArchive++;
            if ($appelsArchive === 2) {
                throw new \RuntimeException('Panne réseau simulée');
            }

            return self::archiveFactice('mh-abc123/marqueur.txt', 'contenu');
        };

        $fetcher = new SourceFetcher(Config::load($this->racine), $transport);

        try {
            $fetcher->recuperer();
            self::fail('Une exception aurait dû être levée par le transport.');
        } catch (\RuntimeException $exception) {
            self::assertSame('Panne réseau simulée', $exception->getMessage());
        }

        $nouveaux = array_diff(self::fichiersTemporairesMho(), $avant);
        self::assertSame([], $nouveaux, 'Fichier(s) temporaire(s) non nettoyé(s) : ' . implode(', ', $nouveaux));
    }

    public function testLeModeHorsLigneRefuseUnCheminNonConfigure(): void
    {
        $fetcher = new SourceFetcher(Config::load($this->racine), static fn (): string => '');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('chemin_hors_ligne');

        $fetcher->recupererHorsLigne();
    }

    public function testLeModeHorsLigneRefuseUnCheminQuiNEstPasUnClone(): void
    {
        file_put_contents(
            $this->racine . '/config.local.php',
            "<?php return ['ref' => 'master', 'chemin_hors_ligne' => " . var_export($this->racine, true) . '];'
        );

        $fetcher = new SourceFetcher(Config::load($this->racine), static fn (): string => '');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('clone MyHordes');

        $fetcher->recupererHorsLigne();
    }

    public function testLeModeHorsLigneRendLeCheminConfigure(): void
    {
        $clone = $this->racine . '/clone';
        mkdir($clone . '/packages/myhordes-fixtures', 0777, true);

        file_put_contents(
            $this->racine . '/config.local.php',
            "<?php return ['ref' => 'master', 'chemin_hors_ligne' => " . var_export($clone, true) . '];'
        );

        $fetcher = new SourceFetcher(Config::load($this->racine), static fn (): string => '');

        self::assertSame($clone, $fetcher->recupererHorsLigne());
        self::assertSame('hors-ligne', $fetcher->metadonnees()['sha']);
    }

    /**
     * Liste les fichiers du répertoire temporaire système dont le nom commence par « mho »
     * (préfixe utilisé par `SourceFetcher::extraireArchive()`, tronqué à 3 caractères par
     * `tempnam()` sous Windows).
     *
     * @return list<string>
     */
    private static function fichiersTemporairesMho(): array
    {
        $dossier = sys_get_temp_dir();

        return array_values(array_filter(
            scandir($dossier) ?: [],
            static fn (string $entree): bool => str_starts_with($entree, 'mho') && is_file($dossier . '/' . $entree)
        ));
    }

    private static function archiveFactice(string $chemin, string $contenu): string
    {
        $fichier = tempnam(sys_get_temp_dir(), 'zip');
        $zip = new ZipArchive();
        $zip->open($fichier, ZipArchive::OVERWRITE);
        $zip->addFromString($chemin, $contenu);
        $zip->close();

        $donnees = file_get_contents($fichier);
        unlink($fichier);

        return $donnees;
    }

    private static function supprimer(string $chemin): void
    {
        if (is_file($chemin)) {
            unlink($chemin);

            return;
        }

        foreach (array_diff(scandir($chemin) ?: [], ['.', '..']) as $entree) {
            self::supprimer($chemin . '/' . $entree);
        }

        rmdir($chemin);
    }
}
