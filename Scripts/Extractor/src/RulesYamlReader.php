<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor;

use RuntimeException;
use Symfony\Component\Yaml\Yaml;

/**
 * Lit `config/app/rules.yml` (fichier de config statique du dépôt MyHordes, PAS une chaîne de
 * fixtures Doctrine) et en extrait deux données absentes de toute API MyHordes : la disponibilité
 * des chantiers par mode de ville, et la table d'overrides de rareté du mode Pandémonium.
 *
 * Reproduit `App\Structures\Conf::deep_merge` (vérifié dans `.source/*\/src/Structures/Conf.php`) :
 * chaque mode importe son bloc PAR-DESSUS une copie de `default`, jamais en cascade entre modes.
 */
final class RulesYamlReader
{
    /** Clé YAML du mode → nom du TownType (cf. TownExtensions.MapTownType côté API). */
    private const MODES = [
        'small' => 'RNE',
        'remote' => 'RE',
        'panda' => 'PANDE',
        'custom' => 'CUSTOM',
    ];

    private const LISTES = [
        'initial_buildings' => 'initial',
        'unlocked_buildings' => 'unlocked',
        'disabled_buildings' => 'disabled',
    ];

    /**
     * @param list<string> $catalogueUids Tous les uids de chantiers connus. En mode `improve`
     *     (Pandémonium), sert à marquer `disabled` ceux absents de `initial_buildings` ∪
     *     `unlocked_buildings` : dans ce mode les chantiers sont pré-peuplés à la création de la
     *     ville (`InitializeTownBuildingsAction.php`), ces listes sont donc l'inventaire complet de
     *     ce qui existe — pas un déblocage initial parmi un catalogue par ailleurs atteignable. En
     *     mode `unlock` (défaut hors Pandémonium), l'absence de liste signifie « pas encore trouvé
     *     par plan » et reste ignorée, tout le catalogue étant éligible à la découverte
     *     (`ProcessTownEffect.php`, `findProspectivePrototypes`).
     * @return array<string, array<string, string>>
     */
    public function disponibilite(string $cheminRulesYaml, array $catalogueUids = []): array
    {
        $regles = $this->regles($cheminRulesYaml);
        $defaut = $regles['default'] ?? throw new RuntimeException("Bloc « default » absent de $cheminRulesYaml.");

        $parUid = [];

        foreach (self::MODES as $cleMode => $townType) {
            if (!array_key_exists($cleMode, $regles)) {
                throw new RuntimeException("Bloc « $cleMode » absent de $cheminRulesYaml.");
            }

            $disponiblesParListe = [];
            foreach (self::LISTES as $cleListe => $statut) {
                $base = $defaut[$cleListe] ?? [];
                $donnee = $regles[$cleMode][$cleListe] ?? null;
                $liste = $donnee === null ? $base : $this->fusionnerListe($base, $donnee);

                foreach ($liste as $uid) {
                    $parUid[$uid][$townType] = $statut;
                }

                if ($cleListe !== 'disabled_buildings') {
                    $disponiblesParListe = array_merge($disponiblesParListe, $liste);
                }
            }

            $modeAmeliorationSeule = ($regles[$cleMode]['features']['blueprint_mode']
                    ?? $defaut['features']['blueprint_mode']
                    ?? 'unlock') === 'improve';

            if ($modeAmeliorationSeule) {
                foreach ($catalogueUids as $uid) {
                    if (!in_array($uid, $disponiblesParListe, true)) {
                        $parUid[$uid][$townType] = 'disabled';
                    }
                }
            }
        }

        return $parUid;
    }

    /** @return array<string, int> */
    public function overridesRarete(string $cheminRulesYaml): array
    {
        $regles = $this->regles($cheminRulesYaml);

        return $regles['panda']['overrides']['building_rarity']
            ?? throw new RuntimeException("« panda.overrides.building_rarity » absent de $cheminRulesYaml.");
    }

    /** @return array<string, array<string, mixed>> */
    private function regles(string $cheminRulesYaml): array
    {
        if (!is_file($cheminRulesYaml)) {
            throw new RuntimeException("Fichier introuvable : $cheminRulesYaml.");
        }

        return Yaml::parseFile($cheminRulesYaml)['parameters']['rules']
            ?? throw new RuntimeException("« parameters.rules » absent de $cheminRulesYaml.");
    }

    /**
     * @param list<string> $base
     * @param mixed $donnee
     * @return list<string>
     */
    private function fusionnerListe(array $base, mixed $donnee): array
    {
        if (!is_array($donnee)) {
            throw new RuntimeException('Liste de chantiers inattendue (ni tableau, ni absente).');
        }

        $cles = array_keys($donnee);

        if ($cles === ['replace']) {
            return array_values($donnee['replace']);
        }

        if ($cles === ['merge']) {
            return array_values(array_merge($base, $donnee['merge']));
        }

        if ($cles === ['remove']) {
            return array_values(array_filter($base, static fn(string $uid): bool => !in_array($uid, $donnee['remove'], true)));
        }

        // Liste nue : remplacement PAR INDICE, tel que le fait Conf::deep_merge — surprenant sur
        // des listes de longueurs différentes, mais c'est le comportement réel du jeu.
        foreach ($donnee as $index => $valeur) {
            $base[$index] = $valeur;
        }

        return array_values($base);
    }
}
