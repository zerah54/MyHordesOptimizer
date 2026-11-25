import { getTranslation } from '../api/translation';
import { lang, mho_display_translate_input_id, mho_header_space_id, repo_img_hordes_url, supported_languages } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { createSelectWithSearch } from '../utils/dom';
import { getI18N } from '../utils/i18n';
import { copyToClipboard } from '../utils/misc';
import { createHeaderButton, getHeaderButtonsContainer } from './header-space';

export const mho_translate_button_id: string = 'mho-translate-button';

/** Affiche l'outil de traduction : un bouton du cadre MHO qui ouvre un panneau de recherche sous l'en-tête. */
export function displayTranslateTool() {
    /** On doit laisser l'interval tourner quand l'option est activée, sinon l'input est supprimé lors de changements de page dans l'application */
    const display_translate_input = document.getElementById(mho_display_translate_input_id);
    const translate_button: HTMLElement | null = document.getElementById(mho_translate_button_id);
    if (state.mho_parameters.display_translate_tool) {
        if (display_translate_input && translate_button) return;
        display_translate_input?.remove();
        translate_button?.remove();

        const mho_header_space = document.getElementById(mho_header_space_id);
        const buttons_container: HTMLElement | null = getHeaderButtonsContainer();
        if (!mho_header_space || !buttons_container) return;

        const mho_display_translate_input_div = createSelectWithSearch();
        mho_display_translate_input_div.id = mho_display_translate_input_id;
        mho_display_translate_input_div.classList.add('hidden');
        mho_display_translate_input_div.tabIndex = -1;
        const label = mho_display_translate_input_div.firstElementChild;
        label.setAttribute('style', 'display: flex; align-items: stretch; position: relative; margin: 0;');

        const input = label.firstElementChild;
        input.setAttribute('style', 'flex: 1; min-width: 0; margin: 0; padding-right: 20px; box-sizing: border-box;');
        label.lastElementChild.setAttribute('style', 'position: absolute; right: 4px; top: 50%; transform: translateY(-50%); line-height: 1; color: #5c2b20; cursor: pointer;');

        const select = document.createElement('select');
        select.classList.add('small');
        select.setAttribute('style', 'width: 40px; margin: 0; font-size: 12px; outline: unset; box-sizing: border-box;');
        select.value = lang;

        supported_languages.forEach((language) => {
            const option = document.createElement('option');
            option.value = language.value;
            option.setAttribute('style', 'font-size: 16px');
            option.innerText = language.img;
            option.selected = language.value === lang;
            select.appendChild(option);
        });

        label.insertBefore(select, input);

        const block_to_display = mho_display_translate_input_div.lastElementChild;
        block_to_display.setAttribute('style', 'color: #ddab76; max-height: 50vh; overflow: auto;');
        input.addEventListener('keyup', (event) => {
            const temp_input = input.value.replace(/\W*/gm, '');
            if (temp_input.length > 2) {
                getTranslation(input.value, select.value).then((response) => {

                    block_to_display.innerHTML = '';
                    let show_exact_match = response.translations.some((translation) => translation.key.isExactMatch);

                    if (show_exact_match) {
                        const display_all = document.createElement('div');
                        display_all.setAttribute('style', 'padding: 4px; border-bottom: 1px solid; cursor: pointer');
                        const display_all_img = document.createElement('img');
                        display_all_img.src = `${repo_img_hordes_url}/icons/small_more.gif`;
                        display_all_img.setAttribute('style', 'margin-right: 8px');

                        const display_all_text = document.createElement('text');
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
                            const not_exact = Array.from(block_to_display.getElementsByClassName('not-exact') || []);
                            not_exact.forEach((not_exact_item) => {
                                not_exact_item.classList.toggle('hidden');
                            });
                        });
                    }
                    response.translations
                        .forEach((translation) => {
                            if (response.translations.length > 1) {
                                const context_div = document.createElement('div');
                                context_div.setAttribute('style', 'text-align: center; padding: 4px; font-variant: small-caps; font-size: 14px;');
                                context_div.innerHTML = getI18N(texts.translation_file_context) + ` <img src="${repo_img_hordes_url}/emotes/arrowright.gif"> ` + translation.key.context;
                                if (!translation.key.isExactMatch && show_exact_match) {
                                    context_div.classList.add('not-exact', 'hidden');
                                }
                                block_to_display.appendChild(context_div);
                            }
                            let key_index = 0;
                            for (const lang_key in translation.value) {
                                const lang = translation.value[lang_key];
                                lang.forEach((result) => {
                                    const content_div = document.createElement('div');
                                    const img = document.createElement('img');
                                    img.src = `${repo_img_hordes_url}/lang/${lang_key}.png`;
                                    img.setAttribute('style', 'margin-right: 8px');

                                    const button_div = document.createElement('div');
                                    const button = document.createElement('button');
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
        const button: HTMLDivElement = createHeaderButton(mho_translate_button_id, `${repo_img_hordes_url}/lang/${lang}.png`, getI18N(texts.translate_bar));
        // Garde le focus dans le panneau : le clic sur le bouton ne déclenche pas le focusout qui le refermerait.
        button.addEventListener('mousedown', (event: MouseEvent) => event.preventDefault());
        button.addEventListener('click', () => {
            const opening: boolean = mho_display_translate_input_div.classList.toggle('hidden') === false;
            if (opening) (input as HTMLInputElement).focus();
        });
        mho_display_translate_input_div.addEventListener('focusout', (event: FocusEvent) => {
            if (!mho_display_translate_input_div.contains(event.relatedTarget as Node | null)) {
                mho_display_translate_input_div.classList.add('hidden');
            }
        });

        buttons_container.appendChild(button);
        mho_header_space.appendChild(mho_display_translate_input_div);
    } else {
        display_translate_input?.remove();
        translate_button?.remove();
    }
}
