import { getMap } from '../api/map';
import { getRuins } from '../api/ruins';
import { cell_informations_content_id, repo_img_hordes_url } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { pageIsDesert } from '../utils/page';
import { getCellDetailsByPosition } from '../utils/position';
import { unwatchRendered, watchMap } from '../utils/render-watch';
import { ensureMhoSection, type MhoSection } from './mho-block';

/** Évite d'enchaîner plusieurs chargements concurrents */
let is_loading_map: boolean = false;
let is_loading_ruins: boolean = false;

const ICON_NOTE: string = 'icons/small_talk.gif';
const ICON_BUILDING: string = 'icons/small_enter.gif';
const ICON_RUIN_EXPLORABLE: string = 'icons/small_exploration.gif';
const DIG_LEVEL_ICONS: readonly string[] = ['icons/Small_broken.gif', 'icons/collec_lv1.gif', 'icons/collec_lv2.gif', 'icons/collec_lv3.gif'];

/**
 * Icône du palier d'abondance du jeu : 0 épuisée, 1-2 presque épuisée, 3-6 à moitié vide, 7+ abondante.
 * @param remaining Fouilles restantes arrondies
 * @returns Chemin de l'icône, relatif à `repo_img_hordes_url`
 */
export function digLevelIcon(remaining: number): string {
    if (remaining <= 0) return DIG_LEVEL_ICONS[0];
    if (remaining <= 2) return DIG_LEVEL_ICONS[1];
    if (remaining <= 6) return DIG_LEVEL_ICONS[2];
    return DIG_LEVEL_ICONS[3];
}

/** Met à jour l'icône en préfixe d'une sous-section. */
function setSubBlockIcon(container: Element, id: string, icon: string): void {
    const img: HTMLImageElement | null = container.querySelector('#' + id + ' > img');
    if (img) {
        img.src = `${repo_img_hordes_url}/${icon}`;
    }
}

/**
 * Crée une sous-section « icône en préfixe + contenu » dans le conteneur donné.
 * @param container Élément dans lequel insérer la sous-section
 * @param id Identifiant DOM de la sous-section, réutilisé en suffixe pour le contenu
 * @param title Libellé de la sous-section, affiché en infobulle de l'icône
 * @param icon Icône du jeu, relative à `repo_img_hordes_url`
 */
function createSubBlock(container: Element, id: string, title: string, icon: string): void {
    const sub_block: HTMLDivElement = document.createElement('div');
    sub_block.id = id;
    sub_block.style.display = 'flex';
    sub_block.style.alignItems = 'flex-start';
    sub_block.style.gap = '0.5em';
    container.appendChild(sub_block);

    const sub_block_icon: HTMLImageElement = document.createElement('img');
    sub_block_icon.src = `${repo_img_hordes_url}/${icon}`;
    sub_block_icon.title = title;
    sub_block_icon.alt = title;
    sub_block.appendChild(sub_block_icon);

    const sub_block_content: HTMLDivElement = document.createElement('div');
    sub_block_content.id = id + '-content';
    sub_block_content.style.flex = '1';
    sub_block.appendChild(sub_block_content);
}

/**
 * Crée la sous-section « Bâtiment » si la case courante a un bâtiment identifié et que la
 * sous-section n'existe pas déjà. Appelée à chaque rendu (pas seulement à la création du
 * bloc) pour rester correcte même si `idRuin` n'était pas encore connu au premier appel.
 * @param cell_informations Conteneur racine du bloc d'informations complémentaires
 * @param id_ruin Identifiant du bâtiment sur la case courante, `null`/`undefined` si aucun
 */
export function ensureRuinSubBlock(cell_informations: Element, id_ruin: number | null | undefined): void {
    if (id_ruin === null || id_ruin === undefined || cell_informations.querySelector('#cell-ruin')) {
        return;
    }

    const content: Element | null = cell_informations.querySelector('#' + cell_informations_content_id);
    if (!content) {
        return;
    }

    createSubBlock(content, 'cell-ruin', getI18N(texts.ruin_state_header), ICON_BUILDING);
}

/**
 * Vide le contenu de la sous-section « Bâtiment » quand la case courante n'a pas (ou plus)
 * de ruine : sans ça, les informations de la dernière ruine visitée restent affichées en
 * quittant sa case, `insertRuinDigs` ne faisant rien tant qu'aucune ruine n'est trouvée.
 * @param cell_informations Conteneur racine du bloc d'informations complémentaires
 * @param id_ruin Identifiant du bâtiment sur la case courante, `null`/`undefined` si aucun
 * @returns `true` si le contenu a été vidé (aucune ruine sur la case courante)
 */
export function clearRuinSubBlockIfNoRuin(cell_informations: Element, id_ruin: number | null | undefined): boolean {
    if (id_ruin !== null && id_ruin !== undefined && id_ruin > 0) {
        return false;
    }

    const content: Element | null = cell_informations.querySelector('#cell-ruin-content');
    if (content) {
        content.innerHTML = '';
    }

    return true;
}

/**
 * Fouilles restantes d'une case, telles que MHO les tient à jour (observations, régénérations,
 * excavations, fouilles réussies) : elles ne se déduisent plus des fouilles réussies enregistrées.
 * Arrondies pour l'affichage, jamais négatives.
 * @param remaining Estimation moyenne ou plafond renvoyé par MHO
 */
export function formatRemainingDigs(remaining: number | null | undefined): number {
    return Math.max(0, Math.round(remaining ?? 0));
}

export function displayCellDetailsOnPage() {
    if (!state.mho_parameters.display_more_informations_from_mho || !pageIsDesert()) {
        /** Hors désert ou option décochée : plus rien à afficher, on arrête d'écouter la carte */
        unwatchRendered('cell-details');
        state.current_cell = undefined;
        return;
    }

    /**
     * La position courante (`.current-location`) est rendue par React, après l'injection
     * du HTML : c'est ce que compensait le délai fixe de 500 ms à l'appel. On se cale
     * désormais sur le rendu réel de la carte, ce qui couvre aussi les déplacements —
     * le bloc suit alors la case sans attendre un rejeu des initialisations.
     */
    watchMap('cell-details', displayCellDetailsOnPage);

    /**
     * `getMap()` n'a pas de garde de cache : sans réappel régulier, les cases affichées
     * restent celles du tout premier chargement pour le reste de la session (nos
     * déplacements, les fouilles/explorations d'autrui). On la recharge donc à chaque
     * rendu de la carte plutôt qu'une seule fois, sur le même modèle que
     * getCitizens()/getBank(). `is_loading_map` ne borne que les rendus concurrents
     * pendant un chargement en cours, pas les rendus successifs dans le temps — le
     * rendu courant s'affiche avec les données déjà en main, et se rejoue une fois
     * la réponse arrivée.
     */
    if (!is_loading_map && state.mh_user?.townDetails?.townId) {
        is_loading_map = true;
        getMap()
            .then(() => displayCellDetailsOnPage())
            .catch(() => undefined)
            .finally(() => is_loading_map = false);
    }

    let cell = getCellDetailsByPosition();
    if (!cell) {
        return;
    }

    state.current_cell = cell;
    const section: MhoSection | null = ensureMhoSection('cell-informations', getI18N(texts.additional_informations), 'last');
    if (!section) {
        return;
    }
    const cell_informations: HTMLElement = section.root;

    if (!section.header.querySelector('.mho-cell-informations-reload')) {
        const cell_informations_header_right = document.createElement('div');
        cell_informations_header_right.classList.add('mho-cell-informations-reload');
        cell_informations_header_right.textContent = '🗘';
        cell_informations_header_right.style.fontSize = '16px';
        cell_informations_header_right.style.cursor = 'pointer';
        section.header.appendChild(cell_informations_header_right);

        cell_informations_header_right.addEventListener('click', () => {
            if (cell_informations.querySelector('#cell-note-content')) {
                cell_informations.querySelector('#cell-note-content').innerText = '🗘';
            }
            if (cell_informations.querySelector('#cell-digs-content')) {
                cell_informations.querySelector('#cell-digs-content').innerText = '🗘';
            }
            if (cell_informations.querySelector('#cell-ruin-content')) {
                cell_informations.querySelector('#cell-ruin-content').innerText = '🗘';
            }
            getMap().then(() => {
                cell = getCellDetailsByPosition();
                updateInformations(cell);
            });
        });
    }

    if (!cell_informations.querySelector('#cell-note')) {
        createSubBlock(section.content, 'cell-note', getI18N(texts.note), ICON_NOTE);
        createSubBlock(section.content, 'cell-digs', getI18N(texts.digs_state_header), DIG_LEVEL_ICONS[3]);
    }

    /**
     * La sous-section « Bâtiment » dépend de la case courante (`idRuin`), qui peut ne pas
     * être connue au tout premier appel (la position `.current-location` n'est pas encore
     * rendue par React) : on la (re)vérifie à chaque appel plutôt qu'une seule fois à la
     * création du bloc, sous peine de ne plus jamais l'afficher pour le reste de la session.
     */
    ensureRuinSubBlock(cell_informations, state.current_cell.idRuin);

    const insertCellNote = (cell) => {
        if (cell_informations.querySelector('#cell-note-content')) {
            cell_informations.querySelector('#cell-note-content').innerHTML = cell.note && cell.note !== ''
                ? `<div>${cell.note}</div>`
                : `<div style="opacity: 0.5; font-style: italic; font-size: 12px;">${getI18N(texts.no_note)}</div>`;
        }
    };

    const insertCellDigs = (cell) => {
        const digs_content: Element | null = cell_informations.querySelector('#cell-digs-content');
        if (digs_content) {
            const max: number = formatRemainingDigs(cell.maxPotentialRemainingDig);
            const average: number = formatRemainingDigs(cell.averagePotentialRemainingDig);
            setSubBlockIcon(cell_informations, 'cell-digs', digLevelIcon(average));
            digs_content.textContent = `${max} ${getI18N(texts.digs_max_short)} · ${average} ${getI18N(texts.digs_average_short)}`;
        }
    };

    const insertRuinDigs = () => {
        if (clearRuinSubBlockIfNoRuin(cell_informations, state.current_cell.idRuin)) {
            return;
        }

        /** Les ruines suivent le même chargement conditionnel que la carte : on les récupère à la demande */
        if (!state.ruins?.length) {
            if (!is_loading_ruins) {
                is_loading_ruins = true;
                getRuins()
                    .then(() => insertRuinDigs())
                    .catch(() => undefined)
                    .finally(() => is_loading_ruins = false);
            }
            return;
        }
        const current_ruin = state.ruins.find((ruin) => ruin.id === state.current_cell.idRuin);
        setSubBlockIcon(cell_informations, 'cell-ruin', current_ruin?.explorable ? ICON_RUIN_EXPLORABLE : ICON_BUILDING);
        const empty_text = `<div style="opacity: 0.5; font-style: italic; font-size: 12px;">${getI18N(texts.ruin_dried)}</div>`;
        const complete_text = `<div>${getI18N(texts.ruin_not_dried)}</div>`;
        let ruin_drops = '';
        if (current_ruin && (current_ruin.explorable || !state.current_cell.isRuinDryed)) {
            ruin_drops += '<div style="display: flex; flex-direction: row; gap: 0.5em; flex-wrap: wrap; font-size: 12px;">';
            if (current_ruin?.drops) {
                current_ruin.drops.forEach((drop) => {
                    ruin_drops += `<span style="display: flex; flex-direction: column; align-items: center;"><img src="${repo_img_hordes_url}/${drop.item.img}">${Math.round(drop.probability * 100 * 10) / 10}%</span>`;
                });
            }
        }
        ruin_drops += '</div>';
        if (cell_informations.querySelector('#cell-ruin-content')) {
            cell_informations.querySelector('#cell-ruin-content').innerHTML = (!current_ruin?.explorable ? (state.current_cell.isRuinDryed ? empty_text : complete_text) : '') + ruin_drops;
        }
    };

    const updateInformations = (cell) => {
        insertCellNote(cell);
        insertCellDigs(cell);
        insertRuinDigs();
    };

    updateInformations(cell);
}
