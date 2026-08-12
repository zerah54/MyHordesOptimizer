import { lang, repo_img_hordes_url } from '../config/constants';
import { opener_relation_texts } from '../i18n/texts';
import type { MhoItemSummary } from '../types';
import { getI18N } from '../utils/i18n';

/** Affiche une liste d'icônes (nom de l'objet dans le title) pour une relation boîte/ouvre-boîte. */
export function getOpenerRelationElement(items: MhoItemSummary[]): HTMLSpanElement {
    const container: HTMLSpanElement = document.createElement('span');
    container.classList.add('mho-opener-relation');

    items.forEach((item: MhoItemSummary) => {
        // Même badge que les objets de recette (mho-advanced-tooltip > table.recipes ... > .item),
        // pour un rendu visuellement identique.
        const badge: HTMLSpanElement = document.createElement('span');
        badge.classList.add('item');

        const img: HTMLImageElement = document.createElement('img');
        img.src = repo_img_hordes_url + item.img;
        img.title = getI18N(item.label) ?? '';
        badge.appendChild(img);

        container.appendChild(badge);
    });

    return container;
}

/** Icône localisée d'un coût en points d'action (PA) ou en points de construction (PC). */
export function getPointCostIconElement(kind: 'ap' | 'cp'): HTMLImageElement {
    const filePrefix: string = kind === 'ap' ? 'ap_small' : 'bp_small';
    const img: HTMLImageElement = document.createElement('img');
    img.src = repo_img_hordes_url + 'icons/' + filePrefix + (lang === 'de' ? '' : '_' + lang) + '.gif';
    img.classList.add('mho-point-cost-icon');
    return img;
}

/**
 * Construit la ligne "Ouvert par" d'un tooltip : icônes d'outils (+ alternative Technicien si
 * `isTechnician` et qu'un coût PC existe), coût PA et chance de réussite pour un contenant à
 * risque, ou libellé "gratuit" quand aucun des deux ne s'applique.
 */
export function getOpenedWithRowElement(
    openedWith: MhoItemSummary[],
    openApCost: number | null | undefined,
    openSuccessRate: number | null | undefined,
    technicianOpenCpCost: number | null | undefined,
    isTechnician: boolean
): HTMLDivElement {
    const row: HTMLDivElement = document.createElement('div');
    row.classList.add('mho-opener-relation-row');

    if (openedWith.length > 0) {
        const header: HTMLSpanElement = document.createElement('span');
        header.innerText = getI18N(opener_relation_texts.opened_with) + ' ';
        row.appendChild(header);
        row.appendChild(getOpenerRelationElement(openedWith));

        if (technicianOpenCpCost != null && isTechnician) {
            row.appendChild(document.createTextNode(' ' + getI18N(opener_relation_texts.technician_alternative) + ' ' + technicianOpenCpCost + ' '));
            row.appendChild(getPointCostIconElement('cp'));
        }
    } else if (openApCost != null && openSuccessRate != null) {
        const header: HTMLSpanElement = document.createElement('span');
        header.innerText = getI18N(opener_relation_texts.open_cost) + ' : ' + openApCost + ' ';
        row.appendChild(header);
        row.appendChild(getPointCostIconElement('ap'));
        row.appendChild(document.createTextNode(' - ' + Math.round(openSuccessRate * 100) + '%'));
    } else {
        row.appendChild(document.createTextNode(getI18N(opener_relation_texts.free_to_open)));
    }

    return row;
}
