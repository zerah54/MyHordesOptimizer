import { mho_expedition_route_choice_key } from '../config/constants';
import type { ApiExpeditionPartRoute, ApiMapPoint } from '../types';
import { type GridPoint, type MyExpeditionPart, toRelative } from './expedition-route';
import { getStorageItem, setStorageItem } from './storage';

/** Tracé suivi choisi sous la carte : une de mes parties du jour (`part:{id}`), un tracé de la ville sans expédition (`route:{id}`) ou aucun (`''`) ; sans choix valide, aucun tracé n'est suivi ; vaut pour une ville et un jour. */
interface StoredRouteChoice {
    /** Ville et jour (`townId:day`, cf. `myExpeditionsKey`) */
    readonly key: string;
    readonly value: string;
}

type RouteOptionKind = 'part' | 'route';

/** Une entrée de la liste : `part` porte le tracé (sans consignes ni membres pour un tracé sans expédition). */
export interface RouteOption {
    readonly value: string;
    readonly kind: RouteOptionKind;
    readonly part: MyExpeditionPart;
}

let choice: StoredRouteChoice | undefined;
let loading: Promise<void> | undefined;

/** Indique si `value` a la forme d'un choix enregistré (clé et valeur textuelles). */
function isStoredRouteChoice(value: unknown): value is StoredRouteChoice {
    if (typeof value !== 'object' || value === null) return false;
    const candidate: { key?: unknown; value?: unknown } = value as { key?: unknown; value?: unknown };
    return typeof candidate.key === 'string' && typeof candidate.value === 'string';
}

/** Mes parties, puis les tracés sans expédition (coordonnées absolues de l'API, ville en `town`). */
export function routeOptions(parts: readonly MyExpeditionPart[], routes: readonly ApiExpeditionPartRoute[], town: GridPoint): RouteOption[] {
    return [
        ...parts.map((part: MyExpeditionPart): RouteOption => ({ value: `part:${part.part.id}`, kind: 'part', part })),
        ...routes.map((route: ApiExpeditionPartRoute): RouteOption => ({
            value: `route:${route.id}`,
            kind: 'route',
            part: {
                expedition: { label: null, parts: [] },
                part: { id: null, mapRoute: route, citizens: [], orders: [] },
                part_rank: 1,
                cells: (route.cells ?? []).map((point: ApiMapPoint): GridPoint => toRelative(point, town))
            }
        }))
    ];
}

/** Entrée suivie : celle enregistrée ; sans choix enregistré, ma seule expédition s'il n'y en a qu'une ; sinon `null` (rien n'est alors affiché). */
export function chosenOption(options: readonly RouteOption[], stored: string | undefined): RouteOption | null {
    if (stored === undefined) {
        const parts: RouteOption[] = options.filter((option: RouteOption): boolean => option.kind === 'part');
        return parts.length === 1 ? parts[0] : null;
    }
    return options.find((option: RouteOption): boolean => option.value === stored) ?? null;
}

/** Choix enregistré pour `key` ; `undefined` pour un autre jour, ou tant que le stockage n'est pas lu. */
export function routeChoice(key: string | undefined): string | undefined {
    return key && choice?.key === key ? choice.value : undefined;
}

/** Lit le choix enregistré, une seule fois pour la page. */
export function loadRouteChoice(): Promise<void> {
    loading ??= getStorageItem(mho_expedition_route_choice_key).then((stored: unknown): void => {
        /** Un choix fait pendant la lecture l'emporte sur la valeur lue */
        if (choice === undefined && isStoredRouteChoice(stored)) {
            choice = stored;
        }
    });
    return loading;
}

/** Choisit le tracé suivi, et l'enregistre. */
export function setRouteChoice(key: string, value: string): Promise<void> {
    choice = { key, value };
    return setStorageItem(mho_expedition_route_choice_key, choice);
}
