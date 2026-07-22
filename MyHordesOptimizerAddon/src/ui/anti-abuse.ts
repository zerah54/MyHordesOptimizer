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


export function displayAntiAbuseCounter(): void {
    if (state.anti_abuse_controller) {
        // anti_abuse_controller.abort();
    }
    state.anti_abuse_controller = new AbortController();

    if (!state.mho_parameters.display_anti_abuse || (!pageIsBank() && !pageIsWell())) {
        state.anti_abuse_controller.abort();
        return;
    }

    let mho_anti_abuse_counter: Element | null = document.querySelector(`#${mho_anti_abuse_counter_id}`);
    if (mho_anti_abuse_counter) return;

    mho_anti_abuse_counter = document.createElement('div');
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
            if (!forum_preview) return;
            forum_preview.parentElement!.insertBefore(mho_anti_abuse_counter, forum_preview.parentElement!.firstElementChild);
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

    /** Modifie le style du forum pour pouvoir l'afficher proprement malgré la présence du compteur */
    const forum_preview_wrapper_bank: HTMLElement | null = document.querySelector('.forum-preview-wrapper-bank');
    if (forum_preview_wrapper_bank) {
        forum_preview_wrapper_bank.style.minHeight = 'unset';

        const forum_preview_container: HTMLElement | null = forum_preview_wrapper_bank.querySelector('.forum-preview-container');
        if (forum_preview_container) {
            forum_preview_container.style.position = 'initial';
            forum_preview_container.style.padding = '3px';

            const forum_content: HTMLElement | null = forum_preview_container.querySelector('#forum-content');
            if (forum_content) {
                forum_content.style.position = 'initial';
            }
        }
    }
    /** Fin */

    getStorageItem(mho_anti_abuse_key).then((counter_values: any) => {
        if (!counter_values) {
            counter_values = [];
        }

        const define_row = (counter_value: any, new_content: Element | null, fictive: boolean = false): void => {
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

            if (!is_time_invalid(counter_value)) {
                const value_in_list: HTMLElement = document.createElement('div');
                value_in_list.title = counter_value.item?.item?.label[lang];
                value_in_list.classList.add('brown-tag');
                value_in_list.style.width = '85px';
                new_content!.appendChild(value_in_list);

                const item_name: HTMLElement = document.createElement('div');
                item_name.innerHTML = `<img src="${repo_img_hordes_url + counter_value.item?.item?.img}" style="${counter_value.item?.broken ? 'border: 1px dotted red' : ''}">`;
                value_in_list.appendChild(item_name);

                const item_counter: HTMLElement = document.createElement('div');

                const interval: ReturnType<typeof setInterval> = setInterval(() => {
                    if (is_time_invalid(counter_value)) {
                        clearInterval(interval);
                        value_in_list.remove();
                    } else {
                        const since: number = Date.now() - parseInt(counter_value.take_at);
                        const time_left: number = (15 * 60000) - since;
                        const minutes: number = Math.floor(time_left / 60000);
                        const seconds: number = Math.floor((time_left % 60000) / 1000);
                        item_counter.innerText = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
                    }
                }, 250);
                value_in_list.appendChild(item_counter);
            }
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
