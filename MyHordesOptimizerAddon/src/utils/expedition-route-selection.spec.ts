import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mho_expedition_route_choice_key } from '../config/constants';
import type { ApiExpeditionPartRoute } from '../types';
import type { GridPoint, MyExpeditionPart } from './expedition-route';
import type { RouteOption } from './expedition-route-selection';

/** Mêmes fonctions simulées pour chaque nouvel import du module (`vi.resetModules`) */
const storage: { getStorageItem: ReturnType<typeof vi.fn>; setStorageItem: ReturnType<typeof vi.fn> } = vi.hoisted(() => ({
    getStorageItem: vi.fn(),
    setStorageItem: vi.fn()
}));

vi.mock('./storage', () => storage);

const getStorageItemMock: ReturnType<typeof vi.fn> = storage.getStorageItem;
const setStorageItemMock: ReturnType<typeof vi.fn> = storage.setStorageItem;

type SelectionModule = typeof import('./expedition-route-selection');

/** Le choix est gardé en mémoire par le module : chaque test en repart d'un neuf */
async function freshModule(): Promise<SelectionModule> {
    vi.resetModules();
    return import('./expedition-route-selection');
}

const town: GridPoint = { x: 10, y: 10 };

/** Partie où je suis inscrit, au tracé vertical en x relatif `x` */
function myPart(id: number, x: number): MyExpeditionPart {
    return {
        expedition: { id, label: `Expé ${id}`, parts: [] },
        part: { id },
        part_rank: 1,
        cells: [{ x, y: 0 }, { x, y: 1 }]
    };
}

function townRoute(id: number): ApiExpeditionPartRoute {
    return { id, label: `Tracé ${id}`, color: 'teal', cells: [{ x: 10, y: 10 }, { x: 11, y: 10 }], length: 1, version: 1 };
}

describe('expedition-route-selection', (): void => {
    beforeEach((): void => {
        getStorageItemMock.mockReset();
        getStorageItemMock.mockResolvedValue(undefined);
        setStorageItemMock.mockReset();
        setStorageItemMock.mockResolvedValue(undefined);
    });

    it('routeOptions : mes parties, puis les tracés sans expédition en coordonnées relatives', async (): Promise<void> => {
        const selection: SelectionModule = await freshModule();

        const options: RouteOption[] = selection.routeOptions([myPart(12, 0)], [townRoute(5)], town);

        expect(options.map((option: RouteOption): string => option.value)).toEqual(['part:12', 'route:5']);
        expect(options.map((option: RouteOption): string => option.kind)).toEqual(['part', 'route']);
        expect(options[1].part.part.mapRoute?.id).toBe(5);
        expect(options[1].part.cells).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    });

    it('chosenOption : le choix enregistré, sinon aucun tracé suivi', async (): Promise<void> => {
        const selection: SelectionModule = await freshModule();
        const options: RouteOption[] = selection.routeOptions([myPart(12, 0), myPart(13, 5)], [townRoute(5)], town);

        expect(selection.chosenOption(options, 'route:5')?.value).toBe('route:5');
        expect(selection.chosenOption(options, 'part:13')?.value).toBe('part:13');
        expect(selection.chosenOption(options, '')).toBeNull();
        expect(selection.chosenOption(options, undefined)).toBeNull();
    });

    it('chosenOption : sans choix enregistré, la seule expédition où je suis inscrit est suivie par défaut', async (): Promise<void> => {
        const selection: SelectionModule = await freshModule();
        const one: RouteOption[] = selection.routeOptions([myPart(12, 0)], [townRoute(5)], town);
        const two: RouteOption[] = selection.routeOptions([myPart(12, 0), myPart(13, 5)], [], town);

        expect(selection.chosenOption(one, undefined)?.value).toBe('part:12');
        expect(selection.chosenOption(one, '')).toBeNull();
        expect(selection.chosenOption(two, undefined)).toBeNull();
        expect(selection.chosenOption(selection.routeOptions([], [townRoute(5)], town), undefined)).toBeNull();
    });

    it('chosenOption : un choix devenu invalide ne suit aucun tracé', async (): Promise<void> => {
        const selection: SelectionModule = await freshModule();

        expect(selection.chosenOption(selection.routeOptions([myPart(12, 0)], [], town), 'route:5')).toBeNull();
        expect(selection.chosenOption(selection.routeOptions([], [townRoute(5)], town), 'part:12')).toBeNull();
    });

    it('lit le choix enregistré une fois, pour sa ville et son jour seulement', async (): Promise<void> => {
        getStorageItemMock.mockResolvedValue({ key: '1:5', value: 'route:5' });
        const selection: SelectionModule = await freshModule();

        expect(selection.routeChoice('1:5')).toBeUndefined();
        await selection.loadRouteChoice();
        await selection.loadRouteChoice();

        expect(getStorageItemMock).toHaveBeenCalledTimes(1);
        expect(getStorageItemMock).toHaveBeenCalledWith(mho_expedition_route_choice_key);
        expect(selection.routeChoice('1:5')).toBe('route:5');
        expect(selection.routeChoice('1:6')).toBeUndefined();
    });

    it('ignore une valeur enregistrée mal formée', async (): Promise<void> => {
        getStorageItemMock.mockResolvedValue({ key: '1:5', value: 5 });
        const selection: SelectionModule = await freshModule();

        await selection.loadRouteChoice();

        expect(selection.routeChoice('1:5')).toBeUndefined();
    });

    it('enregistre le choix et l\'applique aussitôt', async (): Promise<void> => {
        const selection: SelectionModule = await freshModule();

        await selection.setRouteChoice('1:5', '');

        expect(selection.routeChoice('1:5')).toBe('');
        expect(setStorageItemMock).toHaveBeenCalledWith(mho_expedition_route_choice_key, { key: '1:5', value: '' });
    });
});
