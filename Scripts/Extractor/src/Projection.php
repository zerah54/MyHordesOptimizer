<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor;

use RuntimeException;

/**
 * ③ Une projection : de quelle chaîne extraite vient un fichier de `Data/**`, et quelle
 * transformation lui appliquer.
 *
 * C'est le seul endroit où vit du code propre à MyHordesOptimizer.
 */
final class Projection
{
    /** @var (callable(array<mixed>, array<string, array<mixed>>): array<mixed>)|null */
    private $transformation;

    /**
     * @param bool $detecterLaForme faux pour un fichier sans schéma d'entrée fixe — les clés de
     *     premier niveau y sont des données, pas des noms de champs (voir `Items/find.json`
     *     dans `Projections::toutes()`) ; y détecter une dérive de forme produirait une fausse
     *     alerte à chaque ajout de donnée
     */
    public function __construct(
        private readonly string $fichierCible,
        private readonly string $chaine,
        private readonly ?string $sousCle = null,
        ?callable $transformation = null,
        private readonly bool $detecterLaForme = true
    ) {
        $this->transformation = $transformation;
    }

    public function fichierCible(): string
    {
        return $this->fichierCible;
    }

    public function chaine(): string
    {
        return $this->chaine;
    }

    public function detecterLaForme(): bool
    {
        return $this->detecterLaForme;
    }

    /**
     * @param array<string, array<mixed>> $brut
     * @return array<mixed>
     */
    public function appliquer(array $brut): array
    {
        if (!array_key_exists($this->chaine, $brut)) {
            throw new RuntimeException(
                "Chaîne « {$this->chaine} » absente de l'extraction (cible {$this->fichierCible})."
            );
        }

        $donnees = $brut[$this->chaine];

        if ($this->sousCle !== null) {
            if (!array_key_exists($this->sousCle, $donnees)) {
                throw new RuntimeException(
                    "Sous-clé « {$this->sousCle} » absente de la chaîne « {$this->chaine} »."
                );
            }

            $donnees = $donnees[$this->sousCle];
        }

        if ($this->transformation !== null) {
            $donnees = ($this->transformation)($donnees, $brut);
        }

        return $donnees;
    }
}
