import {
    big_broth_hordes_url,
    fata_morgana_url,
    gest_hordes_url,
    mh_optimizer_icon,
    mho_town_external_links_id,
    repo_img_hordes_url,
    repo_img_url
} from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { pageIsTownHistory, pageIsWelcome } from '../utils/page';
import { getScriptInfo } from '../utils/version';

export function addExternalLinksToProfiles() {
    let mho_link_block = document.querySelector('.mho-link-blocks');
    if (state.mho_parameters.display_external_links && !mho_link_block) {
        let user_tooltip = document.querySelector('#user-tooltip');
        if (user_tooltip) {
            let user_id = user_tooltip.querySelector('[x-ajax-href]')?.getAttribute('x-ajax-href')?.replace(/\D/g, '');
            if (!user_id) return;
            let dash_separators = user_tooltip.querySelectorAll('hr.dashed');
            let last_separator = Array.from(dash_separators).pop();
            let link_color = window.getComputedStyle(user_tooltip.querySelector('.link')).getPropertyValue('color');

            let new_separator = document.createElement('hr');
            new_separator.classList.add('dashed');
            last_separator.parentNode.insertBefore(new_separator, last_separator.nextSibling);

            let new_part = document.createElement('div');
            new_part.classList.add('link-blocks', 'mho-link-blocks');
            last_separator.parentNode.insertBefore(new_part, last_separator.nextSibling);

            let new_part_title = document.createElement('div');
            new_part_title.innerHTML = `<img src="${mh_optimizer_icon}" style="width: 16px; margin-right: 0.5em;">${getI18N(texts.external_profiles)}`;
            new_part_title.style.marginBottom = '0.5em';
            new_part_title.style.textAlign = 'left';
            new_part_title.style.color = link_color;
            new_part.appendChild(new_part_title);

            let bbh_link = document.createElement('a');
            bbh_link.classList.add('link-block');
            bbh_link.href = `${big_broth_hordes_url}/?pg=user&uid=5-${user_id}`;
            new_part.appendChild(bbh_link);

            bbh_link.addEventListener('click', () => user_tooltip.remove())

            let bbh_img = document.createElement('img');
            bbh_img.src = `${repo_img_url}external-tools/bbh.gif`;
            bbh_link.appendChild(bbh_img);

            let bbh_br = document.createElement('br');
            bbh_link.appendChild(bbh_br);

            let bbh_title = document.createElement('text');
            bbh_title.innerText = `BigBroth'\nHordes`;
            bbh_link.appendChild(bbh_title);

            new_part.appendChild(document.createTextNode('\u00A0'));

            let gh_link = document.createElement('a');
            gh_link.classList.add('link-block');
            gh_link.href = `${gest_hordes_url}/ame/${user_id}`;
            new_part.appendChild(gh_link);

            gh_link.addEventListener('click', () => user_tooltip.remove())

            let gh_img = document.createElement('img');
            gh_img.src = `${repo_img_url}external-tools/gh.gif`;
            gh_link.appendChild(gh_img);

            let gh_br = document.createElement('br');
            gh_link.appendChild(gh_br);

            let gh_title = document.createElement('text');
            gh_title.innerText = `Gest'Hordes`;
            gh_link.appendChild(gh_title);

            new_part.appendChild(document.createTextNode('\u00A0'));

            let empty_link = document.createElement('div');
            empty_link.classList.add('link-block', 'empty');
            new_part.appendChild(empty_link);
        }
    } else if (!state.mho_parameters.display_external_links && mho_link_block) {
        mho_link_block.remove();
    }
}


export function addExternalLinksToTowns(): void {
    if (!pageIsTownHistory()) {
        return;
    }

    let view_town: HTMLElement | null = document.querySelector('.view-town');
    if (!view_town) return;

    let btns_row: HTMLElement | null | undefined = view_town.querySelector('button')?.parentElement;
    if (!btns_row) return;

    let mho_block: HTMLDivElement | null = btns_row.querySelector<HTMLDivElement>('#' + mho_town_external_links_id);

    if (!state.mho_parameters.display_external_links) {
        mho_block?.remove();
        return;
    }

    if (mho_block) return;

    let town_id: string | null = view_town.getAttribute('data-town-id');
    if (!town_id) return;

    mho_block = document.createElement('div');
    mho_block.id = mho_town_external_links_id;
    mho_block.style.marginTop = '0.5em';
    mho_block.style.padding = '0.25em';
    mho_block.style.border = '1px solid #ddab76';
    btns_row.appendChild(mho_block);

    let updater_title: HTMLHeadingElement = document.createElement('h5');
    updater_title.style.margin = '0 0 0.5em';

    let btns_title_mho_img: HTMLImageElement = document.createElement('img');
    btns_title_mho_img.src = mh_optimizer_icon;
    btns_title_mho_img.style.height = '24px';
    btns_title_mho_img.style.marginRight = '0.5em';
    updater_title.appendChild(btns_title_mho_img);

    let btns_title_text: HTMLElement = document.createElement('text');
    btns_title_text.innerText = getScriptInfo().name;
    updater_title.appendChild(btns_title_text);

    mho_block.appendChild(updater_title);

    let mho_btns_block: HTMLDivElement = document.createElement('div');
    mho_block.appendChild(mho_btns_block);
    mho_btns_block.style.display = 'flex';
    mho_btns_block.style.gap = '0.5em';
    mho_btns_block.style.justifyContent = 'space-between';
    mho_btns_block.style.alignItems = 'center';

    createExternalLinksButtons(town_id).forEach((link: HTMLButtonElement): void => {
        mho_btns_block.appendChild(link);
    });
}

interface ExternalToolLinkDefinition {
    readonly icon_file_name: string;
    readonly label: string;
    readonly build_url: (town_id: string) => string;
}

const external_tool_links: readonly ExternalToolLinkDefinition[] = [
    // {
    //     icon_file_name: 'bbh.gif',
    //     label: `BigBroth'\nHordes`,
    //     build_url: (town_id: string): string => `${big_broth_hordes_url}/?cid=5-${town_id}`,
    // },
    {
        icon_file_name: 'gh.gif',
        label: `Gest'\nHordes`,
        build_url: (town_id: string): string => `${gest_hordes_url}/carte/${town_id}`,
    },
    {
        icon_file_name: 'fata.gif',
        label: `Fata\nMorgana`,
        build_url: (town_id: string): string => `${fata_morgana_url}/spy/town/${town_id}`,
    },
];

function createExternalLinksButtons(town_id: string): HTMLButtonElement[] {
    return external_tool_links.map((tool_link: ExternalToolLinkDefinition): HTMLButtonElement => {
        const link: HTMLButtonElement = document.createElement('button');
        link.classList.add('small');
        link.style.display = 'flex';
        link.style.alignItems = 'center';
        link.style.gap = '0.5em';
        link.onclick = (): Window | null => window.open(tool_link.build_url(town_id), '_blank');

        const img: HTMLImageElement = document.createElement('img');
        img.src = `${repo_img_url}external-tools/${tool_link.icon_file_name}`;
        link.appendChild(img);

        const title: HTMLElement = document.createElement('text');
        title.innerText = tool_link.label;
        link.appendChild(title);

        return link;
    });
}

const mho_welcome_link_cell_class: string = 'mho-town-list-link-cell';
const mho_welcome_link_header_class: string = 'mho-town-list-link-header-cell';
const mho_welcome_link_panel_class: string = 'mho-town-list-link-panel';
let mho_welcome_outside_click_bound: boolean = false;
let mho_welcome_observed_element: HTMLElement | null = null;
let mho_welcome_observer: MutationObserver | null = null;

export function addExternalLinksColumnToWelcomeTowns(): void {
    if (!pageIsWelcome()) {
        disconnectWelcomeObserver();
        return;
    }

    let onboarding: HTMLElement | null = document.querySelector('hordes-game-onboarding');
    if (!onboarding) return;

    if (!state.mho_parameters.display_external_links) {
        removeExternalLinksColumnFromWelcomeTowns();
        disconnectWelcomeObserver();
        return;
    }

    ensureWelcomeObserver(onboarding);
    bindWelcomeOutsideClickOnce();

    let header_rows: NodeListOf<HTMLElement> = onboarding.querySelectorAll('.row-flex.header');
    header_rows.forEach((header_row: HTMLElement): void => {
        if (header_row.querySelector('.' + mho_welcome_link_header_class)) return;

        let header_cell: HTMLDivElement = document.createElement('div');
        header_cell.classList.add('padded', 'cell', 'rw-1', 'hide-sm', mho_welcome_link_header_class);

        let header_icon: HTMLImageElement = document.createElement('img');
        header_icon.src = mh_optimizer_icon;
        header_icon.alt = 'MHO';
        header_icon.style.width = '16px';
        header_cell.appendChild(header_icon);

        header_row.appendChild(header_cell);
    });

    let town_rows: NodeListOf<HTMLElement> = onboarding.querySelectorAll('.town-row');
    town_rows.forEach((town_row: HTMLElement): void => {
        if (town_row.querySelector('.' + mho_welcome_link_cell_class)) return;

        let town_id: string | null = town_row.getAttribute('data-town-id');
        if (!town_id) return;

        let link_cell: HTMLDivElement = document.createElement('div');
        link_cell.classList.add('padded', 'cell', 'rw-1', 'rw-sm-2', mho_welcome_link_cell_class);

        let map_icon: HTMLImageElement = document.createElement('img');
        map_icon.src = repo_img_hordes_url + 'icons/item_map.gif';
        map_icon.alt = 'Carte';
        link_cell.appendChild(map_icon);

        let panel: HTMLDivElement = document.createElement('div');
        panel.classList.add(mho_welcome_link_panel_class);
        createExternalLinksButtons(town_id).forEach((link: HTMLButtonElement): void => {
            panel.appendChild(link);
        });
        link_cell.appendChild(panel);

        link_cell.addEventListener('click', (event: MouseEvent): void => {
            event.stopPropagation();
            let was_open: boolean = panel.classList.contains('mho-open');
            closeAllWelcomeLinkPanels();
            if (!was_open) {
                panel.classList.add('mho-open');
                positionWelcomeLinkPanel(panel);
            }
        });

        town_row.appendChild(link_cell);
    });
}

function ensureWelcomeObserver(onboarding: HTMLElement): void {
    if (mho_welcome_observed_element === onboarding && mho_welcome_observer) return;

    disconnectWelcomeObserver();

    mho_welcome_observed_element = onboarding;
    mho_welcome_observer = new MutationObserver((): void => {
        addExternalLinksColumnToWelcomeTowns();
    });
    mho_welcome_observer.observe(onboarding, { childList: true, subtree: true });
}

function disconnectWelcomeObserver(): void {
    mho_welcome_observer?.disconnect();
    mho_welcome_observer = null;
    mho_welcome_observed_element = null;
}

function removeExternalLinksColumnFromWelcomeTowns(): void {
    document.querySelectorAll('.' + mho_welcome_link_cell_class + ', .' + mho_welcome_link_header_class)
        .forEach((element: Element): void => element.remove());
}

function closeAllWelcomeLinkPanels(): void {
    document.querySelectorAll('.' + mho_welcome_link_panel_class + '.mho-open')
        .forEach((panel: Element): void => panel.classList.remove('mho-open'));
}

function bindWelcomeOutsideClickOnce(): void {
    if (mho_welcome_outside_click_bound) return;
    mho_welcome_outside_click_bound = true;
    document.addEventListener('click', closeAllWelcomeLinkPanels);
}

function positionWelcomeLinkPanel(panel: HTMLElement): void {
    panel.classList.remove('mho-align-right');

    let panel_rect: DOMRect = panel.getBoundingClientRect();
    let overflows_right: boolean = panel_rect.right > window.innerWidth;

    if (overflows_right) {
        panel.classList.add('mho-align-right');
    }
}
