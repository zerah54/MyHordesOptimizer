<?php

declare(strict_types=1);

/**
 * Extracteur de référentiels MyHordes.
 *
 * Usage : php extract.php [--ref=<référence>] [--offline] [--check] [--force] [--raw-only]
 *
 *   --ref=<référence>  Branche ou SHA MyHordes à extraire (défaut : config.local.php).
 *   --offline          Utilise le clone local configuré au lieu de télécharger.
 *   --check            N'écrit rien dans Data/**, affiche seulement le rapport de dérive.
 *   --force            Passe outre les garde-fous.
 *   --raw-only         S'arrête après l'écriture de raw/.
 */

use MyHordesOptimizer\Extractor\Config;
use MyHordesOptimizer\Extractor\DriftReport;
use MyHordesOptimizer\Extractor\FixtureHarness;
use MyHordesOptimizer\Extractor\Projections;
use MyHordesOptimizer\Extractor\SourceFetcher;

require __DIR__ . '/vendor/autoload.php';

const SEUIL_PERTE = 0.20;
const RACINE_DATA = __DIR__ . '/../../MyHordesOptimizerApi/MyHordesOptimizerApi/Data';

$options = getopt('', ['ref::', 'offline', 'check', 'force', 'raw-only']);
$check = array_key_exists('check', $options);
$force = array_key_exists('force', $options);
$rawOnly = array_key_exists('raw-only', $options);
$horsLigne = array_key_exists('offline', $options);

try {
    $config = Config::load(__DIR__);

    if (isset($options['ref']) && is_string($options['ref']) && $options['ref'] !== '') {
        $config = Config::avecRef($config, $options['ref']);
    }

    $fetcher = new SourceFetcher($config);

    if ($horsLigne) {
        echo '→ Source locale (--offline)…', PHP_EOL;
        $source = $fetcher->recupererHorsLigne();
        $meta = $fetcher->metadonnees();
        echo "  {$source}", PHP_EOL;
    } else {
        echo "→ Acquisition de la source MyHordes (référence : {$config->ref()})…", PHP_EOL;
        $source = $fetcher->recuperer();
        $meta = $fetcher->metadonnees();
        echo "  commit {$meta['sha_court']} du {$meta['date_commit']}", PHP_EOL;
    }

    echo '→ Rejeu des chaînes de fixtures…', PHP_EOL;
    $harnais = new FixtureHarness($source);
    $brut = $harnais->extraire();
    $harnais->ecrireBrut(__DIR__ . '/raw', $brut, $meta);
    echo '  ', count($brut), ' chaînes écrites dans raw/', PHP_EOL;

    if ($rawOnly) {
        echo 'Terminé (--raw-only).', PHP_EOL;
        exit(0);
    }

    echo '→ Projection vers Data/**', PHP_EOL;

    $nbBloques = 0;
    $nbForces = 0;
    $aEcrire = [];

    foreach (Projections::toutes() as $projection) {
        $cible = RACINE_DATA . '/' . $projection->fichierCible();
        $nouveau = $projection->appliquer($brut);

        $ancien = is_file($cible)
            ? json_decode(file_get_contents($cible), true, 512, JSON_THROW_ON_ERROR)
            : null;

        $rapport = DriftReport::comparer($ancien, $nouveau, $projection->detecterLaForme());

        echo '  ', $projection->fichierCible(), PHP_EOL, $rapport->resume(), PHP_EOL;

        // Un fichier déjà vide qui le reste n'est pas une perte : la garde ne vise que la
        // disparition d'un contenu existant.
        $motif = null;

        if ($ancien !== null && $ancien !== [] && $nouveau === []) {
            $motif = 'le fichier deviendrait vide';
        } elseif ($rapport->proportionPerdue() > SEUIL_PERTE) {
            $motif = sprintf(
                '%.0f %% des clés disparaîtraient (seuil %.0f %%)',
                $rapport->proportionPerdue() * 100,
                SEUIL_PERTE * 100
            );
        }

        if ($motif === null) {
            $aEcrire[$cible] = $nouveau;

            continue;
        }

        $nbBloques++;

        // --force écrit malgré la garde, mais jamais en silence : le fichier forcé doit être
        // nommé dans la sortie, sans quoi « passer outre » revient à effacer la trace.
        if ($force) {
            echo "    BLOQUÉ ($motif) — écrit quand même (--force).", PHP_EOL;
            $aEcrire[$cible] = $nouveau;
            $nbForces++;
        } else {
            echo "    BLOQUÉ : $motif.", PHP_EOL;
        }
    }

    if ($check) {
        echo PHP_EOL, 'Mode --check : aucun fichier écrit.', PHP_EOL;
        exit($nbBloques > 0 ? 1 : 0);
    }

    // Sans --force, une seule garde déclenchée annule la totalité de l'écriture : mieux vaut
    // un référentiel cohérent et périmé qu'un référentiel partiellement régénéré.
    if ($nbBloques > 0 && !$force) {
        printf(
            '%sÉcriture annulée : %d fichier(s) bloqué(s) par une garde. Relancer avec --force pour passer outre.%s',
            PHP_EOL,
            $nbBloques,
            PHP_EOL
        );
        exit(1);
    }

    foreach ($aEcrire as $cible => $donnees) {
        $json = json_encode(
            $donnees,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
        );

        if (@file_put_contents($cible, $json) === false) {
            throw new RuntimeException("Impossible d'écrire le fichier $cible");
        }
    }

    printf(
        '%s%d fichiers écrits%s.%s',
        PHP_EOL,
        count($aEcrire),
        $nbForces > 0 ? sprintf(', dont %d forcé(s) malgré une garde', $nbForces) : '',
        PHP_EOL
    );
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, 'ERREUR : ' . $e->getMessage() . PHP_EOL);
    exit(2);
}
