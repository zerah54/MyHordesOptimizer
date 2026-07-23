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
import { unwatchRendered, watchInventory } from '../utils/render-watch';

/**
 * État déplié de la section, conservé entre deux reconstructions.
 * Il ne peut pas vivre dans le DOM : la section est recréée dès que son contenu change.
 */
let wishlist_expanded: boolean = false;

/**
 * Signaux du jeu qui modifient le contenu de la case ou du sac, donc les lignes à afficher.
 * `inventory-changed-b` couvre le sol, `item-transfer` les ramassages et déposes.
 */
const wishlist_signals: string[] = ['sig-inventory-bag-loaded', 'sig-inventory-changed', 'sig-inventory-changed-b', 'sig-item-transfer'];

/** Les écouteurs de signaux ne doivent être posés qu'une fois pour toute la durée de vie de la page */
let wishlist_signals_bound: boolean = false;

/** Repose la section et les priorités */
function refreshWishlistDisplay(): void {
    displayWishlistInApp();
    displayPriorityOnItems();
}

/**
 * Met l'affichage sous surveillance : rendu de l'inventaire d'une part, signaux du jeu
 * d'autre part.
 *
 * IMPORTANT : ce branchement ne doit dépendre NI de `state.wishlist`, NI de la présence
 * de l'inventaire. La liste de courses arrive par le réseau et peut très bien être plus
 * lente que le rendu de la page ; si l'on n'observait qu'une fois les données présentes,
 * une arrivée tardive laisserait l'affichage vide sans que rien ne le rattrape — ce qui
 * se manifeste par des priorités absentes au chargement, de façon intermittente.
 */
function bindWishlistSignals(): void {
    watchInventory('wishlist', refreshWishlistDisplay);

    if (wishlist_signals_bound) return;
    wishlist_signals_bound = true;

    /**
     * Les signaux restent utiles pour ce qui ne se voit pas dans le DOM de l'inventaire,
     * en particulier les compteurs de banque mis à jour côté serveur.
     */
    wishlist_signals.forEach((signal_name: string) => {
        document.documentElement.addEventListener(signal_name, () => requestAnimationFrame(refreshWishlistDisplay));
    });
}

/**
 * Décrit les lignes affichées, compteurs compris : deux appels produisant la même
 * signature n'ont aucune raison de reconstruire la section.
 */
function buildContentSignature(is_workshop: boolean, list_to_display: WishlistItem[]): string {
    const rows: string[] = list_to_display
        .map((item: WishlistItem) => `${item.item.id}/${item.depot}/${item.bankCount}/${item.bagCount}/${item.count}`)
        .sort();

    return `${is_workshop ? 'w' : 'd'}|${rows.join(';')}`;
}

/** Affiche la liste de courses dans le désert et l'atelier */

export function displayWishlistInApp() {
    let wishlist_section = document.getElementById('wishlist-section');

    const is_desert: boolean = pageIsDesert();
    const is_workshop: boolean = pageIsWorkshop();

    /**
     * Posé avant toute autre condition : la liste de courses est chargée par le réseau
     * et peut arriver après ce passage. La surveillance doit être en place pour que
     * l'affichage soit rejoué le moment venu.
     */
    if (state.mho_parameters.display_wishlist && (is_workshop || is_desert)) {
        bindWishlistSignals();
    } else {
        /**
         * Ni désert ni atelier, ou option décochée : on arrête d'écouter les inventaires.
         * Sans risque pour les priorités, qui ne s'appliquent que dans le désert, donc
         * dans un sous-ensemble des cas couverts ici.
         */
        unwatchRendered('wishlist');
    }

    if (state.wishlist && state.mho_parameters.display_wishlist && (is_workshop || is_desert)) {
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

        /**
         * Le contenu du sol n'est pas rendu au moment où les initialisations sont rejouées :
         * la première construction sort donc une liste vide. Plutôt que de figer ce résultat,
         * on décrit le contenu affiché et on ne reconstruit que s'il a réellement changé —
         * ce qui rend la section idempotente tout en la gardant à jour au fil des ramassages.
         */
        const content_signature: string = buildContentSignature(is_workshop, list_to_display);
        if (wishlist_section) {
            if (wishlist_section.dataset.mhoSignature === content_signature) return;
            wishlist_section.remove();
            wishlist_section = undefined;
        }

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


            /**
             * L'état déplié survit aux reconstructions : la section se reconstruisant
             * dès que le contenu de la case change, la replier à chaque fois reviendrait
             * à la refermer sous les doigts de l'utilisateur.
             */
            const expanded: boolean = wishlist_expanded || state.is_refresh_wishlist;
            hide_state.innerText = expanded ? '˅' : '>';
            header_title.show = expanded;
            if (!expanded) {
                list.classList.add('hidden');
                update_section.classList.add('hidden');
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
                wishlist_expanded = header_title.show;
            });
            state.is_refresh_wishlist = false;
            displayWishlistInApp();
        };

        wishlist_section = document.createElement('div');
        wishlist_section.id = 'wishlist-section';
        wishlist_section.dataset.mhoSignature = content_signature;
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
    }
}

/** Affiche la priorité directement sur les éléments si l'option associée est cochée */

/** Classes de priorité posées sur les objets ; retirées avant tout recalcul */
const priority_classes: string[] = ['priority_in', 'priority_out', 'priority_trash'];

/** Objet affiché dans un inventaire, avec son chemin d'image déjà résolu */
interface PresentItem {
    element: HTMLElement;
    img_path: string;
}

export function displayPriorityOnItems() {
    if (state.mho_parameters.display_wishlist && pageIsDesert()) {
        bindWishlistSignals();
    }

    if (state.mho_parameters.display_wishlist && pageIsDesert() && state.wishlist) {
        /**
         * Les objets non remplacés par le jeu conservent leur classe : sans ce nettoyage,
         * un objet passé de « à prendre » à « à laisser » cumulerait les deux.
         */
        document.querySelectorAll(priority_classes.map((priority_class: string) => `.inventory li.${priority_class}`).join(', '))
            .forEach((decorated_item: Element) => decorated_item.classList.remove(...priority_classes));

        const present_items: PresentItem[] = [];
        const avalaible_slots = [];
        const inventories = document.querySelectorAll('.inventory');
        const rucksacks = document.querySelectorAll('.inventory.rucksack, .inventory.rucksack-escort');

        if (inventories) {
            for (const inventory of inventories) {
                /**
                 * Le chemin d'image est résolu UNE FOIS par objet affiché. Il l'était
                 * auparavant pour chaque couple (ligne de liste, objet), soit un
                 * `querySelector` et une expression régulière répétés autant de fois
                 * qu'il y a de lignes dans la liste de courses.
                 */
                for (const item_element of inventory?.querySelectorAll('li.item:not(.locked):not(.plus)') || []) {
                    const img_path: string | undefined = fixMhCompiledImg((item_element.querySelector('img') as HTMLImageElement)?.src);
                    /** Un objet sans image ne peut être rapproché d'aucune ligne : on l'ignore au lieu de faire échouer toute la passe */
                    if (!img_path) continue;

                    present_items.push({ element: item_element as HTMLElement, img_path });
                }
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
                        /** Rapprochement par sous-chaîne, et non par égalité : conservé tel quel, le chemin du référentiel n'étant qu'une portion de l'URL rendue */
                        .filter((present_item: PresentItem) => present_item.img_path.indexOf(wishlist_item.item.img) > 0)
                        .map((present_item: PresentItem) => present_item.element)
                        .forEach((present_item: HTMLElement) => {
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
