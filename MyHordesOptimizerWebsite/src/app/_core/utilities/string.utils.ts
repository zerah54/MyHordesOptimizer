import type { I18nLabels } from '../../_abstract_model/types/_types';

/**
 * Normalise une chaîne pour comparaison : minuscules, sans accents.
 *
 * Tolère `null` / `undefined` : `I18nLabels` est un `Dictionary<string>`, donc TypeScript
 * considère `label[locale]` comme toujours défini, alors que l'API renvoie `null` pour une
 * traduction manquante. Sans ce garde-fou, un seul libellé non traduit fait planter le tri
 * de toute une liste (cf. `ItemsGroupByCategoryPipe`).
 */
export function normalizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Libellé d'un objet dans la langue demandée, avec repli sur une autre langue disponible.
 *
 * Trier sur une chaîne vide reviendrait à regrouper en tête tous les objets non traduits :
 * mieux vaut le libellé d'une autre langue que pas de libellé du tout.
 */
export function localizedLabel(labels: I18nLabels | null | undefined, locale: string): string {
    if (!labels) return '';
    const wanted: string | null | undefined = labels[locale];
    if (wanted) return wanted;
    return Object.values(labels).find((value: string | null | undefined): boolean => !!value) ?? '';
}
