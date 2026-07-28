<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor;

/**
 * ④ Comparaison entre le fichier déjà présent et celui qui va être écrit.
 *
 * Sépare deux natures de dérive aujourd'hui confondues :
 * - la dérive de DONNÉES : des clés apparaissent, disparaissent ou changent de valeur ;
 * - la dérive de FORME : un champ apparaît ou disparaît dans les objets, ce qui signale un modèle
 *   C# à mettre à jour sous peine de propriétés silencieusement nulles.
 */
final class DriftReport
{
    /**
     * @param list<string> $clesAjoutees
     * @param list<string> $clesRetirees
     * @param list<string> $clesModifiees
     * @param list<string> $champsApparus
     * @param list<string> $champsDisparus
     */
    private function __construct(
        private readonly array $clesAjoutees,
        private readonly array $clesRetirees,
        private readonly array $clesModifiees,
        private readonly array $champsApparus,
        private readonly array $champsDisparus,
        private readonly float $proportionPerdue,
        private readonly bool $comparaisonListe,
        private readonly int $tailleAncienne,
        private readonly int $tailleNouvelle
    ) {
    }

    /**
     * @param array<mixed>|null $ancien null au premier passage
     * @param array<mixed> $nouveau
     * @param bool $detecterLaForme faux pour un fichier sans schéma d'entrée fixe (ex.
     *     `Items/find.json`, où les clés de premier niveau sont des données et non des champs) :
     *     y détecter une dérive de forme produirait une fausse alerte à chaque ajout de donnée
     */
    public static function comparer(?array $ancien, array $nouveau, bool $detecterLaForme = true): self
    {
        $ancien ??= [];

        $clesAnciennes = array_keys($ancien);
        $clesNouvelles = array_keys($nouveau);

        // `array_diff` conserve le type d'origine des clés : sur une liste (clés entières), il
        // renverrait des int là où l'interface promet des chaînes.
        $ajoutees = array_values(array_map('strval', array_diff($clesNouvelles, $clesAnciennes)));
        $retirees = array_values(array_map('strval', array_diff($clesAnciennes, $clesNouvelles)));

        // Dans une liste JSON, l'identité d'une entrée vient d'un champ interne, pas de son
        // index : comparer valeur par valeur à index égal ferait passer un simple ajout ou
        // réordonnancement pour une avalanche de « modifications » sans rapport avec la réalité.
        $comparaisonListe = array_is_list($ancien) && array_is_list($nouveau);

        $modifiees = [];
        if (!$comparaisonListe) {
            foreach (array_intersect($clesAnciennes, $clesNouvelles) as $cle) {
                if (json_encode($ancien[$cle]) !== json_encode($nouveau[$cle])) {
                    $modifiees[] = (string) $cle;
                }
            }
        }

        $champsAnciens = $detecterLaForme ? self::champs($ancien) : [];
        $champsNouveaux = $detecterLaForme ? self::champs($nouveau) : [];

        $proportion = $clesAnciennes === []
            ? 0.0
            : count($retirees) / count($clesAnciennes);

        return new self(
            $ajoutees,
            $retirees,
            $modifiees,
            array_values(array_diff($champsNouveaux, $champsAnciens)),
            array_values(array_diff($champsAnciens, $champsNouveaux)),
            $proportion,
            $comparaisonListe,
            count($ancien),
            count($nouveau)
        );
    }

    /** @return list<string> */
    public function clesAjoutees(): array
    {
        return $this->clesAjoutees;
    }

    /** @return list<string> */
    public function clesRetirees(): array
    {
        return $this->clesRetirees;
    }

    /** @return list<string> */
    public function clesModifiees(): array
    {
        return $this->clesModifiees;
    }

    /** @return list<string> */
    public function champsApparus(): array
    {
        return $this->champsApparus;
    }

    /** @return list<string> */
    public function champsDisparus(): array
    {
        return $this->champsDisparus;
    }

    public function proportionPerdue(): float
    {
        return $this->proportionPerdue;
    }

    public function resume(): string
    {
        $lignes = [$this->ligneDonnees()];

        if ($this->champsApparus !== [] || $this->champsDisparus !== []) {
            $lignes[] = sprintf(
                '    FORME   : champs apparus [%s]  disparus [%s]  → vérifier le modèle C#',
                implode(', ', $this->champsApparus),
                implode(', ', $this->champsDisparus)
            );
        }

        return implode(PHP_EOL, $lignes);
    }

    /**
     * Pour une liste, annoncer un nombre de « modifications » par index n'aurait pas de sens
     * (une insertion en milieu de liste décale tout ce qui suit) : on rapporte l'effectif avant
     * et après à la place, la seule chose que la comparaison par position permette d'affirmer.
     */
    private function ligneDonnees(): string
    {
        if ($this->comparaisonListe) {
            return sprintf(
                '    données : +%d  -%d  liste : %d → %d entrée(s) (pas de comparaison par identité)',
                count($this->clesAjoutees),
                count($this->clesRetirees),
                $this->tailleAncienne,
                $this->tailleNouvelle
            );
        }

        return sprintf(
            '    données : +%d  -%d  ~%d',
            count($this->clesAjoutees),
            count($this->clesRetirees),
            count($this->clesModifiees)
        );
    }

    /**
     * Union des noms de champs présents dans les entrées de premier niveau.
     *
     * @param array<mixed> $donnees
     * @return list<string>
     */
    private static function champs(array $donnees): array
    {
        $champs = [];

        foreach ($donnees as $entree) {
            if (!is_array($entree)) {
                continue;
            }

            foreach (array_keys($entree) as $champ) {
                if (is_string($champ)) {
                    $champs[$champ] = true;
                }
            }
        }

        return array_keys($champs);
    }
}
