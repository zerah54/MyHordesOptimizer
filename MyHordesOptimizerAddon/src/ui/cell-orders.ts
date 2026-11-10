import { expedition_texts } from '../i18n/texts';
import type { ApiExpeditionPart, ApiExpeditionPartRoute, I18nLabel } from '../types';
import { partApLabel, partRuinAp } from '../utils/expedition-cost';
import type { CellOrder, PassageOrders } from '../utils/expedition-route';
import { getI18N } from '../utils/i18n';
import { createOrderElement } from './expedition-order';

/** Tracé et consignes case par case d'une partie, communs au bloc sous la carte du désert et à la fenêtre des expéditions. */

/** Teintes des tracés par clé de palette (échantillon) : variantes du thème sombre du site */
const route_colors: Readonly<Record<string, string>> = {
    blue: '#7DB0FF',
    violet: '#C29BFF',
    magenta: '#FF7DB4',
    teal: '#46D6E0',
    brown: '#E7D9C3',
    indigo: '#A9ADFF',
    pink: '#FFB3E3',
    cyan: '#8FDDFF',
    slate: '#C6D2E2',
    plum: '#E6A8DA'
};
const default_route_color: string = route_colors.blue;

/** Teinte d'un tracé d'après sa clé de palette ; bleu pour une clé absente ou inconnue. */
export function routeColor(color_key: string | null | undefined): string {
    return (color_key ? route_colors[color_key] : undefined) ?? default_route_color;
}

/** Ligne de texte portant la classe `class_name`. */
export function createLine(class_name: string, text: string): HTMLDivElement {
    const line: HTMLDivElement = document.createElement('div');
    line.classList.add(class_name);
    line.textContent = text;
    return line;
}

/** Pastille du tracé lié puis « nom · coût » ; `null` sans tracé lié. */
export function createRouteLine(part: ApiExpeditionPart): HTMLDivElement | null {
    const route: ApiExpeditionPartRoute | null | undefined = part.mapRoute;
    if (!route) return null;
    const route_line: HTMLDivElement = document.createElement('div');
    route_line.classList.add('mho-expedition-route-name');
    const swatch: HTMLSpanElement = document.createElement('span');
    swatch.classList.add('mho-expedition-route-swatch');
    swatch.style.backgroundColor = routeColor(route.color);
    route_line.appendChild(swatch);
    route_line.appendChild(document.createTextNode(`${route.label} · ${partApLabel(route.length, partRuinAp(part))}`));
    return route_line;
}

/** Étiquette du passage `n` avec les PA pour l'atteindre (« 1er passage · 2 PA »). */
export function passageLabel(n: number, ap: number | null): string {
    const text: I18nLabel = n === 1 ? expedition_texts.passage_first : expedition_texts.passage_nth;
    const label: string = (getI18N(text) ?? '').replace('{n}', String(n));
    return ap === null ? label : `${label} · ${ap} ${getI18N(expedition_texts.ap_short) ?? ''}`;
}

/** Ajoute à `container`, par passage : son étiquette (case traversée plusieurs fois), mes consignes et celles de toute la partie, puis celles des autres membres avec leur nom. */
export function appendPassageGroups(container: HTMLElement, groups: readonly PassageOrders[], user_id: number, names: ReadonlyMap<number, string> | undefined): void {
    groups.forEach((group: PassageOrders): void => {
        if (group.passage !== null) {
            container.appendChild(createLine('mho-expedition-route-passage', passageLabel(group.passage, group.ap)));
        }
        const mine: CellOrder[] = group.orders.filter((cell_order: CellOrder): boolean => cell_order.citizen_user_id === null || cell_order.citizen_user_id === user_id);
        const others: CellOrder[] = group.orders.filter((cell_order: CellOrder): boolean => cell_order.citizen_user_id !== null && cell_order.citizen_user_id !== user_id);
        mine.forEach((cell_order: CellOrder): void => {
            container.appendChild(createOrderElement(cell_order.order, { citizen_names: names }));
        });
        if (others.length > 0) {
            const others_block: HTMLDivElement = createLine('mho-expedition-route-others', getI18N(expedition_texts.other_members_orders) ?? '');
            others.forEach((cell_order: CellOrder): void => {
                const owner: string = names?.get(cell_order.citizen_user_id) ?? '?';
                others_block.appendChild(createOrderElement(cell_order.order, { citizen_names: names, owner_label: `— ${owner}` }));
            });
            container.appendChild(others_block);
        }
    });
}
