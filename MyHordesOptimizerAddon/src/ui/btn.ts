import {btn_id, content_btn_id, mh_content_id, mh_optimizer_icon, repo_img_hordes_url} from '../config/constants';
import {informations} from '../data/informations';
import {texts} from '../i18n/texts';
import {state} from '../state';
import {createParams} from './params';
import {displayWindow} from './window';
import {getI18N} from '../utils/i18n';
import {isTouchScreen} from '../utils/misc';
import {buttonOptimizerElement} from '../utils/page';
import {getScriptInfo, isScriptVersionLastVersion, toggleNewChangelog} from '../utils/version';

/** Create Optimize button */

export function createOptimizerBtn() {
    const apps_exists_callback = function (appsExistsMutationsList, observer) {
        for (const appsExistsMutation of appsExistsMutationsList) {
            let apps_block = document.querySelector('.app-directory');
            if (appsExistsMutation.type === 'childList' && apps_block) {

                let optimizer_btn = buttonOptimizerElement();
                if (!optimizer_btn) {
                    let content_zone = document.getElementById(mh_content_id);
                    let img = document.createElement('img');
                    let annuary = apps_block.querySelector('img');
                    img.src = mh_optimizer_icon;
                    img.setAttribute('height', annuary && annuary.height ? annuary.height + 'px' : '16px');
                    img.setAttribute('width', annuary && annuary.width ? annuary.width + 'px' : '16px');
                    img.style.margin = '1px 0 2px';

                    let title_hidden = document.createElement('span');
                    title_hidden.classList.add('label_text');
                    title_hidden.innerText = getScriptInfo().name;

                    let title = document.createElement('h1');

                    let title_first_part = document.createElement('div');
                    title_first_part.style.display = 'flex';
                    title_first_part.style.alignItems = 'center';
                    title.appendChild(title_first_part);

                    let title_second_part = document.createElement('div');
                    title_second_part.style.display = 'flex';
                    title_second_part.style.alignItems = 'center';
                    title_second_part.style.gap = '0.5em';
                    title.appendChild(title_second_part);

                    let website_link = document.createElement('a');
                    website_link.innerHTML = `<img src="${repo_img_hordes_url}icons/small_world.gif" style="vertical-align: top; margin-right: 0.25em;">${getI18N(texts.website)}`;
                    website_link.href = state.website;
                    website_link.target = '_blank';
                    website_link.style.cursor = 'pointer';

                    title_second_part.appendChild(website_link);

                    title_first_part.appendChild(img);
                    title_first_part.appendChild(title_hidden);

                    let mhe_button = document.querySelector('#mhe_button');
                    let left_position = mhe_button ? (mhe_button.offsetLeft + mhe_button.offsetWidth + 5) : apps_block?.getBoundingClientRect().width + (annuary && annuary.height ? annuary.height : 34);

                    optimizer_btn = document.createElement('div');
                    optimizer_btn.id = btn_id;
                    optimizer_btn.setAttribute('style', 'left: ' + left_position + 'px');
                    optimizer_btn.appendChild(title);
                    optimizer_btn.addEventListener('click', (event) => {
                        event.stopPropagation();
                    });

                    if (isTouchScreen()) {
                        let close_link = document.createElement('img');
                        close_link.src = `${repo_img_hordes_url}icons/b_close.png`;
                        close_link.classList.add('close');
                        title_second_part.appendChild(close_link);

                        close_link.addEventListener('click', () => {
                            optimizer_btn.classList.remove('mho-btn-opened');
                        });

                        optimizer_btn.addEventListener('mouseover', () => {
                            optimizer_btn.classList.add('mho-btn-opened');
                        });

                        optimizer_btn.addEventListener('mouseout', () => {
                            optimizer_btn.classList.remove('mho-btn-opened');
                        });
                    } else {
                        optimizer_btn.addEventListener('mouseenter', () => {
                            optimizer_btn.classList.add('mho-btn-opened');
                        });

                        optimizer_btn.addEventListener('mouseleave', () => {
                            optimizer_btn.classList.remove('mho-btn-opened');
                        });
                    }
                    content_zone.appendChild(optimizer_btn);

                    let mho_content_zone = document.createElement('div');
                    mho_content_zone.id = content_btn_id;
                    content_zone.appendChild(mho_content_zone);

                    createOptimizerButtonContent();
                }
            }
        }
    };

    const apps_exists_observer = new MutationObserver(apps_exists_callback);

    const mh_content = document.querySelector('#content'); // ou un autre élément parent approprié
    const apps_exists_config = {childList: true, subtree: false, attributes: false};
    apps_exists_observer.observe(mh_content, apps_exists_config);
}

/** Crée le contenu du bouton de l'optimizer (bouton de wiki, bouton de configuration, etc) */

export function createOptimizerButtonContent() {
    let optimizer_btn = buttonOptimizerElement();
    let content = document.getElementById(content_btn_id);
    content.innerHTML = '';
    optimizer_btn.appendChild(content);

    if (state.external_app_id) {
        /////////////////////
        // SECTION BOUTONS //
        /////////////////////

        let btn_content = document.createElement('div');
        btn_content.style.display = 'flex';
        btn_content.style.gap = '0.5em';
        btn_content.style.alignItems = 'center';
        content.appendChild(btn_content);

        let wiki_btn = document.createElement('a');
        wiki_btn.classList.add('button', 'mho-parameters-btn');
        wiki_btn.innerText = 'Wiki';
        wiki_btn.addEventListener('click', () => {
            displayWindow('wiki');
        });

        btn_content.appendChild(wiki_btn);

        let tools_btn = document.createElement('a');
        tools_btn.classList.add('button', 'mho-parameters-btn');
        tools_btn.innerText = getI18N(texts.tools_btn_label);
        tools_btn.addEventListener('click', () => {
            displayWindow('tools');
        });

        btn_content.appendChild(tools_btn);

        ////////////////////////
        // SECTION PARAMETRES //
        ////////////////////////

        createParams(content);

        //////////////////////////
        // SECTION INFORMATIONS //
        //////////////////////////

        let informations_title = document.createElement('h5');
        informations_title.innerText = getI18N(texts.informations_section_label);

        let informations_list = document.createElement('ul');

        let informations_container = document.createElement('div');
        informations_container.id = 'informations';

        informations_container.appendChild(informations_title);
        informations_container.appendChild(informations_list);

        informations.forEach((information) => {
            let information_link = document.createElement('a');
            information_link.id = information.id;
            information_link.innerHTML = (information.img ? `<img src="${information.img.startsWith('http') ? information.img : repo_img_hordes_url + information.img}" style="margin: 0 4px 0 3px; width: 16px">` : ``) + `<span class=small>${getI18N(information.label)}</span>`;
            information_link.href = information.src;
            information_link.target = '_blank';

            if (!information.src) {
                information_link.addEventListener('click', (event) => {
                    event.preventDefault();
                    information.action();
                });
            }

            let information_container = document.createElement('li');
            information_container.appendChild(information_link);

            informations_list.appendChild(information_container);
            if (information.display && !information.display()) {
                information_container.classList.add('mho-hidden');
            }
        });

        content.appendChild(informations_container);
        toggleNewChangelog(state.has_new_changelog);
        isScriptVersionLastVersion();

    } else {
        let no_external_app_id = document.createElement('div');
        no_external_app_id.innerHTML = getI18N(texts.external_app_id_help);
        content.appendChild(no_external_app_id);
    }
}
