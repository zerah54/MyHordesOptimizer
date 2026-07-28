<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor;

use RuntimeException;

/**
 * Configuration locale de l'extracteur.
 *
 * `config.local.php` est gitignoré ; `config.local.php.dist` sert de valeurs par défaut.
 */
final class Config
{
    private function __construct(
        private readonly string $racine,
        private readonly string $ref,
        private readonly ?string $cheminHorsLigne
    ) {
    }

    public static function load(string $racineExtracteur): self
    {
        $valeurs = self::lire($racineExtracteur . '/config.local.php.dist');

        if (is_file($racineExtracteur . '/config.local.php')) {
            $valeurs = array_merge($valeurs, self::lire($racineExtracteur . '/config.local.php'));
        }

        $ref = $valeurs['ref'] ?? '';
        if (!is_string($ref) || $ref === '') {
            throw new RuntimeException('Configuration invalide : « ref » doit être une chaîne non vide.');
        }

        $horsLigne = $valeurs['chemin_hors_ligne'] ?? null;
        if ($horsLigne !== null && !is_string($horsLigne)) {
            throw new RuntimeException('Configuration invalide : « chemin_hors_ligne » doit être une chaîne ou null.');
        }

        return new self($racineExtracteur, $ref, $horsLigne);
    }

    /** Retourne une copie de la configuration avec une autre référence MyHordes. */
    public static function avecRef(self $config, string $ref): self
    {
        if ($ref === '') {
            throw new RuntimeException('La référence passée à --ref ne peut pas être vide.');
        }

        return new self($config->racine(), $ref, $config->cheminHorsLigne());
    }

    public function racine(): string
    {
        return $this->racine;
    }

    public function ref(): string
    {
        return $this->ref;
    }

    public function cheminHorsLigne(): ?string
    {
        return $this->cheminHorsLigne;
    }

    /** @return array<string, mixed> */
    private static function lire(string $chemin): array
    {
        if (!is_file($chemin)) {
            throw new RuntimeException("Fichier de configuration introuvable : $chemin");
        }

        $valeurs = require $chemin;

        if (!is_array($valeurs)) {
            throw new RuntimeException("Le fichier $chemin doit retourner un tableau.");
        }

        return $valeurs;
    }
}
