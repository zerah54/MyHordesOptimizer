import {
    lang,
    mh_optimizer_icon,
    mho_anti_abuse_counter_id,
    mho_anti_abuse_key,
    repo_img_hordes_url
} from '../config/constants';
import {texts} from '../i18n/texts';
import {state} from '../state';
import {getI18N} from '../utils/i18n';
import {getItemFromImg} from '../utils/item-lookup';
import {pageIsBank, pageIsWell} from '../utils/page';
import {getStorageItem, setStorageItem} from '../utils/storage';

// Local helper: TypeScript's arrFrom(any) sometimes infers element type
// 'unknown' rather than 'any' when the source isn't a statically-typed
// iterable. This explicit-any wrapper avoids that, matching the original
// untyped JS behaviour (no behaviour change, pure typing aid).
const arrFrom = (x: any): any[] => Array.from(x);


export function displayAntiAbuseCounter() {
    if (state.anti_abuse_controller) {
        // anti_abuse_controller.abort();
    }
    state.anti_abuse_controller = new AbortController();
    if (state.mho_parameters.display_anti_abuse && (pageIsBank() || pageIsWell())) {
        let mho_anti_abuse_counter = document.querySelector(`#${mho_anti_abuse_counter_id}`);
        if (mho_anti_abuse_counter) return;
        mho_anti_abuse_counter = document.createElement('div');
        mho_anti_abuse_counter.id = mho_anti_abuse_counter_id;
        mho_anti_abuse_counter.style.marginBottom = '0.5em';
        if (pageIsBank()) {
            let forum_preview = document.querySelector('.forum-preview-wrapper-bank');
            if (!forum_preview) return;
            forum_preview.parentElement.insertBefore(mho_anti_abuse_counter, forum_preview.parentElement.firstElementChild);
        } else {
            let actions_box = document.querySelector('.actions-box');
            if (!actions_box) return;
            actions_box.parentElement.insertBefore(mho_anti_abuse_counter, actions_box);
        }

        let header = document.createElement('h5');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        mho_anti_abuse_counter.appendChild(header);

        let first_part = document.createElement('div');
        first_part.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 24px !important; vertical-align: middle; margin-right: 0.5em;">${getI18N(texts.anti_abuse_title)}`;
        header.appendChild(first_part);

        let second_part = document.createElement('div');
        header.appendChild(second_part);

        let content = document.createElement('div');
        content.classList.add('content');
        content.style.borderBottom = '1px solid #ddab76';
        mho_anti_abuse_counter.appendChild(content);

        /** Modifie le style du forum pour pouvoir l'afficher proprement malgré la présence du compteur */
        let forum_preview_wrapper_bank = document.querySelector('.forum-preview-wrapper-bank');
        if (forum_preview_wrapper_bank) {
            forum_preview_wrapper_bank.style.minHeight = 'unset';

            let forum_preview_container = forum_preview_wrapper_bank.querySelector('.forum-preview-container');
            if (forum_preview_container) {
                forum_preview_container.style.position = 'initial';
                forum_preview_container.style.padding = '3px';

                let forum_content = forum_preview_container.querySelector('#forum-content');
                if (forum_content) {
                    forum_content.style.position = 'initial';
                }
            }
        }
        /** Fin */

        getStorageItem(mho_anti_abuse_key).then((counter_values: any) => {
            let add_counter_btn = document.createElement('button');
            add_counter_btn.innerText = '+';
            second_part.appendChild(add_counter_btn);
            add_counter_btn.addEventListener('click', () => {
                state.anti_abuse_controller.abort();
                let fictive_item = {
                    label: {
                        de: `Benutzerdefinierter Zähler`,
                        en: `Custom counter`,
                        es: `Contador personalizado`,
                        fr: `Compteur personnalisé`,
                    },
                    img: 'icons/small_warning.gif'
                }
                if (!counter_values) {
                    counter_values = [];
                }
                let counter_value = {item: {item: fictive_item, broken: false}, take_at: Date.now() + 5000};
                counter_values.push(counter_value);
                setStorageItem(mho_anti_abuse_key, counter_values);
                let new_mho_anti_abuse_counter = document.querySelector(`#${mho_anti_abuse_counter_id}`);
                if (new_mho_anti_abuse_counter) {
                    let new_content = new_mho_anti_abuse_counter.querySelector('.content');
                    define_row(counter_value, counter_values.length - 1, new_content, true);
                }
            })

            let define_row = (counter_value: any, index: any, new_content: any, fictive: boolean = false) => {
                let is_time_invalid = (_counter_value, _index) => {
                    let since = (Date.now() - parseInt(_counter_value.take_at))
                    let time_left = new Date(((15) * 60000) - since);
                    if ((time_left as any) < 0) {
                        counter_values.splice(index, 1);
                        setStorageItem(mho_anti_abuse_key, [...counter_values]);
                    }
                    return (time_left as any) < 0;
                };
                if (!is_time_invalid(counter_value, index)) {
                    let value_in_list = document.createElement('div');
                    value_in_list.style.display = 'flex';
                    value_in_list.style.gap = '0.5em';
                    new_content.appendChild(value_in_list);

                    let item_name = document.createElement('div');
                    item_name.style.flex = (1) as any;
                    item_name.innerHTML = `<img src="${repo_img_hordes_url + counter_value.item?.item?.img}" style="margin-right: 0.5em; ${counter_value.item?.broken ? 'border: 1px dotted red' : ''}">${counter_value.item?.item?.label[lang]}`;
                    value_in_list.appendChild(item_name);

                    let item_counter = document.createElement('div');
                    item_counter.style.width = '50px';
                    let interval = setInterval(() => {
                        let since = (Date.now() - parseInt(counter_value.take_at))
                        let time_left = new Date(((15) * 60000) - since);
                        if (is_time_invalid(counter_value, index)) {
                            clearInterval(interval);
                            if (value_in_list) {
                                value_in_list.remove();
                            }
                        } else {
                            let minute = time_left.getMinutes();
                            let seconds = time_left.getSeconds();
                            item_counter.innerText = minute + ':' + (seconds < 10 ? ('0' + seconds) : seconds);
                        }
                    }, 250);
                    value_in_list.appendChild(item_counter);
                }
            }

            if (!counter_values) {
                counter_values = [];
            }
            counter_values.forEach((counter_value, index) => {
                define_row(counter_value, index, content);
            });

            if (pageIsBank()) {

                // Selectionne le noeud dont les mutations seront observées
                let bank = document.querySelector('#bank-inventory');
                let old_bag;

                bank.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (event.srcElement.nodeName.toLowerCase() !== 'li' && event.srcElement.nodeName.toLowerCase() !== 'span' && event.srcElement.nodeName.toLowerCase() !== 'img') return;
                    if (event.srcElement.className !== '' && event.srcElement.className !== 'item' && event.srcElement.className !== 'item-icon') return;

                    let rucksack = document.querySelector('#bank-inventory ul.rucksack');

                    old_bag = document.querySelectorAll('#bank-inventory ul.rucksack li.item');

                    let callback = (mutationsList) => {

                        // if (!pageIsBank()) {
                        state.bank_observer?.disconnect();
                        // return;
                        // }

                        setTimeout(() => {

                            let new_bag = document.querySelectorAll('#bank-inventory ul.rucksack li.item');

                            if (old_bag?.length < new_bag?.length) {
                                getStorageItem(mho_anti_abuse_key).then((counter_values: any) => {
                                    if (!counter_values) {
                                        counter_values = [];
                                    }
                                    let old_bag_items = arrFrom(old_bag).map((item_in_old_bag) => getItemFromImg(item_in_old_bag.querySelector('img').src));
                                    let new_bag_items = arrFrom(new_bag).map((item_in_new_bag) => getItemFromImg(item_in_new_bag.querySelector('img').src));
                                    new_bag_items.forEach((new_bag_item, index) => {
                                        let old_bag_item_index = old_bag_items.findIndex((old_bag_item) => old_bag_item.id === new_bag_item.id)
                                        if (old_bag_item_index > -1) {
                                            old_bag_items.splice(old_bag_item_index, 1);
                                        } else {
                                            let counter_value = {
                                                item: {
                                                    item: new_bag_item,
                                                    broken: new_bag[index].classList.contains('broken')
                                                },
                                                take_at: Date.now() + 2500
                                            };
                                            counter_values.push(counter_value);

                                            let new_mho_anti_abuse_counter = document.querySelector(`#${mho_anti_abuse_counter_id}`);
                                            if (new_mho_anti_abuse_counter) {
                                                let new_content = new_mho_anti_abuse_counter.querySelector('.content');
                                                define_row(counter_value, counter_values.length - 1, new_content);
                                            }
                                        }
                                    });

                                    setStorageItem(mho_anti_abuse_key, counter_values);
                                })
                            } else {
                                new_bag = undefined;
                            }

                            setTimeout(() => {
                                old_bag = new_bag;
                            }, 0);
                        }, 100);

                        state.bank_observer?.disconnect();
                    }

                    // Options de l'observateur (quelles sont les mutations à observer)
                    let config = {childList: true, subtree: true, attributes: false};
                    // Créé une instance de l'observateur lié à la fonction de callback
                    state.bank_observer = new MutationObserver(callback);
                    // Commence à observer le noeud cible pour les mutations précédemment configurées
                    state.bank_observer.observe(rucksack, config);
                }, {signal: state.anti_abuse_controller.signal});
            } else if (pageIsWell()) {
                let btn = document.querySelector('button[data-fetch-method="get"][data-fetch-confirm]');
                btn?.addEventListener('click', (event) => {
                    document.addEventListener('mh-navigation-complete', () => {
                        state.anti_abuse_controller.abort();
                        if (!pageIsWell()) return;
                        let well_item = {
                            label: {
                                de: `Eine weitere Ration erhalten`,
                                en: `Extra ration`,
                                es: `Ración adicional`,
                                fr: `Ration supplémentaire`,
                            },
                            img: 'log/well.gif'
                        }
                        getStorageItem(mho_anti_abuse_key).then((counter_values: any) => {
                            if (!counter_values) {
                                counter_values = [];
                            }
                            let counter_value = {item: {item: well_item, broken: false}, take_at: Date.now() + 5000}
                            counter_values.push(counter_value);
                            setStorageItem(mho_anti_abuse_key, counter_values);
                            let new_mho_anti_abuse_counter = document.querySelector(`#${mho_anti_abuse_counter_id}`);
                            if (new_mho_anti_abuse_counter) {
                                let new_content = new_mho_anti_abuse_counter.querySelector('.content');
                                define_row(counter_value, counter_values.length - 1, new_content);
                            }
                        })
                    }, {once: true});
                }, {signal: state.anti_abuse_controller.signal})
            } else {
                state.anti_abuse_controller.abort();
            }
        });
    } else {
        state.anti_abuse_controller.abort();
    }
}
