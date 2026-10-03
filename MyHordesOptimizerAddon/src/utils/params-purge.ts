import type { MhoParameters, ParamCategory, ParamDefinition } from '../types';

/** Les paramètres conservés, et les clés retirées */
export interface PurgedParameters {
    parameters: MhoParameters;
    removed: string[];
}

/**
 * @param {ParamCategory[]} categories    Les catégories de paramètres déclarées
 * @returns {Set<string>}                 Les identifiants de toutes les options, à toute profondeur
 */
export function collectParamIds(categories: readonly ParamCategory[]): Set<string> {
    const ids: Set<string> = new Set<string>();
    const visit = (definitions: readonly ParamDefinition[] | undefined): void => {
        definitions?.forEach((definition: ParamDefinition) => {
            ids.add(definition.id);
            visit(definition.children);
        });
    };
    categories.forEach((category: ParamCategory) => visit(category.params));
    return ids;
}

/**
 * Retire des paramètres enregistrés les options qui ne sont plus déclarées : l'écran de réglages
 * ne les affiche plus, une ancienne valeur cochée resterait donc active sans pouvoir être décochée.
 *
 * @param {unknown} stored                   Les paramètres lus dans le stockage
 * @param {ReadonlySet<string>} known_ids    Les identifiants des options déclarées
 * @returns {PurgedParameters}               Les paramètres conservés et les clés retirées
 */
export function purgeUnknownParameters(stored: unknown, known_ids: ReadonlySet<string>): PurgedParameters {
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
        return { parameters: {}, removed: [] };
    }

    const parameters: MhoParameters = {};
    const removed: string[] = [];
    Object.entries(stored as Record<string, unknown>).forEach(([key, value]: [string, unknown]) => {
        if (known_ids.has(key)) {
            parameters[key] = value;
        } else {
            removed.push(key);
        }
    });
    return { parameters, removed };
}
