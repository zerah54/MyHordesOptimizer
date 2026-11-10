import { fetchTownCitizenRefs } from '../api/citizens';
import { loadMyExpeditions, myExpeditionsKey } from '../api/expeditions';
import { loadRoutesWithoutExpedition } from '../api/map-routes';
import { mh_optimizer_icon } from '../config/constants';
import { expedition_texts } from '../i18n/texts';
import { state } from '../state';
import type { ApiExpedition, ApiMapRoute, I18nLabel } from '../types';
import {
    type CellOrder,
    type GridPoint,
    type MoveDirection,
    type MyExpeditionPart,
    myExpeditionParts,
    myOrderIndexes,
    type NextOrdersCell,
    nextOrdersCell,
    ordersByPassage,
    parsePosition,
    type PassageOrders,
    pointKey,
    type RouteGuidance,
    routeGuidance
} from '../utils/expedition-route';
import { chosenOption, loadRouteChoice, routeChoice, type RouteOption, routeOptions, setRouteChoice } from '../utils/expedition-route-selection';
import { getI18N } from '../utils/i18n';
import { pageIsDesert } from '../utils/page';
import { unwatchRendered, watchMap } from '../utils/render-watch';
import type { TownCitizenRef } from '../utils/successful-digs-page';
import { appendPassageGroups, createLine, createRouteLine } from './cell-orders';

/** Tracé MHO de mon expédition dans l'Outre-Monde : flèches du jeu vers la case suivante du tracé en rose MHO, et bloc sous la carte (direction, consignes de la case, tracé suivi au choix). */

const watch_key: string = 'expedition-route';
export const expedition_route_block_id: string = 'mho-expedition-route';

/** Attributs posés sur `hordes-map` : le jeu re-rend les flèches, jamais cet élément (cf. `main.scss`) */
export const route_directions_attribute: string = 'data-mho-route';
export const route_mode_attribute: string = 'data-mho-route-mode';

const direction_labels: Readonly<Record<MoveDirection, I18nLabel>> = {
    north: expedition_texts.direction_north,
    east: expedition_texts.direction_east,
    south: expedition_texts.direction_south,
    west: expedition_texts.direction_west
};
const direction_glyphs: Readonly<Record<MoveDirection, string>> = { north: '⇧', east: '⇨', south: '⇩', west: '⇦' };

let is_loading_expeditions: boolean = false;
/** Ville, jour et case du dernier chargement demandé (réussi ou non) : un changement de case en relance un, un nouveau rendu de la même case non. */
let last_request: string | undefined;
/** Choix du tracé suivi déjà lu dans le stockage (ou en cours de lecture) */
let selection_loaded: boolean = false;
let is_loading_routes: boolean = false;
/** Ville et jour du dernier chargement des tracés sans expédition demandé (réussi ou non) */
let last_routes_request: string | undefined;
/** Tracés sans expédition de la ville et du jour `town_routes_key` */
let town_routes: ApiMapRoute[] = [];
let town_routes_key: string | undefined;
let town_routes_loaded_at: number | undefined;
let is_loading_names: boolean = false;
/** Noms des citoyens de la ville `citizen_names_town` (consignes des autres membres, « Attendre » un citoyen) */
let citizen_names: Map<number, string> | undefined;
let citizen_names_town: number | undefined;
/** Contenu affiché : le bloc n'est reconstruit que s'il change */
let last_signature: string | undefined;

/** Carte du désert (`beyond.html.twig`) */
function desertMap(): HTMLElement | null {
    return document.querySelector<HTMLElement>('hordes-map#beyond-map') ?? document.querySelector<HTMLElement>('hordes-map');
}

function isEnabled(): boolean {
    return !!state.mho_parameters?.display_expedition_route && pageIsDesert();
}

/** Coordonnées absolues de la ville : celles du jeton, sinon celles de la carte MHO. */
export function townPosition(): GridPoint | null {
    const x: unknown = state.mh_user?.townDetails?.townX ?? state.map?.townX;
    const y: unknown = state.mh_user?.townDetails?.townY ?? state.map?.townY;
    return typeof x === 'number' && typeof y === 'number' ? { x, y } : null;
}

export function formatCell(point: GridPoint): string {
    return `[${point.x} / ${point.y}]`;
}

/** Relit les expéditions du jour à l'arrivée, à chaque changement de case et à la demande (`force`), sans doubler un chargement en cours : à son retour, le rendu relance celui de la case atteinte. */
function reloadExpeditions(position: GridPoint | null, force: boolean): void {
    const key: string | undefined = myExpeditionsKey();
    if (!key || is_loading_expeditions) return;
    const request: string = `${key}@${position ? pointKey(position) : '-'}`;
    if (!force && request === last_request) return;
    is_loading_expeditions = true;
    last_request = request;
    loadMyExpeditions()
        .catch((error: unknown): void => console.warn('MHO - expéditions du jour indisponibles', error))
        .finally((): void => {
            is_loading_expeditions = false;
            last_signature = undefined;
            renderExpeditionRoute();
        });
}

/** Relit les tracés sans expédition une fois par ville et par jour, et à la demande (`force`). */
function reloadTownRoutes(force: boolean): void {
    const key: string | undefined = myExpeditionsKey();
    if (!key || is_loading_routes || (!force && key === last_routes_request)) return;
    is_loading_routes = true;
    last_routes_request = key;
    loadRoutesWithoutExpedition()
        .then((routes: ApiMapRoute[]): void => {
            /** La ville ou le jour ont pu changer pendant l'appel : la réponse ne vaut que pour ceux de la demande */
            if (myExpeditionsKey() === key) {
                town_routes = routes;
                town_routes_key = key;
                town_routes_loaded_at = Date.now();
            }
        })
        .catch((error: unknown): void => console.warn('MHO - tracés de la ville indisponibles', error))
        .finally((): void => {
            is_loading_routes = false;
            last_signature = undefined;
            renderExpeditionRoute();
        });
}

/** Noms des citoyens : ceux déjà chargés par la fenêtre des expéditions, sinon un appel, une fois par ville. */
function knownCitizenNames(): Map<number, string> | undefined {
    const town_id: number | undefined = state.mh_user?.townDetails?.townId;
    if (citizen_names && citizen_names_town === town_id) return citizen_names;

    const loaded: unknown = (state.citizens as unknown as { citizens?: unknown } | undefined)?.citizens;
    if (Array.isArray(loaded) && loaded.length > 0) {
        citizen_names = new Map<number, string>(loaded
            .filter((citizen: { id?: unknown; name?: unknown }): boolean => typeof citizen?.id === 'number' && typeof citizen?.name === 'string')
            .map((citizen: { id: number; name: string }): [number, string] => [citizen.id, citizen.name]));
        citizen_names_town = town_id;
        return citizen_names;
    }

    if (!is_loading_names && town_id) {
        is_loading_names = true;
        fetchTownCitizenRefs()
            .then((citizens: TownCitizenRef[]): void => {
                citizen_names = new Map<number, string>(citizens.map((citizen: TownCitizenRef): [number, string] => [citizen.id, citizen.name]));
                citizen_names_town = town_id;
            })
            .catch((error: unknown): void => console.warn('MHO - citoyens de la ville indisponibles', error))
            .finally((): void => {
                is_loading_names = false;
                last_signature = undefined;
                renderExpeditionRoute();
            });
    }
    return undefined;
}

/** Les noms ne servent qu'aux consignes des autres membres et à « Attendre » un citoyen. */
function needsCitizenNames(orders: readonly CellOrder[], user_id: number): boolean {
    return orders.some((cell_order: CellOrder): boolean => {
        return (cell_order.citizen_user_id !== null && cell_order.citizen_user_id !== user_id)
            || (cell_order.order.kind === 'wait' && cell_order.order.targetUserId !== null && cell_order.order.targetUserId !== undefined);
    });
}

function clearArrows(map_element: HTMLElement | null): void {
    map_element?.removeAttribute(route_directions_attribute);
    map_element?.removeAttribute(route_mode_attribute);
}

/** Retire les flèches colorées et le bloc. */
export function clearExpeditionRoute(): void {
    clearArrows(desertMap());
    document.getElementById(expedition_route_block_id)?.remove();
    last_signature = undefined;
}

function applyArrows(map_element: HTMLElement, guidance: RouteGuidance | null): void {
    if (!guidance || guidance.directions.length === 0) {
        clearArrows(map_element);
        return;
    }
    map_element.setAttribute(route_directions_attribute, guidance.directions.join(' '));
    map_element.setAttribute(route_mode_attribute, guidance.mode);
}

function directionsLabel(directions: readonly MoveDirection[]): string {
    return directions
        .map((direction: MoveDirection): string => `${getI18N(direction_labels[direction]) ?? direction} ${direction_glyphs[direction]}`)
        .join(` ${getI18N(expedition_texts.or) ?? '/'} `);
}

/** Phrase d'état : direction à suivre, à reprendre, fin du tracé, ou pourquoi il n'y en a pas. */
export function guidanceLabel(part: MyExpeditionPart, position: GridPoint | null, guidance: RouteGuidance | null): string {
    if (part.cells.length < 2) return getI18N(expedition_texts.route_none) ?? '';
    if (!position) return getI18N(expedition_texts.route_unknown_position) ?? '';
    if (!guidance) return '';
    const ap: string = getI18N(expedition_texts.ap_short) ?? '';
    switch (guidance.mode) {
        case 'on_route':
            return `${getI18N(expedition_texts.route_follow)} ${directionsLabel(guidance.directions)}`;
        case 'back':
            return `${getI18N(expedition_texts.route_back)} ${directionsLabel(guidance.directions)} (${guidance.distance} ${ap})`;
        case 'arrived':
        default:
            return getI18N(expedition_texts.route_arrived) ?? '';
    }
}

/** Entrée de la liste : expédition (et partie s'il y en a plusieurs), ou nom du tracé sans expédition. */
function optionLabel(option: RouteOption): string {
    if (option.kind === 'route') return option.part.part.mapRoute?.label ?? '';
    const expedition: ApiExpedition = option.part.expedition;
    const pieces: string[] = [expedition.label?.trim() || (getI18N(expedition_texts.my_expedition_title) ?? '')];
    if ((expedition.parts?.length ?? 0) > 1) {
        pieces.push(option.part.part.label?.trim() || `${getI18N(expedition_texts.expedition_part)} ${option.part.part_rank}`);
    }
    return pieces.join(' · ');
}

/** Ajoute à la liste un groupe d'entrées titré `label` ; rien si `options` est vide. */
function appendOptionGroup(select: HTMLSelectElement, label: I18nLabel, options: readonly RouteOption[]): void {
    if (options.length === 0) return;
    const group: HTMLOptGroupElement = document.createElement('optgroup');
    group.label = getI18N(label) ?? '';
    options.forEach((option: RouteOption): void => {
        group.appendChild(new Option(optionLabel(option), option.value));
    });
    select.appendChild(group);
}

/** Reconstruit la liste seulement si ses entrées changent (une liste ouverte reste ouverte), puis sélectionne `chosen`. */
function updateChoice(select: HTMLSelectElement, options: readonly RouteOption[], chosen: RouteOption | null): void {
    const entries: string = options.map((option: RouteOption): string => `${option.value}=${optionLabel(option)}`).join('|');
    if (select.dataset.entries !== entries) {
        select.dataset.entries = entries;
        select.replaceChildren(new Option(getI18N(expedition_texts.no_route_followed) ?? '', ''));
        appendOptionGroup(select, expedition_texts.my_expeditions_group, options.filter((option: RouteOption): boolean => option.kind === 'part'));
        appendOptionGroup(select, expedition_texts.routes_without_expedition, options.filter((option: RouteOption): boolean => option.kind === 'route'));
    }
    select.value = chosen?.value ?? '';
}

/** Liste de choix du tracé suivi dans `block` ; `null` si elle n'y est pas encore. */
function routeSelect(block: HTMLElement): HTMLSelectElement | null {
    return block.querySelector<HTMLSelectElement>('select.mho-expedition-route-choice');
}

/** Bloc sous la carte, à côté de celui des informations complémentaires ; `null` hors de la page du désert. */
function ensureBlock(): HTMLElement | null {
    const existing: HTMLElement | null = document.getElementById(expedition_route_block_id);
    if (existing) return existing;

    const container: HTMLElement | null | undefined = document.querySelector('.map-box')?.parentElement?.parentElement;
    if (!container) return null;

    const block: HTMLDivElement = document.createElement('div');
    block.id = expedition_route_block_id;
    block.classList.add('row');

    const inner: HTMLDivElement = document.createElement('div');
    inner.classList.add('background', 'cell');
    inner.style.width = '100%';
    block.appendChild(inner);

    const header: HTMLHeadingElement = document.createElement('h5');
    header.classList.add('mho-expedition-route-header');
    inner.appendChild(header);

    const title: HTMLDivElement = document.createElement('div');
    title.classList.add('mho-expedition-route-title');
    header.appendChild(title);

    const icon: HTMLImageElement = document.createElement('img');
    icon.src = mh_optimizer_icon;
    icon.alt = '';
    icon.classList.add('mho-expedition-route-icon');
    title.appendChild(icon);

    const select: HTMLSelectElement = document.createElement('select');
    select.classList.add('mho-expedition-route-choice');
    select.title = getI18N(expedition_texts.route_choice) ?? '';
    select.setAttribute('aria-label', select.title);
    select.addEventListener('change', (): void => {
        const key: string | undefined = myExpeditionsKey();
        if (!key) return;
        void setRouteChoice(key, select.value);
        last_signature = undefined;
        renderExpeditionRoute();
    });
    title.appendChild(select);

    const reload: HTMLDivElement = document.createElement('div');
    reload.classList.add('mho-expedition-route-reload');
    reload.setAttribute('role', 'button');
    reload.title = getI18N(expedition_texts.reload_my_expedition) ?? '';
    reload.textContent = '🗘';
    reload.addEventListener('click', (): void => {
        reloadExpeditions(parsePosition(desertMap()?.querySelector('.current-location')?.textContent), true);
        reloadTownRoutes(true);
    });
    header.appendChild(reload);

    const content: HTMLDivElement = document.createElement('div');
    content.classList.add('mho-expedition-route-content');
    inner.appendChild(content);

    const cell_informations: Element | null = document.getElementById('cell-informations');
    if (cell_informations?.parentElement === container) {
        cell_informations.insertAdjacentElement('afterend', block);
    } else {
        container.appendChild(block);
    }
    return block;
}

/** Contenu du bloc pour l'entrée suivie ; vide sans tracé suivi. Un tracé sans expédition n'a pas de consignes. */
function fillBlock(block: HTMLElement, option: RouteOption | null, position: GridPoint | null, guidance: RouteGuidance | null, user_id: number, town: GridPoint): void {
    const content: HTMLElement | null = block.querySelector<HTMLElement>('.mho-expedition-route-content');
    if (!content) return;
    content.replaceChildren();
    if (!option) return;

    const part: MyExpeditionPart = option.part;

    const route_line: HTMLDivElement | null = part.cells.length >= 2 ? createRouteLine(part.part) : null;
    if (route_line) content.appendChild(route_line);
    content.appendChild(createLine('mho-expedition-route-status', guidanceLabel(part, position, guidance)));

    if (!position || option.kind === 'route') return;

    content.appendChild(createLine('mho-expedition-route-subtitle', getI18N(expedition_texts.cell_orders_header) ?? ''));
    const groups: PassageOrders[] = ordersByPassage(part.part, position, town, part.cells);
    const orders: CellOrder[] = groups.flatMap((group: PassageOrders): CellOrder[] => group.orders);
    const names: Map<number, string> | undefined = needsCitizenNames(orders, user_id) ? knownCitizenNames() : undefined;
    if (orders.length === 0) {
        content.appendChild(createLine('mho-expedition-route-empty', getI18N(expedition_texts.no_cell_orders) ?? ''));
    }
    appendPassageGroups(content, groups, user_id, names);

    const next: NextOrdersCell | null = nextOrdersCell(part.cells, position, myOrderIndexes(part.part, user_id, town, part.cells));
    if (next) {
        const ap: string = getI18N(expedition_texts.ap_short) ?? '';
        content.appendChild(createLine('mho-expedition-route-next', `${getI18N(expedition_texts.next_orders_cell)} ${formatCell(next.point)} · ${next.distance} ${ap}`));
    }
}

/** Ce qui change l'affichage : données, entrée suivie, position, direction, noms connus. */
function signatureOf(option: RouteOption | null, position: GridPoint | null, guidance: RouteGuidance | null): string {
    return [
        state.my_expeditions_key,
        state.my_expeditions_loaded_at,
        town_routes_key ?? '-',
        town_routes_loaded_at ?? '-',
        option?.value ?? '-',
        position ? pointKey(position) : '-',
        guidance ? `${guidance.mode}:${guidance.directions.join(',')}` : '-',
        citizen_names_town ?? '-',
        citizen_names?.size ?? 0
    ].join('|');
}

/** Met à jour flèches et bloc d'après la position affichée, les expéditions et tracés chargés et le tracé choisi. */
export function renderExpeditionRoute(): void {
    if (!isEnabled()) return;

    const map_element: HTMLElement | null = desertMap();
    const position: GridPoint | null = parsePosition(map_element?.querySelector('.current-location')?.textContent);
    reloadExpeditions(position, false);
    reloadTownRoutes(false);

    const user_id: number | undefined = state.mh_user?.id;
    const town: GridPoint | null = townPosition();
    const key: string | undefined = myExpeditionsKey();
    const expeditions: ApiExpedition[] = key && state.my_expeditions_key === key ? state.my_expeditions ?? [] : [];
    const routes: ApiMapRoute[] = key && town_routes_key === key ? town_routes : [];
    const options: RouteOption[] = map_element && user_id && town
        ? routeOptions(myExpeditionParts(expeditions, user_id, town), routes, town)
        : [];
    if (options.length === 0) {
        clearExpeditionRoute();
        return;
    }

    const chosen: RouteOption | null = chosenOption(options, routeChoice(key));
    const guidance: RouteGuidance | null = chosen && position ? routeGuidance(chosen.part.cells, position) : null;
    applyArrows(map_element, guidance);

    const block: HTMLElement | null = ensureBlock();
    if (!block) return;
    const select: HTMLSelectElement | null = routeSelect(block);
    if (select) updateChoice(select, options, chosen);
    const signature: string = signatureOf(chosen, position, guidance);
    if (signature === last_signature) return;
    last_signature = signature;
    fillBlock(block, chosen, position, guidance, user_id, town);
}

/** Suit la carte du désert tant que l'option est cochée (rejouable à chaque navigation, sans effet en double : clé de surveillance) ; lit une fois le choix du tracé suivi, puis rejoue le rendu. */
export function displayExpeditionRouteOnPage(): void {
    if (!isEnabled()) {
        unwatchRendered(watch_key);
        clearExpeditionRoute();
        return;
    }
    watchMap(watch_key, renderExpeditionRoute);
    if (!selection_loaded) {
        selection_loaded = true;
        void loadRouteChoice().then((): void => {
            last_signature = undefined;
            renderExpeditionRoute();
        });
    }
    renderExpeditionRoute();
}
