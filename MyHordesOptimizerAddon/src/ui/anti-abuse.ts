import { lang, mh_optimizer_icon, mho_anti_abuse_counter_id, mho_anti_abuse_key, repo_img_hordes_url } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { getItemFromImg } from '../utils/item-lookup';
import { pageIsBank, pageIsWell } from '../utils/page';
import { getStorageItem, setStorageItem } from '../utils/storage';

// Local helper: TypeScript's arrFrom(any) sometimes infers element type
// 'unknown' rather than 'any' when the source isn't a statically-typed
// iterable. This explicit-any wrapper avoids that, matching the original
// untyped JS behaviour (no behaviour change, pure typing aid).
const arrFrom = (x: any): any[] => Array.from(x);

/** Posée sur la cellule du forum (banque, desktop) pour l'empiler en flex vertical avec le compteur */
const mho_bank_forum_cell_class: string = 'mho-bank-forum-cell';


export function displayAntiAbuseCounter(): void {
    const existing_counter: HTMLElement | null = document.getElementById(mho_anti_abuse_counter_id);

    /**
     * Option décochée, ou hors banque/puits : on RETIRE le compteur affiché et on abandonne
     * ses écouteurs (via le contrôleur qui les porte). L'ancienne version annulait un
     * contrôleur fraîchement créé — donc sans aucun écouteur — et laissait le bloc en place.
     * Le tick du minuteur, lui, s'arrête tout seul dès que le bloc a quitté le DOM.
     */
    if (!state.mho_parameters.display_anti_abuse || (!pageIsBank() && !pageIsWell())) {
        state.anti_abuse_controller?.abort();
        state.anti_abuse_controller = undefined;
        existing_counter?.remove();
        /** Rend à la cellule du forum sa mise en page native */
        document.querySelector(`.${mho_bank_forum_cell_class}`)?.classList.remove(mho_bank_forum_cell_class);
        return;
    }

    /** Déjà affiché : rien à refaire, et on préserve les écouteurs déjà en place */
    if (existing_counter) return;

    /**
     * (Re)création. Un contrôleur neuf porte les écouteurs de cette instance ; on abandonne
     * d'abord ceux d'une éventuelle instance précédente. Il n'est plus recréé à chaque appel
     * (comme avant), ce qui aurait détaché les écouteurs de leur signal au premier rejeu.
     */
    state.anti_abuse_controller?.abort();
    state.anti_abuse_controller = new AbortController();

    const mho_anti_abuse_counter: HTMLElement = document.createElement('div');
    mho_anti_abuse_counter.id = mho_anti_abuse_counter_id;

    if (pageIsBank()) {
        if (window.innerWidth < 950) {
            const bank_inventory: Element | null = document.querySelector('#bank-inventory');
            if (!bank_inventory) return;
            const inventory_buttons: NodeListOf<Element> = bank_inventory.querySelectorAll(':scope > button');
            const last_inventory_button: Element | undefined = inventory_buttons[inventory_buttons.length - 1];
            if (!last_inventory_button) return;
            last_inventory_button.parentElement!.insertBefore(mho_anti_abuse_counter, last_inventory_button.nextElementSibling);
        } else {
            const forum_preview: Element | null = document.querySelector('.forum-preview-wrapper-bank');
            if (!forum_preview?.parentElement) return;
            forum_preview.parentElement.insertBefore(mho_anti_abuse_counter, forum_preview.parentElement.firstElementChild);
            /**
             * La cellule du forum devient un conteneur flex vertical : le compteur en haut,
             * le forum en dessous qui remplit le reste en gardant son panneau à défilement
             * natif. La classe (réversible) remplace l'ancienne casse du positionnement absolu
             * du forum, faite en styles inline jamais retirés.
             */
            forum_preview.parentElement.classList.add(mho_bank_forum_cell_class);
        }
    } else {
        const actions_box: Element | null = document.querySelector('.actions-box');
        if (!actions_box) return;
        actions_box.parentElement!.insertBefore(mho_anti_abuse_counter, actions_box);
    }

    const header: HTMLElement = document.createElement('h5');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    mho_anti_abuse_counter.appendChild(header);

    const first_part: HTMLElement = document.createElement('div');
    first_part.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 24px !important; vertical-align: middle; margin-right: 0.5em;">${getI18N(texts.anti_abuse_title)}`;
    header.appendChild(first_part);

    const second_part: HTMLElement = document.createElement('div');
    header.appendChild(second_part);

    const content: HTMLElement = document.createElement('div');
    content.classList.add('mho-anti-abuse-counter-content');
    mho_anti_abuse_counter.appendChild(content);

    /**
     * Compteur de prises restantes + alerte de limite : mécanique propre à la BANQUE
     * (`BankAntiAbuseService` du jeu). Limite de base sur une fenêtre glissante de 15 min ;
     * le Tribunal (+5) n'est pas connu de l'addon et est ignoré (cf. mémoire), le compteur
     * sous-estime alors la limite — il reste donc prudent. Absent sur la page du puits, qui
     * n'a pas cette limite de prises.
     */
    let take_status: HTMLElement | undefined;
    let warning_line: HTMLElement | undefined;
    if (pageIsBank()) {
        take_status = document.createElement('span');
        take_status.classList.add('small');
        take_status.style.margin = '0 0.5em';
        /** Le libellé est porté par l'infobulle pour gagner de la place : seul le ratio est affiché */
        take_status.title = getI18N(texts.anti_abuse_takes_remaining);
        header.insertBefore(take_status, second_part);

        warning_line = document.createElement('div');
        warning_line.classList.add('note', 'note-important');
        warning_line.style.display = 'none';
        warning_line.innerText = getI18N(texts.anti_abuse_limit_reached);
        mho_anti_abuse_counter.insertBefore(warning_line, content);
    }

    /** Fin */

    getStorageItem(mho_anti_abuse_key).then((counter_values: any) => {
        if (!counter_values) {
            counter_values = [];
        }

        /** Vrai si le crédit de 15 min de la valeur est écoulé ; la retire alors du stockage */
        const is_time_invalid = (_counter_value: any): boolean => {
            const since: number = Date.now() - parseInt(_counter_value.take_at);
            const time_left: number = (15 * 60000) - since;
            if (time_left < 0) {
                const current_index: number = counter_values.indexOf(_counter_value);
                if (current_index > -1) {
                    counter_values.splice(current_index, 1);
                    setStorageItem(mho_anti_abuse_key, [...counter_values]);
                }
            }
            return time_left < 0;
        };

        /**
         * Toutes les pastilles partagent UN seul minuteur à 1 s, au lieu d'un `setInterval`
         * de 250 ms par pastille : l'affichage étant à la seconde, quatre rafraîchissements
         * par seconde et par compteur ne servaient à rien. Le minuteur s'arrête dès qu'il n'y
         * a plus de pastille, ou que le bloc a quitté la page (navigation) — l'ancien code
         * laissait au contraire chaque intervalle tourner sur un élément détaché jusqu'à son
         * expiration.
         */
        interface AntiAbuseRow {
            counter_value: any;
            value_in_list: HTMLElement;
            item_counter: HTMLElement;
        }
        const active_rows: AntiAbuseRow[] = [];
        let tick_interval: ReturnType<typeof setInterval> | undefined;

        /**
         * Limite de prises sur la fenêtre glissante : 10 en chaos, 5 sinon (défauts du jeu).
         * Le Tribunal (+5) est ignoré faute de donnée de bâtiment côté addon.
         */
        const nb_object_max: number = state.mh_user?.townDetails?.isChaos ? 10 : 5;

        /**
         * Met à jour le compteur de prises restantes et l'alerte de limite (banque uniquement).
         * TOUTES les lignes suivies comptent : prises banque, rations du puits après la première
         * (côté jeu, `WellExtractionCommonListener::onCheckBankAntiAbuse` réutilise le compteur
         * anti-abus de la banque dès `already_taken > 0`), et compteurs manuels du bouton « + »
         * (là pour rattraper une prise que l'addon aurait manquée).
         */
        const refreshTakeStatus = (): void => {
            if (!take_status || !warning_line) return;
            const used: number = active_rows.length;
            const remaining: number = Math.max(0, nb_object_max - used);
            take_status.innerText = `${remaining}/${nb_object_max}`;
            /** La prise suivante déclenche l'anti-abus dès que la limite est atteinte */
            warning_line.style.display = used >= nb_object_max ? 'block' : 'none';
        };

        const renderRow = (row: AntiAbuseRow): void => {
            const since: number = Date.now() - parseInt(row.counter_value.take_at);
            const time_left: number = (15 * 60000) - since;
            const minutes: number = Math.floor(time_left / 60000);
            const seconds: number = Math.floor((time_left % 60000) / 1000);
            row.item_counter.innerText = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        };

        const stopTick = (): void => {
            if (tick_interval !== undefined) {
                clearInterval(tick_interval);
                tick_interval = undefined;
            }
        };

        const tick = (): void => {
            if (!document.getElementById(mho_anti_abuse_counter_id)) {
                active_rows.length = 0;
                stopTick();
                return;
            }
            for (let i: number = active_rows.length - 1; i >= 0; i--) {
                const row: AntiAbuseRow = active_rows[i];
                if (is_time_invalid(row.counter_value)) {
                    row.value_in_list.remove();
                    active_rows.splice(i, 1);
                } else {
                    renderRow(row);
                }
            }
            refreshTakeStatus();
            if (active_rows.length === 0) stopTick();
        };

        const define_row = (counter_value: any, new_content: Element | null, _fictive: boolean = false): void => {
            if (is_time_invalid(counter_value)) return;

            const value_in_list: HTMLElement = document.createElement('div');
            value_in_list.title = counter_value.item?.item?.label[lang];
            value_in_list.classList.add('brown-tag');
            value_in_list.style.width = '85px';
            new_content!.appendChild(value_in_list);

            const item_name: HTMLElement = document.createElement('div');
            item_name.innerHTML = `<img src="${repo_img_hordes_url + counter_value.item?.item?.img}" style="${counter_value.item?.broken ? 'border: 1px dotted red' : ''}">`;
            value_in_list.appendChild(item_name);

            const item_counter: HTMLElement = document.createElement('div');
            const row: AntiAbuseRow = { counter_value, value_in_list, item_counter };
            /** Affichage immédiat, sans attendre le premier tick */
            renderRow(row);
            active_rows.push(row);
            if (tick_interval === undefined) {
                tick_interval = setInterval(tick, 1000);
            }
            value_in_list.appendChild(item_counter);
            refreshTakeStatus();
        };

        const add_counter_btn: HTMLButtonElement = document.createElement('button');
        add_counter_btn.innerText = '+';
        second_part.appendChild(add_counter_btn);
        add_counter_btn.addEventListener('click', () => {
            state.anti_abuse_controller.abort();
            const fictive_item: any = {
                label: {
                    de: 'Benutzerdefinierter Zähler',
                    en: 'Custom counter',
                    es: 'Contador personalizado',
                    fr: 'Compteur personnalisé',
                },
                img: 'icons/small_warning.gif'
            };
            const counter_value: any = { item: { item: fictive_item, broken: false }, take_at: Date.now() + 5000 };
            counter_values.push(counter_value);
            setStorageItem(mho_anti_abuse_key, counter_values);
            const new_mho_anti_abuse_counter: Element | null = document.querySelector(`#${mho_anti_abuse_counter_id}`);
            if (new_mho_anti_abuse_counter) {
                define_row(counter_value, new_mho_anti_abuse_counter.querySelector('.mho-anti-abuse-counter-content'), true);
            }
        });

        counter_values.forEach((counter_value: any) => {
            define_row(counter_value, content);
        });

        /** Affiche « restant/max » dès l'ouverture, même sans aucune prise en cours */
        refreshTakeStatus();

        if (pageIsBank()) {
            const bank: Element | null = document.querySelector('#bank-inventory');
            let old_bag: NodeListOf<Element> | undefined;

            bank!.addEventListener('click', (event: Event) => {
                event.stopPropagation();
                const target: HTMLElement = event.target as HTMLElement;
                const valid_tags: string[] = ['li', 'span', 'img'];
                if (!valid_tags.includes(target.nodeName.toLowerCase())) return;
                if (target.classList.length > 0 && !target.classList.contains('item') && !target.classList.contains('item-icon')) return;

                const rucksack: Element | null = document.querySelector('#bank-inventory ul.rucksack');
                if (!rucksack) return;

                old_bag = document.querySelectorAll('#bank-inventory ul.rucksack li.item');
                const old_bag_items: any[] = arrFrom(old_bag).map(
                    (item_in_old_bag: Element) => getItemFromImg((item_in_old_bag.querySelector('img') as HTMLImageElement).src)
                );

                state.bank_observer?.disconnect();

                let observer: MutationObserver;
                const callback = (_mutationsList: MutationRecord[]): void => {
                    observer.disconnect();
                    state.bank_observer = undefined;

                    setTimeout(() => {
                        const new_bag: NodeListOf<Element> = document.querySelectorAll('#bank-inventory ul.rucksack li.item');
                        if ((old_bag?.length ?? 0) < new_bag.length) {
                            getStorageItem(mho_anti_abuse_key).then((stored_values: any) => {
                                if (!stored_values) {
                                    stored_values = [];
                                }
                                const new_bag_items: any[] = arrFrom(new_bag).map(
                                    (item_in_new_bag: Element) => getItemFromImg((item_in_new_bag.querySelector('img') as HTMLImageElement).src)
                                );
                                new_bag_items.forEach((new_bag_item: any, index: number) => {
                                    const old_item_index: number = old_bag_items.findIndex(
                                        (old_bag_item: any) => old_bag_item.id === new_bag_item.id
                                    );
                                    if (old_item_index > -1) {
                                        old_bag_items.splice(old_item_index, 1);
                                    } else {
                                        const counter_value: any = {
                                            item: {
                                                item: new_bag_item,
                                                broken: (new_bag[index] as HTMLElement).classList.contains('broken')
                                            },
                                            take_at: Date.now() + 2500
                                        };
                                        stored_values.push(counter_value);
                                        counter_values.push(counter_value);

                                        const new_mho_anti_abuse_counter: Element | null = document.querySelector(`#${mho_anti_abuse_counter_id}`);
                                        if (new_mho_anti_abuse_counter) {
                                            define_row(counter_value, new_mho_anti_abuse_counter.querySelector('.mho-anti-abuse-counter-content'));
                                        }
                                    }
                                });
                                setStorageItem(mho_anti_abuse_key, stored_values);
                                old_bag = new_bag;
                            });
                        } else {
                            old_bag = undefined;
                        }
                    }, 100);
                };

                observer = new MutationObserver(callback);
                state.bank_observer = observer;
                observer.observe(rucksack, { childList: true, subtree: true, attributes: false });
            }, { signal: state.anti_abuse_controller.signal });

        } else if (pageIsWell()) {
            const btn: HTMLButtonElement | null = document.querySelector('button[data-fetch-method="get"][data-fetch-confirm]');
            btn?.addEventListener('click', (_event: Event) => {
                document.addEventListener('mh-navigation-complete', () => {
                    state.anti_abuse_controller.abort();
                    if (!pageIsWell()) return;
                    const well_item: any = {
                        label: {
                            de: 'Eine weitere Ration erhalten',
                            en: 'Extra ration',
                            es: 'Ración adicional',
                            fr: 'Ration supplémentaire',
                        },
                        img: 'log/well.gif'
                    };
                    getStorageItem(mho_anti_abuse_key).then((stored_values: any) => {
                        if (!stored_values) {
                            stored_values = [];
                        }
                        const counter_value: any = { item: { item: well_item, broken: false }, take_at: Date.now() + 5000 };
                        stored_values.push(counter_value);
                        counter_values.push(counter_value);
                        setStorageItem(mho_anti_abuse_key, stored_values);
                        const new_mho_anti_abuse_counter: Element | null = document.querySelector(`#${mho_anti_abuse_counter_id}`);
                        if (new_mho_anti_abuse_counter) {
                            define_row(counter_value, new_mho_anti_abuse_counter.querySelector('.mho-anti-abuse-counter-content'));
                        }
                    });
                }, { once: true });
            }, { signal: state.anti_abuse_controller.signal });
        } else {
            state.anti_abuse_controller.abort();
        }
    });
}
