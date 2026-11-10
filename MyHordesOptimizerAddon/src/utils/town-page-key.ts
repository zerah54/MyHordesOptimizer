import { state } from '../state';

const town_key_dataset_name: string = 'mhoTownKey';
const soul_town_url_regex: RegExp = /\/jx\/soul\/[^/]+\/town\/(\d+)/;

/** Vrai si le bandeau Twinoid, affiché par le gabarit uniquement pour une ville importée, est présent */
export function isImportedTownPage(view_town: HTMLElement): boolean {
    return view_town.querySelector('.green-note img[src*="badges/twinoid"]') !== null;
}

/** Vrai si l'API a basculé sur les clés de ville uniques (`TownKeysMigrated` = 1) ; faux tant que les paramètres ne sont pas chargés */
export function areTownKeysMigrated(): boolean {
    return state.parameters?.find((param: { name: string; value: string }): boolean => param.name === 'TownKeysMigrated')?.value === '1';
}

/** Clé publique de la ville affichée (`-idtown` de l'URL si importée, `data-town-id` sinon), null si indéterminée ; seule une clé non null est mémorisée */
export function getViewTownKey(view_town: HTMLElement, url: string, keys_migrated: boolean): number | null {
    if (!isImportedTownPage(view_town)) {
        const map_id_raw: string | null = view_town.getAttribute('data-town-id');
        return map_id_raw ? +map_id_raw : null;
    }
    const memorized: string | undefined = view_town.dataset[town_key_dataset_name];
    if (memorized !== undefined) return +memorized;

    const id_raw: string | undefined = soul_town_url_regex.exec(url)?.[1];
    if (id_raw === undefined) return null;

    const key: number = Number(id_raw);
    view_town.dataset[town_key_dataset_name] = String(key);
    return key;
}
