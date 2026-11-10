import { repo_img_hordes_url } from '../config/constants';
import { hero_actions, type HeroActionInfo } from '../data/hero-actions';
import { expedition_texts } from '../i18n/texts';
import { state } from '../state';
import type { ApiExpeditionOrder, ApiExpeditionOrderKind, I18nLabel, MhoItem } from '../types';
import { getI18N } from '../utils/i18n';
import { appendRichText } from '../utils/rich-text';

/** Verbe de chaque type de consigne */
const KIND_VERBS: Readonly<Record<ApiExpeditionOrderKind, I18nLabel>> = {
    pick: expedition_texts.order_kind_pick,
    drop: expedition_texts.order_kind_drop,
    use: expedition_texts.order_kind_use,
    clear: expedition_texts.order_kind_clear,
    explore: expedition_texts.order_kind_explore,
    excavate: expedition_texts.order_kind_excavate,
    camp: expedition_texts.order_kind_camp,
    hero: expedition_texts.order_kind_hero,
    wait: expedition_texts.order_kind_wait
};

/** Pictogramme d'une consigne typée sans image d'objet ou d'action */
const KIND_GLYPHS: Readonly<Record<ApiExpeditionOrderKind, string>> = {
    pick: '✋',
    drop: '📥',
    use: '🍴',
    clear: '⛏️',
    explore: '🧭',
    excavate: '🕳️',
    camp: '⛺',
    hero: '⭐',
    wait: '⏳'
};

/** Ce que dit une consigne typée : verbe, paramètres et image. */
export interface OrderDescription {
    readonly verb: string;
    readonly rest: string;
    /** Image de l'objet ou de l'action héroïque ; `null` : pictogramme */
    readonly img: string | null;
    readonly glyph: string;
    /** Précision libre, affichée à la suite ; `null` sans note */
    readonly note: string | null;
}

export interface OrderRenderOptions {
    /** Case de la consigne (« [3 / -2] »), en tête de ligne */
    readonly cell_label?: string | null;
    /** Citoyen visé, en fin de ligne (consignes des autres membres) */
    readonly owner_label?: string | null;
    /** Noms des citoyens de la ville, pour « Attendre » un citoyen */
    readonly citizen_names?: ReadonlyMap<number, string>;
}

function findItem(item_id: number | null | undefined): MhoItem | undefined {
    if (item_id === null || item_id === undefined) return undefined;
    return state.items?.find((item: MhoItem): boolean => item.id === item_id);
}

/** Verbe et paramètres d'une consigne typée ; `null` pour un texte libre ou un type inconnu de ce script. */
export function describeOrder(order: ApiExpeditionOrder, citizen_names?: ReadonlyMap<number, string>): OrderDescription | null {
    const kind: ApiExpeditionOrderKind | null | undefined = order.kind;
    if (!kind || !(kind in KIND_VERBS)) return null;

    const item: MhoItem | undefined = findItem(order.itemId);
    const item_label: string = item ? getI18N(item.label) ?? '' : '';
    const item_img: string | null = item ? repo_img_hordes_url + item.img : null;
    const quantity: number = order.quantity ?? 1;
    let rest: string = '';
    let img: string | null = null;
    switch (kind) {
        case 'pick':
        case 'drop':
            rest = `×${quantity} ${item_label}`.trim();
            img = item_img;
            break;
        case 'use':
            rest = item_label;
            img = item_img;
            break;
        case 'clear':
            rest = `${quantity} ${getI18N(expedition_texts.order_clear_piles) ?? ''}`.trim();
            break;
        case 'hero': {
            const action: HeroActionInfo | undefined = order.heroSkill ? hero_actions[order.heroSkill] : undefined;
            rest = action ? getI18N(action.label) ?? '' : order.heroSkill ?? '';
            img = action ? repo_img_hordes_url + action.img : null;
            break;
        }
        case 'excavate':
            img = `${repo_img_hordes_url}professions/dig.gif`;
            break;
        case 'wait':
            if (order.targetExpeditionId !== null && order.targetExpeditionId !== undefined) {
                rest = order.targetExpeditionLabel || (getI18N(expedition_texts.order_wait_expedition) ?? '');
            } else {
                rest = order.targetUserId === null || order.targetUserId === undefined
                    ? getI18N(expedition_texts.order_wait_group) ?? ''
                    : citizen_names?.get(order.targetUserId) ?? '?';
            }
            break;
        default:
            break;
    }
    return { verb: getI18N(KIND_VERBS[kind]) ?? '', rest, img, glyph: KIND_GLYPHS[kind], note: order.note?.trim() || null };
}

/** Consigne en lecture seule : case à cocher ou puce, case éventuelle, image ou pictogramme, puis verbe et paramètres (typée) ou texte libre réduit aux balises de mise en forme. */
export function createOrderElement(order: ApiExpeditionOrder, options: OrderRenderOptions = {}): HTMLDivElement {
    const element: HTMLDivElement = document.createElement('div');
    element.classList.add('mho-order');

    const description: OrderDescription | null = describeOrder(order, options.citizen_names);
    /** Une consigne typée se coche toujours */
    const checkable: boolean = description !== null || order.type === 'checkbox';
    const done: boolean = checkable && order.isDone === true;
    if (done) element.classList.add('mho-order-done');

    const mark: HTMLSpanElement = document.createElement('span');
    mark.classList.add('mho-order-mark');
    mark.textContent = checkable ? (done ? '☑' : '☐') : '•';
    element.appendChild(mark);

    if (options.cell_label) {
        const cell: HTMLSpanElement = document.createElement('span');
        cell.classList.add('mho-order-cell');
        cell.textContent = options.cell_label;
        element.appendChild(cell);
    }

    const content: HTMLSpanElement = document.createElement('span');
    content.classList.add('mho-order-content');
    if (description) {
        if (description.img) {
            const img: HTMLImageElement = document.createElement('img');
            img.classList.add('mho-order-img');
            img.src = description.img;
            img.alt = '';
            content.appendChild(img);
        } else {
            const glyph: HTMLSpanElement = document.createElement('span');
            glyph.classList.add('mho-order-glyph');
            glyph.textContent = description.glyph;
            content.appendChild(glyph);
        }
        const verb: HTMLElement = document.createElement('strong');
        verb.textContent = description.verb;
        content.appendChild(verb);
        if (description.rest) {
            content.appendChild(document.createTextNode(' ' + description.rest));
        }
        if (description.note) {
            content.appendChild(document.createTextNode(' — '));
            const note: HTMLElement = document.createElement('em');
            note.classList.add('mho-order-note');
            note.textContent = description.note;
            content.appendChild(note);
        }
    } else {
        const text: HTMLDivElement = document.createElement('div');
        text.classList.add('mho-order-text');
        appendRichText(text, order.text);
        content.appendChild(text);
    }
    element.appendChild(content);

    if (options.owner_label) {
        const owner: HTMLSpanElement = document.createElement('span');
        owner.classList.add('mho-order-owner');
        owner.textContent = options.owner_label;
        element.appendChild(owner);
    }
    return element;
}
