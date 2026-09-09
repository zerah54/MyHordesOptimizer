import type { Lang } from '../types';
import { changelogs as de } from './changelogs.de';
import { changelogs as en } from './changelogs.en';
import { changelogs as es } from './changelogs.es';
import { changelogs as fr } from './changelogs.fr';

export const changelogsByLang: Record<Lang, Record<string, string>> = { fr, en, de, es };

/**
 * Table des changelogs pour une langue, avec repli entrée par entrée sur le français
 * quand une version n'est pas encore traduite dans la langue demandée.
 */
export function getChangelogTable(lang: Lang, byLang: Record<Lang, Record<string, string>> = changelogsByLang): Record<string, string> {
    return lang === 'fr' ? byLang.fr : { ...byLang.fr, ...byLang[lang] };
}
