import { lang, mh_optimizer_icon, mho_anti_abuse_counter_id, mho_anti_abuse_key, repo_img_hordes_url } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import type { MhoItem } from '../types';
import { getI18N } from '../utils/i18n';
import { getItemFromImg } from '../utils/item-lookup';
import { pageIsBank, pageIsWell } from '../utils/page';
import { getStorageItem, setStorageItem } from '../utils/storage';

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
            const bank_inventory: HTMLElement | null = document.getElementById('bank-inventory');
            const rucksack_id: string | undefined = bank_inventory?.dataset.inventoryAId;
            const bank_id: string | undefined = bank_inventory?.dataset.inventoryBId;

            /** Métadonnées de la requête de transfert (décidées par le clic, jamais le contenu de la réponse serveur) */
            interface ItemTransferDetail {
                from: number;
                to: number;
                direction: string;
            }

            interface TrackedBagItem {
                /** Clé de comparaison stable : `src` brut de l'icône, résolu en `MhoItem` seulement au moment d'enregistrer (le référentiel `state.items` peut ne pas être prêt au premier relevé) */
                img_src: string;
                broken: boolean;
            }

            /** `.locked` n'exclut PAS ici : posée sur TOUT le sac (pas juste les essentiels) tant qu'une requête de transfert est en cours côté jeu (`props.bag.locked`) — l'exclure viderait le sac pendant la fenêtre du contrôle */
            /** Chaque objet du sac perso reste sa propre ligne (`Item::count` toujours à 1) : la fusion en pastille à badge n'existe que banque/bâtiment (`InventoryHandler::forceMoveItem`, jeu) */
            const readTrackedBagItems = (): TrackedBagItem[] => Array.from(
                document.querySelectorAll('#bank-inventory ul.rucksack li.item')
            ).map((element: Element) => ({
                img_src: (element.querySelector('img') as HTMLImageElement | null)?.src ?? '',
                broken: element.classList.contains('broken')
            })).filter((entry: TrackedBagItem): boolean => entry.img_src !== '');

            /** Nombre d'entrées par icône (chaque entrée = un `<li>` séparé, jamais un compte empilé) */
            const sumByImgSrc = (items: TrackedBagItem[]): Map<string, number> => {
                const totals: Map<string, number> = new Map<string, number>();
                items.forEach((item: TrackedBagItem) => totals.set(item.img_src, (totals.get(item.img_src) ?? 0) + 1));
                return totals;
            };

            let known_items: TrackedBagItem[] = readTrackedBagItems();

            /** Liste du sac et données d'affichage (icône/nom, le « vault » du jeu) chargent en ASYNCHRONE indépendant : un objet sans vault se rend en pastille vide sans `<img>` (`<li class="item locked pending"/>`), invisible ici — `vaultUpdate` (`storage: 'items'`) signale une arrivée, on ne renonce qu'après un silence prolongé */
            let last_vault_activity: number = Date.now();
            document.documentElement.addEventListener('vaultUpdate', (event: Event) => {
                const detail: { storage?: string } | undefined = (event as CustomEvent).detail;
                if (detail?.storage === 'items') {
                    last_vault_activity = Date.now();
                }
            }, { signal: state.anti_abuse_controller.signal });

            /** Réessaie tant qu'il reste des `<li>` sans icône résolue et que du vault continue d'arriver (silence max `max_idle_ms` avant d'abandonner) */
            const readSettledBagItems = (onReady: (items: TrackedBagItem[]) => void, max_idle_ms: number = 8000): void => {
                /** Au moins une frame d'attente : le signal déclencheur part avant que React ait committé son rendu */
                requestAnimationFrame(() => {
                    const raw_li_count: number = document.querySelectorAll('#bank-inventory ul.rucksack li.item').length;
                    const current: TrackedBagItem[] = readTrackedBagItems();

                    if (raw_li_count > current.length && (Date.now() - last_vault_activity) < max_idle_ms) {
                        readSettledBagItems(onReady, max_idle_ms);
                        return;
                    }
                    onReady(current);
                });
            };

            /** Objet fictif affiché quand la prise est confirmée mais l'objet réellement pris est ambigu */
            const uncertain_item: MhoItem = { id: -1, img: 'icons/small_warning.gif', label: texts.anti_abuse_uncertain_take } as MhoItem;

            /** Un seul aller-retour de stockage pour toutes les prises du passage : un cycle par objet raterait celles lancées avant qu'une écriture concurrente n'ait committé */
            const recordTakes = (entries: { item: MhoItem, broken: boolean }[]): void => {
                if (entries.length === 0) return;

                getStorageItem(mho_anti_abuse_key).then((stored_values: any) => {
                    if (!stored_values) {
                        stored_values = [];
                    }
                    entries.forEach(({ item, broken }: { item: MhoItem, broken: boolean }) => {
                        const counter_value: any = {
                            item: { item, broken },
                            take_at: Date.now() + 2500
                        };
                        stored_values.push(counter_value);
                        counter_values.push(counter_value);

                        const new_mho_anti_abuse_counter: Element | null = document.querySelector(`#${mho_anti_abuse_counter_id}`);
                        if (new_mho_anti_abuse_counter) {
                            define_row(counter_value, new_mho_anti_abuse_counter.querySelector('.mho-anti-abuse-counter-content'));
                        }
                    });
                    setStorageItem(mho_anti_abuse_key, stored_values);
                });
            };

            /** Regroupe les signaux rapprochés (clics rapides) : évite qu'un second transfert confirmé soit perdu, déjà « consommé » par la vérification du premier */
            let pending_transfer_count: number = 0;
            let check_scheduled: boolean = false;

            /**
             * Établit/resynchronise `known_items`, revérifié une fois stabilisé au cas où un vrai
             * transfert aurait démarré entre-temps (laissé à `scheduleCheck` plutôt que fausser son delta).
             * `expect_mutation` : un dépôt déclenche `sig-inventory-bag-loaded` avant son propre
             * commit React — lire tout de suite garderait l'objet déposé dans la référence.
             */
            const resyncBaseline = (expect_mutation: boolean = false): void => {
                if (pending_transfer_count !== 0 || check_scheduled) return;

                const finish = (): void => {
                    readSettledBagItems((current: TrackedBagItem[]) => {
                        if (pending_transfer_count !== 0 || check_scheduled) return;
                        known_items = current;
                    });
                };

                if (!expect_mutation) {
                    finish();
                    return;
                }

                const rucksack_el: Element | null = document.querySelector('#bank-inventory ul.rucksack');
                let settled: boolean = false;
                const proceed = (): void => {
                    if (settled) return;
                    settled = true;
                    observer.disconnect();
                    clearTimeout(fallback_timer);
                    finish();
                };
                const observer: MutationObserver = new MutationObserver(() => proceed());
                if (rucksack_el) {
                    observer.observe(rucksack_el, { childList: true, subtree: true });
                }
                const fallback_timer: ReturnType<typeof setTimeout> = setTimeout(() => proceed(), 500);
            };
            resyncBaseline();

            const scheduleCheck = (): void => {
                if (check_scheduled) return;
                check_scheduled = true;

                /**
                 * `sig-item-transfer` part avant le commit React (`emitSignal` précède `setInventoryA`)
                 * : un `MutationObserver` attend une mutation RÉELLE du sac plutôt qu'un délai estimé.
                 * Mais ni un dépôt concurrent (retrait sur `ul.rucksack`) ni `#notifications`
                 * (mutée SYNCHRONE par `$.html.message`, souvent avant le sac) ne prouvent que la
                 * prise attendue est arrivée — seul un gain réel vs `known_items` (`hasGainedSomething`,
                 * le test que fait de toute façon `processCheck`) le prouve ; sinon, court répit
                 * (`settle_grace_frames`) puis refus confirmé. Le filet 3s ne sert qu'aux cas hors norme.
                 */
                const settle_grace_frames: number = 5;
                const rucksack_el: Element | null = document.querySelector('#bank-inventory ul.rucksack');
                const notifications_el: Element | null = document.getElementById('notifications');
                let settled: boolean = false;
                let grace_armed: boolean = false;

                /** Un `<li>` de plus qu'au démarrage est un gain probable même si son vault n'a pas résolu (invisible de `readTrackedBagItems`) — `readSettledBagItems` patientera pour l'icône, pas cette fonction */
                const baseline_raw_li_count: number = document.querySelectorAll('#bank-inventory ul.rucksack li.item').length;
                const hasGainedSomething = (): boolean => {
                    const raw_li_count: number = document.querySelectorAll('#bank-inventory ul.rucksack li.item').length;
                    if (raw_li_count > baseline_raw_li_count) return true;

                    const current_totals: Map<string, number> = sumByImgSrc(readTrackedBagItems());
                    const known_totals: Map<string, number> = sumByImgSrc(known_items);
                    for (const [img_src, count] of current_totals) {
                        if (count > (known_totals.get(img_src) ?? 0)) return true;
                    }
                    return false;
                };

                const proceed = (reason: string): void => {
                    if (settled) return;
                    settled = true;
                    observer.disconnect();
                    clearTimeout(fallback_timer);

                    readSettledBagItems(processCheck);
                };

                const armGrace = (): void => {
                    if (grace_armed) return;
                    grace_armed = true;
                    let frames_left: number = settle_grace_frames;
                    const tick = (): void => {
                        if (settled) return;
                        if (hasGainedSomething()) {
                            proceed('grace-gain');
                            return;
                        }
                        if (frames_left <= 0) {
                            proceed('grace-exhausted');
                            return;
                        }
                        frames_left--;
                        requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                };

                const observer: MutationObserver = new MutationObserver(() => {
                    if (hasGainedSomething()) {
                        proceed('mutation-gain');
                    } else {
                        armGrace();
                    }
                });
                if (rucksack_el) {
                    observer.observe(rucksack_el, { childList: true, subtree: true });
                }
                if (notifications_el) {
                    observer.observe(notifications_el, { childList: true });
                }
                const fallback_timer: ReturnType<typeof setTimeout> = setTimeout(() => proceed('fallback-3s'), 3000);

                /** `confirmed_transfers` n'est capturé qu'une fois stabilisé : un signal arrivant pendant l'attente doit rester compté, pas perdu par une capture trop tôt */
                const processCheck = (current_items: TrackedBagItem[]): void => {
                    const confirmed_transfers: number = pending_transfer_count;
                    pending_transfer_count = 0;

                    /** Diff par nombre d'entrées par icône (deux objets identiques = deux `<li>` séparés) ; résolution en `MhoItem` seulement une fois qu'il y a bien quelque chose à enregistrer */
                    const known_totals: Map<string, number> = sumByImgSrc(known_items);
                    const current_totals: Map<string, number> = sumByImgSrc(current_items);

                    const newly_appeared: { item: MhoItem, broken: boolean }[] = [];
                    let newly_appeared_total: number = 0;
                    current_totals.forEach((current_count: number, img_src: string) => {
                        const delta: number = current_count - (known_totals.get(img_src) ?? 0);
                        if (delta > 0) {
                            newly_appeared_total += delta;
                            const resolved: MhoItem | undefined = getItemFromImg(img_src);
                            const broken: boolean = current_items.find((item: TrackedBagItem) => item.img_src === img_src)?.broken ?? false;
                            for (let i: number = 0; i < delta; i++) {
                                newly_appeared.push(
                                    resolved
                                        ? { item: resolved, broken }
                                        : { item: uncertain_item, broken: false }
                                );
                            }
                        }
                    });

                    /** Un signal confirmé prouve une tentative, pas un succès — au-delà du nombre confirmé, impossible de savoir lesquels sont réels : on compte des prises incertaines plutôt que sous-estimer la limite */
                    if (newly_appeared_total <= confirmed_transfers) {
                        recordTakes(newly_appeared);
                    } else {
                        recordTakes(Array.from({ length: confirmed_transfers }, () => ({ item: uncertain_item, broken: false })));
                    }
                    known_items = current_items;
                    /** `resyncBaseline` reste exclu tant que ce contrôle n'est pas terminé, sous peine de resynchroniser sur un état intermédiaire */
                    check_scheduled = false;
                };
            };

            /** `sig-item-transfer` (module Signal du jeu) : sert seulement à savoir QUAND revérifier, jamais à lire le contenu de la réponse serveur */
            document.documentElement.addEventListener('sig-item-transfer', (event: Event) => {
                const detail: ItemTransferDetail | undefined = (event as CustomEvent).detail;
                if (!detail || detail.direction !== 'up' || String(detail.from) !== bank_id || String(detail.to) !== rucksack_id) return;

                pending_transfer_count++;
                scheduleCheck();
            }, { signal: state.anti_abuse_controller.signal });

            /** `sig-inventory-bag-loaded` : resynchronise `known_items` hors prise en cours (émis pour dépôt ET prise) — `expect_mutation: true` attend le retrait réel avant de lire */
            document.documentElement.addEventListener('sig-inventory-bag-loaded', (event: Event) => {
                const detail: { id: number } | undefined = (event as CustomEvent).detail;
                if (!detail || String(detail.id) !== rucksack_id) return;
                resyncBaseline(true);
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
