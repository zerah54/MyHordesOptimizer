import { isMapRouteColor, MapRouteColor } from '../../../_abstract_model/types/map-route.class';

/** Identifiant d'affichage : tracés MHO et itinéraires du jeu ont des identifiants indépendants. */
export type MapRouteKey = `mho-${number}` | `game-${number}`;

const ROUTE_KEY_PATTERN: RegExp = /^(mho|game)-\d+$/;

export function mapRouteKey(kind: 'mho' | 'game', id: number): MapRouteKey {
    return kind === 'mho' ? `mho-${id}` : `game-${id}`;
}

export function isMapRouteKey(value: unknown): value is MapRouteKey {
    return typeof value === 'string' && ROUTE_KEY_PATTERN.test(value);
}

/** Réglages d'affichage des tracés, propres à l'appareil (enregistrés avec les autres options de carte). */
export interface MapRoutesDisplay {
    /** Tracés masqués à l'œil. */
    hidden: MapRouteKey[];
    /** Couleurs « pour moi seulement », à la place de la couleur commune. */
    colors: Partial<Record<MapRouteKey, MapRouteColor>>;
    /** Affiche aussi les tracés liés aux expéditions des jours précédents. */
    show_previous_days: boolean;
}

export const DEFAULT_ROUTES_DISPLAY: MapRoutesDisplay = { hidden: [], colors: {}, show_previous_days: false };

/** Réglages relus du stockage : toute entrée mal formée est écartée plutôt que de casser la carte. */
export function sanitizeRoutesDisplay(stored: unknown): MapRoutesDisplay {
    if (!stored || typeof stored !== 'object') return { ...DEFAULT_ROUTES_DISPLAY, hidden: [], colors: {} };
    const candidate: Partial<Record<keyof MapRoutesDisplay, unknown>> = <Partial<Record<keyof MapRoutesDisplay, unknown>>>stored;
    const hidden: MapRouteKey[] = Array.isArray(candidate.hidden) ? [...new Set(candidate.hidden.filter(isMapRouteKey))] : [];
    const colors: Partial<Record<MapRouteKey, MapRouteColor>> = {};
    if (candidate.colors && typeof candidate.colors === 'object') {
        for (const [key, color] of Object.entries(candidate.colors)) {
            if (isMapRouteKey(key) && isMapRouteColor(color)) {
                colors[key] = color;
            }
        }
    }
    return { hidden, colors, show_previous_days: candidate.show_previous_days === true };
}

/**
 * Retire les réglages des tracés disparus (supprimés, ou itinéraires du jeu effacés chaque nuit). Renvoie
 * `null` si rien n'a changé, pour ne pas réécrire le stockage à chaque chargement.
 */
export function pruneRoutesDisplay(display: MapRoutesDisplay, existing: ReadonlySet<MapRouteKey>): MapRoutesDisplay | null {
    const hidden: MapRouteKey[] = display.hidden.filter((key: MapRouteKey): boolean => existing.has(key));
    const color_keys: MapRouteKey[] = (<MapRouteKey[]>Object.keys(display.colors)).filter((key: MapRouteKey): boolean => existing.has(key));
    if (hidden.length === display.hidden.length && color_keys.length === Object.keys(display.colors).length) return null;
    const colors: Partial<Record<MapRouteKey, MapRouteColor>> = {};
    for (const key of color_keys) {
        colors[key] = display.colors[key];
    }
    return { ...display, hidden, colors };
}

export function toggleHidden(display: MapRoutesDisplay, key: MapRouteKey): MapRoutesDisplay {
    const hidden: MapRouteKey[] = display.hidden.includes(key)
        ? display.hidden.filter((hidden_key: MapRouteKey): boolean => hidden_key !== key)
        : [...display.hidden, key];
    return { ...display, hidden };
}

/** `null` rend au tracé sa couleur commune. */
export function setPersonalColor(display: MapRoutesDisplay, key: MapRouteKey, color: MapRouteColor | null): MapRoutesDisplay {
    const colors: Partial<Record<MapRouteKey, MapRouteColor>> = { ...display.colors };
    if (color) {
        colors[key] = color;
    } else {
        delete colors[key];
    }
    return { ...display, colors };
}
