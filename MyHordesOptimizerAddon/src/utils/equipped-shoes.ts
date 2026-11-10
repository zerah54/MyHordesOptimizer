import { state } from '../state';
import { getItemFromImg } from './item-lookup';

/** Identifiant de l'objet « chaussures » dans le référentiel. */
const shoes_uid: string = 'shoe_#00';

/** Indique si l'élément du sac est l'objet « chaussures ». */
function isShoes(element: Element): boolean {
    return getItemFromImg(element.querySelector('img')?.src)?.uid === shoes_uid;
}

/** Chaussures équipées (objet essentiel `.locked` du sac, toujours présent dans le sac) ; `undefined` si le sac ne permet pas de conclure : absent, pas encore chargé (`li.placeholder`), référentiel non chargé, objet en chargement, ou tout verrouillé par une requête du jeu (un `.locked` sans `.bg-locked`). Un sac chargé sans objet (emplacements `li.free` seuls) vaut `false`. */
export function detectEquippedShoes(rucksack: Element | null): boolean | undefined {
    if (!rucksack || !state.items?.length || rucksack.querySelector('li.pending, li.placeholder')) {
        return undefined;
    }

    const items: Element[] = Array.from(rucksack.querySelectorAll('li.item'));
    if (items.length === 0) {
        return rucksack.querySelector('li.free') ? false : undefined;
    }
    const is_locked: (item: Element) => boolean = (item: Element): boolean => item.classList.contains('locked');

    if (items.every(is_locked) && items.some((item: Element): boolean => !item.classList.contains('bg-locked'))) {
        return undefined;
    }

    return items.some((item: Element): boolean => is_locked(item) && isShoes(item));
}
