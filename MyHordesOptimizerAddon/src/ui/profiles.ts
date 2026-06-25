import { big_broth_hordes_url, fata_morgana_url, gest_hordes_url, mh_optimizer_icon, mho_town_external_links_id, repo_img_url } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import { getI18N } from '../utils/i18n';
import { pageIsTownHistory } from '../utils/page';
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


export function addExternalLinksToTowns() {
    if (state.mho_parameters.display_external_links && pageIsTownHistory()) {
        let mho_block = document.querySelector('#' + mho_town_external_links_id);
        if (mho_block) return;

        let view_town = document.querySelector('.view-town');
        if (!view_town) return;

        let btns_row = view_town.querySelector('button')?.parentElement;
        if (!btns_row) return;

        let town_id = view_town.getAttribute('data-town-id');

        mho_block = document.createElement('div');
        mho_block.id = mho_town_external_links_id;
        mho_block.style.marginTop = '0.5em';
        mho_block.style.padding = '0.25em';
        mho_block.style.border = '1px solid #ddab76';
        btns_row.appendChild(mho_block);

        let updater_title = document.createElement('h5');
        updater_title.style.margin = '0 0 0.5em'

        let btns_title_mho_img = document.createElement('img');
        btns_title_mho_img.src = mh_optimizer_icon;
        btns_title_mho_img.style.height = '24px';
        btns_title_mho_img.style.marginRight = '0.5em';
        updater_title.appendChild(btns_title_mho_img);

        let btns_title_text = document.createElement('text');
        btns_title_text.innerText = getScriptInfo().name;
        updater_title.appendChild(btns_title_text);

        mho_block.appendChild(updater_title);

        let mho_btns_block = document.createElement('div');
        mho_block.appendChild(mho_btns_block);
        mho_btns_block.style.display = 'flex';
        mho_btns_block.style.gap = '0.5em';
        mho_btns_block.style.justifyContent = 'space-between';
        mho_btns_block.style.alignItems = 'center';


        let bbh_link = document.createElement('button');
        bbh_link.classList.add('small');
        bbh_link.style.display = 'flex';
        bbh_link.style.alignItems = 'center';
        bbh_link.style.gap = '0.5em';
        bbh_link.onclick = () => window.open(`${big_broth_hordes_url}/?cid=5-${town_id}`, '_blank');
        mho_btns_block.appendChild(bbh_link);

        let bbh_img = document.createElement('img');
        bbh_img.src = `${repo_img_url}external-tools/bbh.gif`;
        bbh_link.appendChild(bbh_img);

        let bbh_title = document.createElement('text');
        bbh_title.innerText = `BigBroth'\nHordes`;
        bbh_link.appendChild(bbh_title);

        let gh_link = document.createElement('button');
        gh_link.classList.add('small');
        gh_link.style.display = 'flex';
        gh_link.style.alignItems = 'center';
        gh_link.style.gap = '0.5em';
        gh_link.onclick = () => window.open(`${gest_hordes_url}/carte/${town_id}`, '_blank');
        mho_btns_block.appendChild(gh_link);

        let gh_img = document.createElement('img');
        gh_img.src = `${repo_img_url}external-tools/gh.gif`;
        gh_link.appendChild(gh_img);

        let gh_title = document.createElement('text');
        gh_title.innerText = `Gest'\nHordes`;
        gh_link.appendChild(gh_title);

        let fata_link = document.createElement('button');
        fata_link.classList.add('small');
        fata_link.style.display = 'flex';
        fata_link.style.alignItems = 'center';
        fata_link.style.gap = '0.5em';
        fata_link.onclick = () => window.open(`${fata_morgana_url}/spy/town/${town_id}`, '_blank');
        mho_btns_block.appendChild(fata_link);

        let fata_img = document.createElement('img');
        fata_img.src = `${repo_img_url}external-tools/fata.gif`;
        fata_link.appendChild(fata_img);

        let fata_title = document.createElement('text');
        fata_title.innerText = `Fata\nMorgana`;
        fata_link.appendChild(fata_title);

    }
}
