# Extracteur de référentiels MyHordes

Remplace l'ancien `Scripts/Parser/`. Télécharge le code source de MyHordes depuis GitLab et rejoue
sa propre chaîne de fixtures pour produire les fichiers de
`MyHordesOptimizerApi/MyHordesOptimizerApi/Data/**`.

## Mise en route

```bash
cp config.local.php.dist config.local.php   # puis adapter si besoin
<php> <composer.phar> install
```

`<php>` et `<composer.phar>` désignent votre PHP 8.4 et votre Composer. Sous Laravel Herd :
`C:\Users\<vous>\.config\herd\bin\php84\php.exe` et
`C:\Users\<vous>\.config\herd\bin\composer.phar`.

## Utilisation

```bash
<php> extract.php --check     # rapport de dérive, n'écrit rien dans Data/**
<php> extract.php             # écrit après contrôle
<php> extract.php --ref=<sha> # épingle une version précise de MyHordes
<php> extract.php --offline   # utilise le clone local au lieu de télécharger
<php> extract.php --raw-only  # s'arrête après raw/
<php> extract.php --force     # passe outre les garde-fous
```

## Tests

```bash
<php> vendor/bin/phpunit
```

Les tests du harnais ont besoin d'une source téléchargée ; ils sont ignorés sans accès réseau.

## Ce que l'extracteur n'écrit jamais

`Data/Building/building.json`, `Data/Jobs/jobs.json`, `Data/Camping/`, `Data/Glossary/` et
`Data/Wishlist/` ne proviennent pas des fixtures. Voir la section 8 de la spécification.
