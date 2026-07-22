import { hordes_img_url } from '../config/constants';
import { status_list } from '../i18n/texts';
import { state } from '../state';
import type { MhoItem } from '../types';

/** Tableau d'objets à partir duquel l'index ci-dessous a été construit */
let indexed_items_source: MhoItem[] | undefined;
/** Index chemin d'image → objet, évitant un parcours linéaire du référentiel à chaque résolution */
let items_by_img: Map<string, MhoItem> = new Map();

/**
 * Retourne l'index des objets par chemin d'image, en le reconstruisant dès que le
 * référentiel a été remplacé.
 *
 * `getItems()` produit un nouveau tableau à chaque appel, avec des compteurs de banque et
 * de liste de courses rafraîchis : la comparaison de référence garantit que l'index suit,
 * sans avoir à le notifier depuis les points de chargement. Les objets sont indexés par
 * référence, donc toute modification faite sur place (compteurs, état cassé) reste visible.
 */
function getItemsByImg(): Map<string, MhoItem> {
    if (state.items === indexed_items_source) return items_by_img;

    indexed_items_source = state.items;
    items_by_img = new Map<string, MhoItem>();
    state.items?.forEach((item: MhoItem) => {
        /** `find` retenait la première occurrence : on conserve ce comportement si deux objets partagent une image */
        if (!items_by_img.has(item.img)) {
            items_by_img.set(item.img, item);
        }
    });

    return items_by_img;
}

export function getTooltipItem(img, isStatus) {
    let hovered_item;
    let hovered_status;

    if (img && img.src) {
        if (!isStatus) {
            hovered_item = getItemFromImg(img.src);
        } else {
            hovered_status = getStatusFromImg(img.src);
        }
    }

    return {
        item: hovered_item,
        status: hovered_status,
        alt: img?.alt
    };
}

export function getClickedItem(target) {
    const item_icon = event.target.closest('span.item-icon') || event.target.previousElementSibling?.closest('span.item-icon') || event.target.previousElementSibling?.querySelector('span.item-icon');
    if (item_icon) {
        const hovered_item = getItemFromImg(item_icon.querySelector('img').src);
        const broken = item_icon.parentElement.classList.contains('broken');
        return { item: hovered_item, broken: broken };
    }
}

export function getFixedImagePath(img_src) {
    const index = img_src.indexOf(hordes_img_url);
    if (index === -1) {
        console.warn(`Image source "${img_src}" does not include '${hordes_img_url}' as expected.`, img_src);
        return;
    }
    return img_src
        .slice(index + hordes_img_url.length)
        .replace(/\/(.+)\.(\w+?)\.(\w+?)$/, '/$1.$3')
        .replace('.b.', '.');
}

export function getItemFromImg(img_src) {
    if (img_src) {
        const img_path = getFixedImagePath(img_src);
        return getItemsByImg().get(img_path);
    }
}

export function getStatusFromImg(img_src) {
    if (img_src) {
        const img_path = getFixedImagePath(img_src);
        return status_list.find((status) => status.img === img_path);
    }
}
