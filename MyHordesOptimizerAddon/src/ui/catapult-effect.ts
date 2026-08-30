import { repo_img_hordes_url } from '../config/constants';
import { catapult_effect_texts } from '../i18n/texts';
import type { MhoCatapultEffect, MhoItem } from '../types';
import { getI18N } from '../utils/i18n';

interface ResultItem {
    img: string;
    title: string;
    broken: boolean;
}

/** Icône de l'objet qui atterrit après l'impact : lui-même (cassé ou non) ou l'objet obtenu par transformation. `null` si rien ne reste. */
function resolveResultItem(effect: MhoCatapultEffect, item: MhoItem): ResultItem | null {
    if (effect.fate === 'Destroyed') return null;
    if (effect.fate === 'Transformed' && effect.morphTarget) {
        return { img: effect.morphTarget.img, title: getI18N(effect.morphTarget.label) ?? '', broken: false };
    }
    if (effect.fate === 'Broken') {
        return { img: item.imgBroken ?? item.img, title: getI18N(item.label) ?? '', broken: true };
    }
    return { img: item.img, title: getI18N(item.label) ?? '', broken: false };
}

/**
 * Construit l'affichage de l'effet catapulte réel d'un objet, dans le même style que la ligne
 * ouvre-boîte : icône catapulte, flèche, icône (+ `title`) de l'objet qui atterrit (rien si détruit
 * sans laisser de trace), puis pour les objets utilisables comme armes l'icône zombie et le nombre
 * de zombies tués (ou l'effet de répulsion) suivi du rayon d'effet. Ne rend rien pour un objet qui
 * arrive intact sans effet de zone (rien à signaler).
 */
export function getCatapultEffectElement(item: MhoItem): HTMLDivElement | null {
    const effect: MhoCatapultEffect | null | undefined = item.catapultEffect;
    if (!effect) return null;

    const hasZoneEffect: boolean = effect.killMin != null || effect.repelSeconds != null;
    if (effect.fate === 'Intact' && !hasZoneEffect) return null;

    const row: HTMLDivElement = document.createElement('div');
    row.classList.add('mho-catapult-effect');

    const cata_icon: HTMLImageElement = document.createElement('img');
    cata_icon.src = repo_img_hordes_url + 'roles/cata.gif';
    row.appendChild(cata_icon);

    const arrow: HTMLImageElement = document.createElement('img');
    arrow.src = repo_img_hordes_url + 'emotes/arrowright.gif';
    row.appendChild(arrow);

    const result_item: ResultItem | null = resolveResultItem(effect, item);
    if (result_item) {
        const badge: HTMLSpanElement = document.createElement('span');
        badge.classList.add('item');
        const img: HTMLImageElement = document.createElement('img');
        img.src = repo_img_hordes_url + result_item.img;
        img.title = result_item.title;
        if (result_item.broken) {
            img.style.border = '1px dashed red';
        }
        badge.appendChild(img);
        row.appendChild(badge);
    }

    if (effect.repelSeconds != null) {
        const repel_text: HTMLSpanElement = document.createElement('span');
        repel_text.textContent = getI18N(catapult_effect_texts.repel).replace('$minutes$', String(Math.round(effect.repelSeconds / 60)));
        row.appendChild(repel_text);
    } else if (effect.killMin != null) {
        const zombie_icon: HTMLImageElement = document.createElement('img');
        zombie_icon.src = repo_img_hordes_url + 'icons/small_zombie.gif';
        row.appendChild(zombie_icon);

        const kill_count: HTMLSpanElement = document.createElement('span');
        kill_count.textContent = `${effect.killMin}-${effect.killMax}`;
        row.appendChild(kill_count);
    }

    if (hasZoneEffect) {
        const zone_text: HTMLSpanElement = document.createElement('span');
        zone_text.textContent = getI18N(catapult_effect_texts[radiusTextKey(effect.radius)]) ?? '';
        row.appendChild(zone_text);
    }

    return row;
}

function radiusTextKey(radius: MhoCatapultEffect['radius']): 'radius_target' | 'radius_cross' | 'radius_square' {
    if (radius === 'Cross') return 'radius_cross';
    if (radius === 'Square') return 'radius_square';
    return 'radius_target';
}
