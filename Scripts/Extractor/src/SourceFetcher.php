<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor;

use RuntimeException;
use ZipArchive;

/**
 * ① Acquisition du code source MyHordes.
 *
 * Télécharge quatre archives limitées par chemin depuis GitLab (~1,4 Mo au total) et les extrait
 * dans `.source/<sha>/`. Si le SHA est déjà présent, aucun téléchargement n'a lieu.
 */
final class SourceFetcher
{
    private const PROJET = 'eternaltwin%2Fmyhordes%2Fmyhordes';

    private const CHEMINS = [
        'src',
        'packages/myhordes-fixtures',
        'packages/myhordes-plugins',
        'config/app',
    ];

    /** @var array<string, mixed> */
    private array $metadonnees = [];

    /** @var callable(string): string */
    private $transport;

    public function __construct(
        private readonly Config $config,
        ?callable $transport = null
    ) {
        $this->transport = $transport ?? self::transportParDefaut(...);
    }

    /** Retourne le chemin absolu du répertoire source prêt à l'emploi. */
    public function recuperer(): string
    {
        $commit = $this->resoudreCommit();
        $sha = $commit['id'];
        $destination = $this->config->racine() . '/.source/' . $sha;

        $this->metadonnees = [
            'sha' => $sha,
            'sha_court' => $commit['short_id'],
            'date_commit' => $commit['created_at'],
            'ref' => $this->config->ref(),
            'date_extraction' => date('c'),
        ];

        if (is_dir($destination)) {
            return $destination;
        }

        $temporaire = $destination . '.partiel';
        self::supprimer($temporaire);
        self::creerRepertoire($temporaire);

        foreach (self::CHEMINS as $chemin) {
            $this->extraireArchive($sha, $chemin, $temporaire);
        }

        file_put_contents(
            $temporaire . '/_source.json',
            json_encode($this->metadonnees, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)
        );

        if (!rename($temporaire, $destination)) {
            throw new RuntimeException("Impossible de déplacer $temporaire vers $destination.");
        }

        return $destination;
    }

    /**
     * Mode de secours : utilise un clone local au lieu de télécharger.
     *
     * Sert quand GitLab est indisponible, ou pour travailler sur une branche non poussée. La
     * disposition d'un clone est identique à celle de `.source/<sha>` : `src/`, `packages/`,
     * `config/` à la racine.
     */
    public function recupererHorsLigne(): string
    {
        $chemin = $this->config->cheminHorsLigne();

        if ($chemin === null) {
            throw new RuntimeException(
                'Aucun clone local configuré : renseignez « chemin_hors_ligne » dans config.local.php.'
            );
        }

        if (!is_dir($chemin . '/packages/myhordes-fixtures')) {
            throw new RuntimeException("Le chemin hors ligne « $chemin » n'est pas un clone MyHordes.");
        }

        $this->metadonnees = [
            'sha' => 'hors-ligne',
            'sha_court' => 'hors-ligne',
            'date_commit' => null,
            'ref' => $chemin,
            'date_extraction' => date('c'),
        ];

        return $chemin;
    }

    /** @return array<string, mixed> */
    public function metadonnees(): array
    {
        return $this->metadonnees;
    }

    /** @return array{id: string, short_id: string, created_at: string} */
    private function resoudreCommit(): array
    {
        $url = sprintf(
            'https://gitlab.com/api/v4/projects/%s/repository/commits/%s',
            self::PROJET,
            rawurlencode($this->config->ref())
        );

        $reponse = ($this->transport)($url);
        $commit = json_decode($reponse, true, 512, JSON_THROW_ON_ERROR);

        if (!is_array($commit) || !isset($commit['id'], $commit['short_id'], $commit['created_at'])) {
            throw new RuntimeException("Réponse inattendue de GitLab pour la référence « {$this->config->ref()} ».");
        }

        return $commit;
    }

    /**
     * Télécharge une archive limitée à un chemin et l'extrait en retirant le préfixe de dossier
     * que GitLab ajoute (`<projet>-<ref>-<sha>/`).
     *
     * Le fichier temporaire et le handle ZipArchive sont toujours libérés (`finally`), y compris
     * si le transport échoue ou si l'extraction est interrompue par une exception.
     */
    private function extraireArchive(string $sha, string $chemin, string $destination): void
    {
        $url = sprintf(
            'https://gitlab.com/eternaltwin/myhordes/myhordes/-/archive/%s/mh.zip?path=%s',
            rawurlencode($sha),
            rawurlencode($chemin)
        );

        $fichier = tempnam(sys_get_temp_dir(), 'mho_src');
        $zip = new ZipArchive();
        $ouvert = false;

        try {
            file_put_contents($fichier, ($this->transport)($url));

            $ouvert = $zip->open($fichier) === true;
            if (!$ouvert) {
                throw new RuntimeException("Archive illisible pour le chemin « $chemin ».");
            }

            for ($i = 0; $i < $zip->numFiles; $i++) {
                $nom = $zip->getNameIndex($i);
                if ($nom === false) {
                    continue;
                }

                // Un nom d'entrée ZIP brut peut légitimement contenir des antislashs sous
                // Windows ; on normalise avant toute logique de segment pour que la protection
                // contre la traversée de chemin couvre les deux séparateurs de la même façon.
                $nomNormalise = str_replace('\\', '/', $nom);

                $relatif = self::retirerPremierSegment($nomNormalise);
                if ($relatif === '') {
                    continue;
                }

                self::verifierCheminSecurise($nom, $relatif);

                $cible = $destination . '/' . $relatif;

                if (str_ends_with($nomNormalise, '/')) {
                    self::creerRepertoire($cible);

                    continue;
                }

                self::creerRepertoire(dirname($cible));
                file_put_contents($cible, $zip->getFromIndex($i));
            }
        } finally {
            if ($ouvert) {
                $zip->close();
            }

            if (file_exists($fichier)) {
                unlink($fichier);
            }
        }
    }

    private static function retirerPremierSegment(string $chemin): string
    {
        $position = strpos($chemin, '/');

        return $position === false ? '' : substr($chemin, $position + 1);
    }

    /**
     * Rejette toute entrée d'archive dont le chemin relatif (séparateurs déjà normalisés en `/`)
     * sortirait du répertoire de destination (« zip slip »), par exemple `mh-x/../../evil.txt`,
     * ou serait absolu — chemin commençant par `/` ou préfixé d'une lettre de lecteur Windows
     * (`C:`). Une archive MyHordes légitime ne contient jamais un tel chemin : sa présence est
     * traitée comme une anomalie plutôt qu'ignorée silencieusement.
     */
    private static function verifierCheminSecurise(string $nomOriginal, string $relatif): void
    {
        $suspect = str_starts_with($relatif, '/') || preg_match('#^[A-Za-z]:#', $relatif) === 1;

        foreach (explode('/', $relatif) as $segment) {
            if ($segment === '..') {
                $suspect = true;

                break;
            }
        }

        if ($suspect) {
            throw new RuntimeException(
                "Entrée d'archive suspecte, en dehors du répertoire de destination : « $nomOriginal »."
            );
        }
    }

    private static function creerRepertoire(string $chemin): void
    {
        if (!is_dir($chemin) && !mkdir($chemin, 0777, true) && !is_dir($chemin)) {
            throw new RuntimeException("Impossible de créer le répertoire $chemin");
        }
    }

    private static function supprimer(string $chemin): void
    {
        if (!file_exists($chemin)) {
            return;
        }

        if (is_file($chemin)) {
            unlink($chemin);

            return;
        }

        foreach (array_diff(scandir($chemin) ?: [], ['.', '..']) as $entree) {
            self::supprimer($chemin . '/' . $entree);
        }

        rmdir($chemin);
    }

    private static function transportParDefaut(string $url): string
    {
        $contexte = stream_context_create([
            'http' => [
                'timeout' => 120,
                'header' => "User-Agent: MyHordesOptimizer-Extractor\r\n",
            ],
        ]);

        $corps = @file_get_contents($url, false, $contexte);

        if ($corps === false) {
            throw new RuntimeException("Échec du téléchargement : $url");
        }

        return $corps;
    }
}
