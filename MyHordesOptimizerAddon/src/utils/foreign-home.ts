import { HOME_UPGRADES, HOUSE_LEVEL_KEY, HOUSE_LEVEL_LABELS } from '../data/home-labels';
import type { I18nLabel, Lang } from '../types';

/** Contenu de maison attendu par l'API (`CitizenHomeValueDto`). */
export type CitizenHomeValues = Record<string, number | boolean>;

/**
 * Id du User visité, lu dans le bouton de son âme : l'URL `town/visit/{id}` porte l'id du Citizen.
 * @param root Racine de recherche.
 * @returns L'id, ou undefined hors de la maison d'un citoyen vivant.
 */
export function readForeignHomeUserId(root: ParentNode = document): number | undefined {
    const href: string | null | undefined = root.querySelector('.citizen-home [x-ajax-href*="/soul/"]')?.getAttribute('x-ajax-href');
    const id: number = Number(href?.match(/\/soul\/(\d+)/)?.[1]);
    return Number.isInteger(id) && id > 0 ? id : undefined;
}

/**
 * Habitation et travaux affichés sur la maison d'un autre citoyen. La page ne liste que les travaux
 * réalisés : les autres valent 0. Un libellé inconnu invalide tout le relevé, pour ne jamais écraser
 * des données réelles avec des zéros.
 * @param lang Langue du jeu, celle des libellés de la page.
 * @param root Racine de recherche.
 * @returns Le contenu complet de la maison, ou undefined s'il ne peut pas être lu entièrement.
 */
export function readForeignHomeValues(lang: Lang, root: ParentNode = document): CitizenHomeValues | undefined {
    const house_cell: Element | null | undefined = root.querySelector('.lightbox img[src*="/home/"]')?.parentElement;
    const upgrades_cell: Element | null | undefined = root.querySelector('.lightbox img[src*="icons/deco"]')?.closest('.row')?.previousElementSibling?.lastElementChild;
    if (!house_cell || !upgrades_cell) {
        return undefined;
    }

    /** Le libellé de l'habitation est suivi de sa défense : « Maison [ + 3 ] ». */
    const house_label: string = (house_cell.textContent ?? '').split('[')[0].trim();
    const house_level: number = HOUSE_LEVEL_LABELS.findIndex((label: I18nLabel): boolean => label[lang] === house_label);
    if (house_level < 0) {
        return undefined;
    }

    const values: CitizenHomeValues = { [HOUSE_LEVEL_KEY]: house_level };
    Object.keys(HOME_UPGRADES).forEach((key: string): void => {
        values[key] = isFlag(key) ? false : 0;
    });

    for (const upgrade of Array.from(upgrades_cell.querySelectorAll('b'))) {
        const match: RegExpMatchArray | null = (upgrade.textContent ?? '').trim().match(/^(.+?)\s+(\d+)$/);
        const key: string | undefined = match
            ? Object.keys(HOME_UPGRADES).find((candidate: string): boolean => HOME_UPGRADES[candidate].label[lang] === match[1])
            : undefined;
        if (!match || !key) {
            console.warn('MHO - travaux de maison non reconnus :', upgrade.textContent);
            return undefined;
        }
        values[key] = isFlag(key) ? +match[2] > 0 : +match[2];
    }
    return values;
}

/** Les améliorations à un seul niveau sont des booléens côté API (`hasAlarm`, `hasCurtain`…). */
function isFlag(key: string): boolean {
    return key.startsWith('has');
}

/**
 * Objets du coffre visibles sur la maison d'un autre citoyen. Le jeu y masque déjà le Paillasson piégé ;
 * les objets cachés (`banished_hidden`) sont écartés comme pour son propre coffre.
 * @param root Racine de recherche.
 * @returns Les éléments `li.item` (vide si la page n'en affiche aucun), ou undefined si le coffre
 * n'est pas lisible (rideau, inventaire en cours de chargement, citoyen mort).
 */
export function readForeignChestItems(root: ParentNode = document): Element[] | undefined {
    const chest: Element | null = root.querySelector('.citizen-chest');
    if (!chest || !root.querySelector('.citizen-home [x-ajax-href*="/soul/"]') || chest.querySelector('.curtain-text')) {
        return undefined;
    }
    const inventory_host: Element | null = chest.querySelector('hordes-inventory');
    if (!inventory_host) {
        return [];
    }
    /** Le premier inventaire est celui du citoyen visité ; un second (mon coffre, mon sac) apparaît pendant un vol. */
    const inventory: Element | null = inventory_host.querySelector('ul.inventory.chest');
    if (!inventory || inventory.querySelector('.placeholder, li.item.pending')) {
        return undefined;
    }
    return Array.from(inventory.querySelectorAll('li.item:not(.banished_hidden)'));
}
