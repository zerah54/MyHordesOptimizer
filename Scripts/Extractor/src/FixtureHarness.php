<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor;

use RuntimeException;
use Symfony\Component\Yaml\Yaml;
use Throwable;

/**
 * ② Rejeu de la chaîne de fixtures de MyHordes, sans noyau Symfony ni base de données.
 *
 * Les chaînes ne sont pas codées en dur : elles sont reconstruites depuis le `services.yaml` du
 * paquet de fixtures, si bien qu'un service ajouté en amont est repris sans modification ici.
 */
final class FixtureHarness
{
    private readonly string $racineFixtures;

    private bool $chargeurEnregistre = false;

    public function __construct(private readonly string $cheminSource)
    {
        $this->racineFixtures = $cheminSource . '/packages/myhordes-fixtures/src';

        if (!is_file($this->racineFixtures . '/Resources/config/services.yaml')) {
            throw new RuntimeException("services.yaml introuvable sous $cheminSource");
        }
    }

    /**
     * Étiquette → liste ordonnée de classes de service.
     *
     * @return array<string, list<string>>
     */
    public function chaines(): array
    {
        $services = Yaml::parseFile($this->racineFixtures . '/Resources/config/services.yaml')['services'] ?? [];

        $parEtiquette = [];

        foreach ($services as $classe => $definition) {
            if (!is_array($definition) || !isset($definition['tags'])) {
                continue;
            }

            foreach ($definition['tags'] as $etiquette) {
                $parEtiquette[$etiquette['name']][] = [$classe, $etiquette['priority'] ?? 0];
            }
        }

        $chaines = [];

        foreach ($parEtiquette as $etiquette => $services_) {
            usort($services_, static fn (array $a, array $b): int => $a[1] <=> $b[1]);
            $chaines[$etiquette] = array_column($services_, 0);
        }

        return $chaines;
    }

    /**
     * Étiquette → données extraites.
     *
     * @return array<string, array<mixed>>
     */
    public function extraire(): array
    {
        $this->enregistrerChargeur();

        $resultat = [];

        foreach ($this->chaines() as $etiquette => $classes) {
            $chaine = new class extends \MyHordes\Plugins\Interfaces\FixtureChainInterface {};

            foreach ($classes as $classe) {
                $chaine->addProcessor($this->instancier($classe), $classe, $etiquette);
            }

            try {
                $donnees = $chaine->data();
            } catch (Throwable $e) {
                throw new RuntimeException(
                    "Échec de la chaîne « $etiquette » : " . $e::class . ' — ' . $e->getMessage(),
                    0,
                    $e
                );
            }

            self::deballer($donnees);
            $resultat[$etiquette] = $donnees;
        }

        return $resultat;
    }

    /**
     * @param array<string, array<mixed>> $donnees sortie de `extraire()`, passée en argument pour
     *                                             ne pas rejouer les chaînes une seconde fois
     * @param array<string, mixed> $metadonnees
     */
    public function ecrireBrut(string $repertoire, array $donnees, array $metadonnees): void
    {
        if (!is_dir($repertoire) && !mkdir($repertoire, 0777, true) && !is_dir($repertoire)) {
            throw new RuntimeException("Impossible de créer le répertoire $repertoire");
        }

        foreach ($donnees as $etiquette => $contenu) {
            $chemin = $repertoire . '/' . $etiquette . '.json';

            if (@file_put_contents(
                $chemin,
                json_encode(
                    $contenu,
                    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
                )
            ) === false) {
                throw new RuntimeException("Impossible d'écrire le fichier $chemin");
            }
        }

        $cheminMetadonnees = $repertoire . '/_source.json';

        if (@file_put_contents(
            $cheminMetadonnees,
            json_encode(
                $metadonnees,
                JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
            )
        ) === false) {
            throw new RuntimeException("Impossible d'écrire le fichier $cheminMetadonnees");
        }
    }

    private function instancier(string $classe): object
    {
        // Seul service de la chaîne à prendre un argument de constructeur.
        if ($classe === \MyHordes\Fixtures\Service\YamlDataService::class) {
            return new $classe(['MyHordesFixturesBundle' => ['path' => $this->racineFixtures]]);
        }

        return new $classe();
    }

    /**
     * `ActionDataService` déballe ses propres décorateurs, mais pas les autres services : sans ce
     * passage, les conteneurs d'objets, de chantiers ou de récompenses seraient encodés en `{}`.
     *
     * Certaines fixtures (ex. les tables de butin de `myhordes.fixtures.items.groups`) embarquent
     * aussi des enums PHP typées (`App\Enum\DropMod`, `App\Enum\Game\BuildingResourceSetType`) à
     * même les données. `json_encode` sérialise déjà une enum *à valeur* vers sa valeur brute ; on
     * ne fait ici qu'aligner la sortie en mémoire sur ce que produirait l'encodage JSON, sans
     * changer l'information transportée. Une enum *pure* (sans valeur) ferait volontairement
     * échouer ce déballage plutôt que d'être réduite à son nom : le choix de la représenter revient
     * à la tâche 4 (inversion des constantes PHP), pas à ce harnais.
     *
     * @param array<mixed> $donnees
     */
    private static function deballer(array &$donnees): void
    {
        array_walk_recursive($donnees, static function (&$valeur): void {
            if ($valeur instanceof \MyHordes\Fixtures\DTO\ArrayDecoratorReadInterface) {
                $valeur = $valeur->toArray();

                return;
            }

            if ($valeur instanceof \BackedEnum) {
                $valeur = $valeur->value;
            }
        });
    }

    private function enregistrerChargeur(): void
    {
        if ($this->chargeurEnregistre) {
            return;
        }

        $racines = [
            'App\\' => [$this->cheminSource . '/src/'],
            // Les DEUX racines, conformément au composer.json du paquet de fixtures.
            'MyHordes\\Fixtures\\' => [$this->racineFixtures . '/', $this->racineFixtures . '/templates/'],
            'MyHordes\\Plugins\\' => [$this->cheminSource . '/packages/myhordes-plugins/src/'],
        ];

        spl_autoload_register(static function (string $classe) use ($racines): void {
            foreach ($racines as $prefixe => $repertoires) {
                if (!str_starts_with($classe, $prefixe)) {
                    continue;
                }

                $relatif = str_replace('\\', '/', substr($classe, strlen($prefixe))) . '.php';

                foreach ($repertoires as $repertoire) {
                    if (is_file($repertoire . $relatif)) {
                        require $repertoire . $relatif;

                        return;
                    }
                }
            }
        });

        $this->chargeurEnregistre = true;
    }
}
