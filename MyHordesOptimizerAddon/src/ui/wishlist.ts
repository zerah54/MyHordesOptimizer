import { getWishlist } from '../api/wishlist';
import { mh_optimizer_icon, repo_img_hordes_url } from '../config/constants';
import { texts, wishlist_depot, wishlist_headers, wishlist_title } from '../i18n/texts';
import { state } from '../state';
import type { MhoItem, WishlistItem } from '../types';
import { getI18N } from '../utils/i18n';
import { getItemFromImg } from '../utils/item-lookup';
import { fixMhCompiledImg } from '../utils/misc';
import { pageIsDesert, pageIsWorkshop } from '../utils/page';
import { getCurrentPosition } from '../utils/position';

/** Affiche la liste de courses dans le désert et l'atelier */

export function displayWishlistInApp(count = 0) {
    let wishlist_section = document.getElementById('wishlist-section');

    const is_desert: boolean = pageIsDesert();
    const is_workshop: boolean = pageIsWorkshop();
    if (state.wishlist && state.mho_parameters.display_wishlist && (is_workshop || is_desert)) {
        if (wishlist_section) return;

        let zone_to_insert;
        if (is_workshop) {
            zone_to_insert = document.getElementsByClassName('row-table')[0];
        } else {
            zone_to_insert = document.getElementsByClassName('actions-box')[0];
        }

        if (!zone_to_insert) return;

        const used_wishlist: WishlistItem[] = getWishlistForZone();

        if (!used_wishlist) return;

        /**
         * Le contenu de la case ne dépend pas de la ligne de liste de courses examinée :
         * on le résout une seule fois, sous forme d'ensemble d'identifiants, plutôt qu'à
         * chaque passage dans le prédicat de filtrage.
         */
        const item_ids_in_cell: Set<number> = is_workshop
            ? new Set<number>()
            : new Set<number>(
                Array.from(document.querySelectorAll('.inventory li.item img'))
                    .map((item_element: HTMLImageElement) => getItemFromImg(item_element.src))
                    .filter((item_in_cell: MhoItem | undefined) => !!item_in_cell)
                    .map((item_in_cell: MhoItem) => item_in_cell.id)
            );

        const list_to_display: WishlistItem[] = used_wishlist.filter((item: WishlistItem) => {
            if (is_workshop) {
                return item.isWorkshop;
            } else {
                return item_ids_in_cell.has(item.item.id);
            }
        });

        if (is_workshop && list_to_display.length === 0) return;

        const refreshWishlist = () => {
            const update_section: HTMLDivElement = document.createElement('div');
            header.appendChild(update_section);

            const last_update: HTMLSpanElement = document.createElement('span');
            last_update.classList.add('small');
            last_update.setAttribute('style', 'margin-right: 0.5em;');
            if (state.wishlist.lastUpdateInfo) {
                last_update.innerText = new Intl.DateTimeFormat('default', {
                    dateStyle: 'medium',
                    timeStyle: 'medium'
                } as any).format(new Date(state.wishlist.lastUpdateInfo.updateTime)) + ' - ' + state.wishlist.lastUpdateInfo.userName;
            }
            update_section.appendChild(last_update);

            const update_btn: HTMLButtonElement = document.createElement('button');
            update_btn.classList.add('inline');
            update_btn.innerText = getI18N(texts.update);
            update_btn.addEventListener('click', () => {
                state.is_refresh_wishlist = true;
                state.wishlist = undefined;
                wishlist_section = undefined;
                setTimeout(() => {
                    displayWishlistInApp();
                    getWishlist().then(() => {
                        displayWishlistInApp();
                    });
                });
            });
            update_section.appendChild(update_btn);

            const list: HTMLDivElement = document.createElement('div');
            list.classList.add('row-table');
            content.appendChild(list);

            const list_header: HTMLDivElement = document.createElement('div');
            list_header.classList.add('row-flex', 'mho-header', 'bottom');
            list.appendChild(list_header);

            wishlist_headers
                .filter((header_cell_item) => header_cell_item.id !== 'delete')
                .forEach((header_cell_item) => {
                    const header_cell: HTMLDivElement = document.createElement('div');
                    header_cell.classList.add('padded', 'cell');
                    header_cell.classList.add(header_cell_item.id === 'label' ? 'rw-5' : (header_cell_item.id === 'depot' ? 'rw-3' : 'rw-2'));
                    header_cell.innerText = getI18N(header_cell_item.label);
                    list_header.appendChild(header_cell);
                });

            list_to_display
                .forEach((item: WishlistItem) => {
                    const list_item: HTMLDivElement = document.createElement('div');
                    list_item.classList.add('row-flex');
                    list.appendChild(list_item);

                    const title: HTMLDivElement = document.createElement('div');
                    title.classList.add('padded', 'cell', 'rw-5');
                    title.innerHTML = `<img src="${repo_img_hordes_url + item.item.img}" style="margin-right: 5px" /><span class="small">${getI18N(item.item.label)}</span>`;
                    list_item.appendChild(title);

                    const item_depot: HTMLSpanElement = document.createElement('span');
                    item_depot.classList.add('padded', 'cell', 'rw-3');
                    item_depot.innerHTML = `<span class="small">${getI18N(wishlist_depot.find((depot) => item.depot === depot.value).label)}</span>`;
                    list_item.appendChild(item_depot);

                    const bank_count: HTMLSpanElement = document.createElement('span');
                    bank_count.classList.add('padded', 'cell', 'rw-2');
                    bank_count.innerHTML = `<span class="small">${item.bankCount}</span>`;
                    list_item.appendChild(bank_count);

                    const bag_count: HTMLSpanElement = document.createElement('span');
                    bag_count.classList.add('padded', 'cell', 'rw-2');
                    bag_count.innerHTML = `<span class="small">${item.bagCount}</span>`;
                    list_item.appendChild(bag_count);

                    const bank_need: HTMLSpanElement = document.createElement('span');
                    bank_need.classList.add('padded', 'cell', 'rw-2');
                    bank_need.innerHTML = `<span class="small">${item.count >= 0 ? item.count : '∞'}</span>`;
                    list_item.appendChild(bank_need);

                    const needed: HTMLSpanElement = document.createElement('span');
                    needed.classList.add('padded', 'cell', 'rw-2');
                    needed.innerHTML = `<span class="small">${item.count >= 0 ? (item.count - item.bankCount - item.bagCount) : '∞'}</span>`;
                    list_item.appendChild(needed);
                });


            if (!state.is_refresh_wishlist) {
                hide_state.innerText = '>';
                header_title.show = false;

                list.classList.add('hidden');
                update_section.classList.add('hidden');
            } else {
                hide_state.innerText = '˅';
                header_title.show = true;
            }
            header_title.addEventListener('click', () => {
                if (header_title.show) {
                    hide_state.innerText = '>';
                } else {
                    hide_state.innerText = '˅';
                }
                list.classList.toggle('hidden');
                update_section.classList.toggle('hidden');
                header_title.show = !header_title.show;
            });
            state.is_refresh_wishlist = false;
            displayWishlistInApp();
        };

        wishlist_section = document.createElement('div');
        wishlist_section.id = 'wishlist-section';
        wishlist_section.classList.add('row');

        if (pageIsWorkshop()) {
            zone_to_insert.parentNode.insertBefore(wishlist_section, zone_to_insert.nextSibling);
        } else {
            const main_actions = zone_to_insert.parentNode;
            main_actions.parentNode.insertBefore(wishlist_section, main_actions.nextSibling);
        }

        const cell = document.createElement('div');
        wishlist_section.appendChild(cell);

        const header = document.createElement('h5');
        header.setAttribute('style', 'display: flex; justify-content: space-between;');
        cell.appendChild(header);

        const header_title = document.createElement('span');
        header_title.setAttribute('style', 'margin-top: 7px; cursor: pointer;');
        header.appendChild(header_title);

        const hide_state = document.createElement('span');
        hide_state.setAttribute('style', 'margin-right: 0.5em');
        header_title.appendChild(hide_state);

        const header_mho_img = document.createElement('img');
        header_mho_img.src = mh_optimizer_icon;
        header_mho_img.style.height = '24px';
        header_mho_img.style.marginRight = '0.5em';
        header_title.appendChild(header_mho_img);

        const header_label = document.createElement('span');
        header_label.innerText = getI18N(wishlist_title);
        header_title.appendChild(header_label);

        const content = document.createElement('div');
        cell.appendChild(content);

        refreshWishlist();
    } else if (wishlist_section) {
        wishlist_section.remove();
    } else if (count < 3) {
        setTimeout(() => {
            displayWishlistInApp(count + 1);
        }, 250);
    }
}

/** Affiche la priorité directement sur les éléments si l'option associée est cochée */

export function displayPriorityOnItems() {
    if (state.mho_parameters.display_wishlist && pageIsDesert() && state.wishlist) {
        const present_items = [];
        const avalaible_slots = [];
        const used_spaces = [];
        const inventories = document.querySelectorAll('.inventory');
        const rucksacks = document.querySelectorAll('.inventory.rucksack, .inventory.rucksack-escort');

        if (inventories) {
            for (const inventory of inventories) {
                present_items.push(...inventory?.querySelectorAll('li.item:not(.locked):not(.plus)') || []);
            }
        }

        if (rucksacks) {
            for (const rucksack of rucksacks) {
                avalaible_slots.push(...rucksack?.querySelectorAll('li.free, li.item:not(.locked):not(.plus)') || []);
            }
        }

        const used_wishlist = getWishlistForZone();
        const item_count = avalaible_slots.length;
        const heavy_slots = avalaible_slots.filter((slot) => slot.classList.contains('bg-heavy')).length;

        if (used_wishlist) {
            let count = 0;
            let heavy_count = 0;
            used_wishlist
                .forEach((wishlist_item) => {
                    present_items
                        .filter((present_item) => fixMhCompiledImg(present_item.querySelector('img').src).indexOf(wishlist_item.item.img) > 0)
                        .forEach((present_item) => {
                            if (wishlist_item.depot >= -1) {
                                let priority_in = false;

                                if (count < item_count) {
                                    if (wishlist_item.item.isHeaver) {
                                        if (heavy_count < heavy_slots) {
                                            priority_in = true;
                                        }
                                        heavy_count++;
                                    } else {
                                        priority_in = true;
                                    }
                                }

                                if (priority_in) {
                                    present_item.classList.add('priority_in');
                                    count++;
                                } else {
                                    present_item.classList.add('priority_out');
                                }
                            } else if (wishlist_item.depot < -1) {
                                present_item.classList.add('priority_trash');
                            }
                        });
                });
        }
    }
}


export function getWishlistForZone(): WishlistItem[] {
    if (!state.wishlist || !state.wishlist.wishList) return undefined;
    if (!pageIsDesert()) return [...state.wishlist.wishList];

    const position = getCurrentPosition();
    const current_zone = (Math.abs(position[0]) + Math.abs(position[1])) * 2 - 3;

    const used_wishlist = [...state.wishlist.wishList.filter((wishlist_item) => wishlist_item.zoneXPa === 0 || wishlist_item.zoneXPa >= current_zone)];
    used_wishlist?.sort((item_a, item_b) => {
        return item_b.priority - item_a.priority;
    });

    return used_wishlist;
}

/** @param {HTMLElement} tooltip_container */
