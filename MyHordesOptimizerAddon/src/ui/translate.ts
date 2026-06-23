import {getTranslation} from '../api/translation';
import {
    lang,
    mh_optimizer_icon,
    mho_display_translate_input_id,
    mho_header_space_id,
    repo_img_hordes_url,
    supported_languages
} from '../config/constants';
import {texts} from '../i18n/texts';
import {state} from '../state';
import {createSelectWithSearch} from '../utils/dom';
import {getI18N} from '../utils/i18n';
import {copyToClipboard} from '../utils/misc';

export function displayTranslateTool() {
    /** On doit laisser l'interval tourner quand l'option est activée, sinon l'input est supprimé lors de changements de page dans l'application */
    let display_translate_input = document.getElementById(mho_display_translate_input_id);
    if (state.mho_parameters.display_translate_tool) {
        if (display_translate_input) return;

        const mho_header_space = document.getElementById(mho_header_space_id);
        if (!mho_header_space) return;

        let mho_display_translate_input_div = createSelectWithSearch();
        mho_display_translate_input_div.id = mho_display_translate_input_id;
        mho_display_translate_input_div.setAttribute('style', 'margin: 0; width: 200px; height: 22px;');
        let label = mho_display_translate_input_div.firstElementChild;

        let input = label.firstElementChild;
        input.setAttribute('style', 'width: calc(100% - 35px); display: inline-block; padding-right: 40px; height: 22px');

        let btn_mho_img = document.createElement('img');
        btn_mho_img.src = mh_optimizer_icon;
        btn_mho_img.style.height = '22px';
        btn_mho_img.style.float = 'right';
        btn_mho_img.style.position = 'relative';
        btn_mho_img.style.top = '-22px';
        label.insertBefore(btn_mho_img, label.lastElementChild);

        let select = document.createElement('select');
        select.classList.add('small');
        select.setAttribute('style', 'height: 22px; width: 35px; font-size: 12px; outline: unset');
        select.value = lang;

        supported_languages.forEach((language) => {
            let option = document.createElement('option');
            option.value = language.value;
            option.setAttribute('style', 'font-size: 16px');
            option.innerText = language.img;
            option.selected = language.value === lang;
            select.appendChild(option);
        })

        label.insertBefore(select, input);

        let block_to_display = mho_display_translate_input_div.lastElementChild;
        block_to_display.setAttribute('style', 'float: right; z-index: 10; position: absolute; right: 0; min-width: 350px; background: #5c2b20; border: 1px solid #ddab76; box-shadow: 0 0 3px #000; outline: 1px solid #000; color: #ddab76; max-height: 50vh; overflow: auto;');
        input.addEventListener('keyup', (event) => {
            let temp_input = input.value.replace(/\W*/gm, '');
            if (temp_input.length > 2) {
                getTranslation(input.value, select.value).then((response) => {

                    block_to_display.innerHTML = '';
                    let show_exact_match = response.translations.some((translation) => translation.key.isExactMatch);

                    if (show_exact_match) {
                        let display_all = document.createElement('div');
                        display_all.setAttribute('style', 'padding: 4px; border-bottom: 1px solid; cursor: pointer');
                        let display_all_img = document.createElement('img');
                        display_all_img.src = `${repo_img_hordes_url}/icons/small_more.gif`;
                        display_all_img.setAttribute('style', 'margin-right: 8px');

                        let display_all_text = document.createElement('text');
                        display_all_text.innerText = getI18N(texts.display_all_search_result);

                        display_all.appendChild(display_all_img);
                        display_all.appendChild(display_all_text);
                        block_to_display.appendChild(display_all);

                        display_all.addEventListener('click', () => {
                            show_exact_match = !show_exact_match;
                            if (show_exact_match) {
                                display_all_img.src = `${repo_img_hordes_url}/icons/small_more.gif`;
                                display_all_text.innerText = getI18N(texts.display_all_search_result);
                            } else {
                                display_all_img.src = `${repo_img_hordes_url}/icons/small_less.gif`;
                                display_all_text.innerText = getI18N(texts.display_exact_search_result);
                            }
                            let not_exact = Array.from(block_to_display.getElementsByClassName('not-exact') || []);
                            not_exact.forEach((not_exact_item) => {
                                not_exact_item.classList.toggle('hidden');
                            })
                        });
                    }
                    response.translations
                        .forEach((translation) => {
                            if (response.translations.length > 1) {
                                let context_div = document.createElement('div');
                                context_div.setAttribute('style', 'text-align: center; padding: 4px; font-variant: small-caps; font-size: 14px;');
                                context_div.innerHTML = getI18N(texts.translation_file_context) + ` <img src="${repo_img_hordes_url}/emotes/arrowright.gif"> ` + translation.key.context;
                                if (!translation.key.isExactMatch && show_exact_match) {
                                    context_div.classList.add('not-exact', 'hidden');
                                }
                                block_to_display.appendChild(context_div);
                            }
                            let key_index = 0;
                            for (let lang_key in translation.value) {
                                let lang = translation.value[lang_key];
                                lang.forEach((result) => {
                                    let content_div = document.createElement('div');
                                    let img = document.createElement('img');
                                    img.src = `${repo_img_hordes_url}/lang/${lang_key}.png`
                                    img.setAttribute('style', 'margin-right: 8px');

                                    let button_div = document.createElement('div');
                                    let button = document.createElement('button');
                                    button_div.appendChild(button);
                                    button.innerHTML = '&#10697';
                                    button.setAttribute('style', 'font-size: 16px');
                                    button.addEventListener('click', () => {
                                        copyToClipboard(result);
                                    });
                                    content_div.setAttribute('style', 'display: flex; justify-content: space-between; padding: 6px;');

                                    if (key_index === Object.keys(translation.value).length - 1) {
                                        content_div.setAttribute('style', 'display: flex; justify-content: space-between; padding: 6px; border-bottom: 1px solid;');
                                    }
                                    content_div.innerHTML = `<div>${img.outerHTML}${result}</div>`;
                                    content_div.appendChild(button_div);

                                    if (!translation.key.isExactMatch && show_exact_match) {
                                        content_div.classList.add('not-exact', 'hidden');
                                    }
                                    block_to_display.appendChild(content_div);
                                });
                                key_index++;
                            }
                        });
                });
            }
        });
        mho_header_space.insertBefore(mho_display_translate_input_div, mho_header_space.firstChild)
    } else if (display_translate_input) {
        display_translate_input.remove();
    }
}
