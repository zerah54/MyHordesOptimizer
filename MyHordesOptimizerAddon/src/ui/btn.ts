import { btn_id, content_btn_id, mh_content_id, mh_optimizer_icon, repo_img_hordes_url } from '../config/constants';
import { informations } from '../data/informations';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { isTouchScreen } from '../utils/misc';
import { buttonOptimizerElement } from '../utils/page';
import { getScriptInfo, isScriptVersionLastVersion, toggleNewChangelog } from '../utils/version';
import { createParams } from './params';
import { displayWindow } from './window';

/** Espace laissé entre le dernier bloc du bandeau et le bouton */
const btn_left_margin: number = 10;

/**
 * Place le bouton après le DERNIER bloc du bandeau du jeu.
 *
 * Le bandeau en compte plusieurs (`.header-directory`) : l'annuaire d'applications
 * (`app-directory`) et, selon les droits, les liens de modération (`mod-directory`).
 * Se caler sur le premier ferait chevaucher le bouton avec les suivants.
 *
 * Le bouton étant positionné en absolu, on retient le bord droit le plus avancé —
 * le bouton d'une autre extension (`#mhe_button`) compte aussi, pour ne pas lui passer dessus.
 * `offsetLeft` est employé plutôt que les coordonnées écran : c'est déjà le repère
 * historique du calcul, et il est relatif au même bloc englobant que le bouton.
 * Les blocs masqués mesurent zéro et n'influencent donc pas le résultat.
 */
function positionOptimizerButton(optimizer_btn: HTMLElement): void {
    /** `.app-directory` est redondant avec `.header-directory` aujourd'hui, mais garantit un repère si le jeu renomme la classe commune */
    const anchors: HTMLElement[] = Array.from(document.querySelectorAll('.header-directory, .app-directory, #mhe_button'));
    if (anchors.length === 0) return;

    const right_edge: number = anchors.reduce(
        (furthest: number, anchor: HTMLElement) => Math.max(furthest, anchor.offsetLeft + anchor.offsetWidth),
        0
    );

    optimizer_btn.style.left = `${right_edge + btn_left_margin}px`;
}

/** Create Optimize button */

export function createOptimizerBtn() {
    /**
     * Crée le bouton si la barre d'applications du jeu est présente et qu'il n'existe pas déjà.
     * Idempotent : appelable aussi bien immédiatement qu'à chaque mutation observée.
     */
    const createButtonIfPossible = function () {
        const apps_block = document.querySelector('.app-directory');
        if (apps_block) {

            let optimizer_btn = buttonOptimizerElement();
            if (optimizer_btn) {
                /**
                 * Les blocs du bandeau sont rendus par le jeu, éventuellement après le bouton :
                 * on réaligne à chaque passage, sinon le bouton resterait calé sur la largeur
                 * qu'avait le bandeau au moment de sa création.
                 */
                positionOptimizerButton(optimizer_btn);
            } else {
                const content_zone = document.getElementById(mh_content_id);
                if (!content_zone) return;

                const img = document.createElement('img');
                const annuary = apps_block.querySelector('img');
                img.src = mh_optimizer_icon;
                img.setAttribute('height', annuary && annuary.height ? annuary.height + 'px' : '16px');
                img.setAttribute('width', annuary && annuary.width ? annuary.width + 'px' : '16px');
                img.style.margin = '1px 0 2px';

                const title_hidden = document.createElement('span');
                title_hidden.classList.add('label_text');
                title_hidden.innerText = getScriptInfo().name;

                const title = document.createElement('h1');

                const title_first_part = document.createElement('div');
                title_first_part.style.display = 'flex';
                title_first_part.style.alignItems = 'center';
                title.appendChild(title_first_part);

                const title_second_part = document.createElement('div');
                title_second_part.style.display = 'flex';
                title_second_part.style.alignItems = 'center';
                title_second_part.style.gap = '0.5em';
                title.appendChild(title_second_part);

                const website_link = document.createElement('a');
                website_link.innerHTML = `<img src="${repo_img_hordes_url}icons/small_world.gif" style="vertical-align: top; margin-right: 0.25em;">${getI18N(texts.website)}`;
                website_link.href = state.website;
                website_link.target = '_blank';
                website_link.style.cursor = 'pointer';

                title_second_part.appendChild(website_link);

                title_first_part.appendChild(img);
                title_first_part.appendChild(title_hidden);

                optimizer_btn = document.createElement('div');
                optimizer_btn.id = btn_id;
                positionOptimizerButton(optimizer_btn);
                optimizer_btn.appendChild(title);
                optimizer_btn.addEventListener('click', (event) => {
                    event.stopPropagation();
                });

                if (isTouchScreen()) {
                    const close_link = document.createElement('img');
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

                const mho_content_zone = document.createElement('div');
                mho_content_zone.id = content_btn_id;
                content_zone.appendChild(mho_content_zone);

                createOptimizerButtonContent();
            }
        }
    };

    /**
     * Création immédiate : la barre d'applications est souvent déjà présente au moment
     * où le script démarre. L'observateur seul ne suffisait pas, puisqu'il ne réagit
     * qu'aux mutations SUIVANTES — au chargement direct d'une page, il n'en venait
     * aucune et le bouton n'apparaissait jamais.
     */
    createButtonIfPossible();

    /** L'observateur reste nécessaire : le jeu remplace le contenu à chaque navigation */
    const mh_content = document.getElementById(mh_content_id);
    if (!mh_content) return;

    const apps_exists_observer = new MutationObserver(() => createButtonIfPossible());
    apps_exists_observer.observe(mh_content, { childList: true, subtree: false, attributes: false });
}

/** Crée le contenu du bouton de l'optimizer (bouton de wiki, bouton de configuration, etc) */

export function createOptimizerButtonContent() {
    const optimizer_btn = buttonOptimizerElement();
    const content = document.getElementById(content_btn_id);
    content.innerHTML = '';
    optimizer_btn.appendChild(content);

    if (state.external_app_id) {
        /////////////////////
        // SECTION BOUTONS //
        /////////////////////

        const btn_content = document.createElement('div');
        btn_content.style.display = 'flex';
        btn_content.style.gap = '0.5em';
        btn_content.style.alignItems = 'center';
        content.appendChild(btn_content);

        const wiki_btn = document.createElement('a');
        wiki_btn.classList.add('button', 'mho-parameters-btn');
        wiki_btn.innerText = 'Wiki';
        wiki_btn.addEventListener('click', () => {
            displayWindow('wiki');
        });

        btn_content.appendChild(wiki_btn);

        const tools_btn = document.createElement('a');
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

        const informations_title = document.createElement('h5');
        informations_title.innerText = getI18N(texts.informations_section_label);

        const informations_list = document.createElement('ul');

        const informations_container = document.createElement('div');
        informations_container.id = 'informations';

        informations_container.appendChild(informations_title);
        informations_container.appendChild(informations_list);

        informations.forEach((information) => {
            const information_link = document.createElement('a');
            information_link.id = information.id;
            information_link.innerHTML = (information.img ? `<img src="${information.img.startsWith('http') ? information.img : repo_img_hordes_url + information.img}" style="margin: 0 4px 0 3px; width: 16px">` : '') + `<span class=small>${getI18N(information.label)}</span>`;
            information_link.href = information.src;
            information_link.target = '_blank';

            if (!information.src) {
                information_link.addEventListener('click', (event) => {
                    event.preventDefault();
                    information.action();
                });
            }

            const information_container = document.createElement('li');
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
        const no_external_app_id = document.createElement('div');
        no_external_app_id.innerHTML = getI18N(texts.external_app_id_help);
        content.appendChild(no_external_app_id);
    }
}
