<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor;

use RuntimeException;
use Symfony\Component\Yaml\Yaml;

/**
 * Traductions des textes de chantiers (domaine `buildings` de MyHordes).
 *
 * Les fixtures rédigent les textes en allemand ; chaque fichier `translations/buildings+intl-icu.<langue>.yml`
 * associe ce texte allemand à sa traduction. Un texte sans traduction reste en allemand.
 */
final class BuildingTranslationsReader
{
    /** Langues traduites, en plus de l'allemand d'origine. */
    public const LANGUES = ['fr', 'en', 'es'];

    public function __construct(private readonly string $cheminSource)
    {
    }

    /**
     * Langue → texte allemand → traduction.
     *
     * @return array<string, array<string, string>>
     */
    public function lire(): array
    {
        $traductions = [];

        foreach (self::LANGUES as $langue) {
            $chemin = "{$this->cheminSource}/translations/buildings+intl-icu.$langue.yml";
            if (!is_file($chemin)) {
                throw new RuntimeException("Traductions des chantiers introuvables : $chemin");
            }

            $contenu = Yaml::parseFile($chemin);
            $traductions[$langue] = array_filter(
                is_array($contenu) ? $contenu : [],
                static fn(mixed $valeur, mixed $cle): bool => is_string($cle) && is_string($valeur),
                ARRAY_FILTER_USE_BOTH
            );
        }

        return $traductions;
    }

    /**
     * Un texte allemand dans toutes les langues du site.
     *
     * @param array<string, array<string, string>> $traductions sortie de `lire()`
     * @return array{de: string, fr: string, en: string, es: string}
     */
    public static function traduire(string $allemand, array $traductions): array
    {
        $texte = ['de' => $allemand];
        foreach (self::LANGUES as $langue) {
            $texte[$langue] = $traductions[$langue][$allemand] ?? $allemand;
        }

        return $texte;
    }
}
