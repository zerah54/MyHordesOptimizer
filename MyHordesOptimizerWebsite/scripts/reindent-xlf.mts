/**
 * Réindente à 4 espaces les fichiers XLF écrits par ng-extract-i18n-merge (2 espaces codés en dur).
 * Lancé par `npm run extract-i18n`, juste après l'extraction : n'est pas idempotent seul.
 */
import {readFileSync, writeFileSync} from 'node:fs';

/** Options de la cible extract-i18n dans angular.json. */
interface ExtractI18nOptions {
    sourceFile: string;
    targetFiles: string[];
}

const options: ExtractI18nOptions = JSON.parse(readFileSync('angular.json', 'utf8')).projects.MyHordesOptimizerWebsite.architect['extract-i18n'].options;

for (const file of [options.sourceFile, ...options.targetFiles]) {
    const content: string = readFileSync(file, 'utf8');
    writeFileSync(file, content.replace(/^ +/gm, (indent: string): string => indent + indent));
}
