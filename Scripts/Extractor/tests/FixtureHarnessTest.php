<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor\Tests;

use MyHordesOptimizer\Extractor\Config;
use MyHordesOptimizer\Extractor\FixtureHarness;
use MyHordesOptimizer\Extractor\SourceFetcher;
use PHPUnit\Framework\TestCase;

/**
 * Ces tests s'appuient sur une source réellement téléchargée : le harnais n'a de sens que
 * confronté au vrai code de MyHordes. Ils sont ignorés si la source n'est pas disponible.
 */
final class FixtureHarnessTest extends TestCase
{
    private static ?string $source = null;

    private ?string $repertoireTemporaire = null;

    public static function setUpBeforeClass(): void
    {
        $racine = dirname(__DIR__);

        try {
            $fetcher = new SourceFetcher(Config::load($racine));
            self::$source = $fetcher->recuperer();
        } catch (\Throwable) {
            self::$source = null;
        }
    }

    protected function setUp(): void
    {
        if (self::$source === null) {
            self::markTestSkipped('Source MyHordes indisponible (réseau ou configuration).');
        }
    }

    protected function tearDown(): void
    {
        if ($this->repertoireTemporaire !== null) {
            self::supprimerRecursivement($this->repertoireTemporaire);
            $this->repertoireTemporaire = null;
        }
    }

    public function testLesChainesSontLuesDepuisServicesYaml(): void
    {
        $chaines = (new FixtureHarness(self::$source))->chaines();

        self::assertArrayHasKey('myhordes.fixtures.actions', $chaines);
        self::assertArrayHasKey('myhordes.fixtures.items.list', $chaines);
        self::assertGreaterThanOrEqual(30, count($chaines));
    }

    public function testYamlDataServicePasseApresLeServiceDeBase(): void
    {
        $chaines = (new FixtureHarness(self::$source))->chaines();
        $actions = $chaines['myhordes.fixtures.actions'];

        self::assertStringContainsString('ActionDataService', $actions[0]);
        self::assertStringContainsString('YamlDataService', $actions[1]);
    }

    public function testToutesLesChainesSExtraientSansErreur(): void
    {
        $donnees = (new FixtureHarness(self::$source))->extraire();

        self::assertGreaterThanOrEqual(30, count($donnees));

        foreach ($donnees as $etiquette => $contenu) {
            self::assertIsArray($contenu, "La chaîne $etiquette n'a pas produit un tableau.");
            self::assertNotFalse(
                json_encode($contenu, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                "La chaîne $etiquette n'est pas encodable en JSON."
            );
        }
    }

    public function testLesExigencesDActionSontConstruitesEtNonVides(): void
    {
        $donnees = (new FixtureHarness(self::$source))->extraire();
        $actions = $donnees['myhordes.fixtures.actions'];

        // Le défaut central du parser manuel : ces clés étaient vides.
        self::assertGreaterThan(200, count($actions['meta_requirements']));
        self::assertGreaterThan(300, count($actions['meta_results']));
        self::assertGreaterThan(400, count($actions['actions']));
    }

    public function testAucunObjetNeSubsisteApresDeballage(): void
    {
        $donnees = (new FixtureHarness(self::$source))->extraire();

        $objets = 0;
        array_walk_recursive($donnees, static function ($valeur) use (&$objets): void {
            if (is_object($valeur)) {
                $objets++;
            }
        });

        self::assertSame(0, $objets, 'Des décorateurs non déballés subsistent.');
    }

    public function testLeWatchimpactDuBouclierEstPresent(): void
    {
        $donnees = (new FixtureHarness(self::$source))->extraire();
        $objets = $donnees['myhordes.fixtures.items.list'];

        // Donnée introuvable via l'API MyHordes : elle justifie à elle seule l'extracteur.
        self::assertSame(5, $objets['shield_#00']['watchimpact']);
    }

    public function testEcrireBrutEcritUnFichierJsonParChaineEtLesMetadonnees(): void
    {
        $this->repertoireTemporaire = sys_get_temp_dir() . '/fixture_harness_' . uniqid('', true);

        // Petit jeu de données fabriqué à la main : inutile de rejouer les 34 vraies chaînes pour
        // tester l'écriture, ce serait coupler un test de système de fichiers à un test réseau
        // sans aucun bénéfice.
        $donnees = [
            'myhordes.fixtures.exemple.un' => ['clé' => 'valeur', 'liste' => [1, 2, 3]],
            'myhordes.fixtures.exemple.deux' => ['autre' => true, 'accent' => 'éàü'],
        ];
        $metadonnees = ['sha' => 'abc123', 'ref' => 'master'];

        (new FixtureHarness(self::$source))->ecrireBrut($this->repertoireTemporaire, $donnees, $metadonnees);

        foreach ($donnees as $etiquette => $contenu) {
            $chemin = $this->repertoireTemporaire . '/' . $etiquette . '.json';

            self::assertFileExists($chemin);
            self::assertSame($contenu, json_decode(file_get_contents($chemin), true));
        }

        $cheminMetadonnees = $this->repertoireTemporaire . '/_source.json';

        self::assertFileExists($cheminMetadonnees);
        self::assertSame($metadonnees, json_decode(file_get_contents($cheminMetadonnees), true));
    }

    public function testEcrireBrutSignaleUnEchecDEcriture(): void
    {
        $this->repertoireTemporaire = sys_get_temp_dir() . '/fixture_harness_' . uniqid('', true);
        mkdir($this->repertoireTemporaire, 0777, true);

        // On place un répertoire là où `ecrireBrut()` doit écrire un fichier : `file_put_contents`
        // échoue alors et retourne `false` (vérifié portable sous Windows), sans lever d'exception
        // par lui-même — exactement le cas que la vérification du code doit intercepter.
        mkdir($this->repertoireTemporaire . '/myhordes.fixtures.conflit.json', 0777, true);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/myhordes\.fixtures\.conflit\.json/');

        (new FixtureHarness(self::$source))->ecrireBrut(
            $this->repertoireTemporaire,
            ['myhordes.fixtures.conflit' => ['x' => 1]],
            []
        );
    }

    private static function supprimerRecursivement(string $chemin): void
    {
        if (!file_exists($chemin)) {
            return;
        }

        if (is_file($chemin)) {
            unlink($chemin);

            return;
        }

        foreach (array_diff(scandir($chemin) ?: [], ['.', '..']) as $entree) {
            self::supprimerRecursivement($chemin . '/' . $entree);
        }

        rmdir($chemin);
    }
}
