import {
    DEFAULT_ROUTES_DISPLAY,
    isMapRouteKey,
    MapRouteKey,
    MapRoutesDisplay,
    pruneRoutesDisplay,
    sanitizeRoutesDisplay,
    setPersonalColor,
    toggleHidden
} from './map-routes-display';

describe('map-routes-display', (): void => {
    it('isMapRouteKey accepts mho-/game- keys only', (): void => {
        expect(isMapRouteKey('mho-12')).toBe(true);
        expect(isMapRouteKey('game-3')).toBe(true);
        expect(isMapRouteKey('mho-')).toBe(false);
        expect(isMapRouteKey('route-1')).toBe(false);
        expect(isMapRouteKey(12)).toBe(false);
    });

    describe('sanitizeRoutesDisplay', (): void => {
        it('falls back to the defaults for a missing or corrupted entry', (): void => {
            expect(sanitizeRoutesDisplay(undefined)).toEqual(DEFAULT_ROUTES_DISPLAY);
            expect(sanitizeRoutesDisplay('oops')).toEqual(DEFAULT_ROUTES_DISPLAY);
        });

        it('drops malformed keys, unknown colours and duplicates', (): void => {
            const display: MapRoutesDisplay = sanitizeRoutesDisplay({
                hidden: ['mho-1', 'mho-1', 'nope', 4],
                colors: { 'mho-1': 'teal', 'mho-2': '#ff0000', bad: 'blue' },
                show_previous_days: 'yes'
            });

            expect(display).toEqual({ hidden: ['mho-1'], colors: { 'mho-1': 'teal' }, show_previous_days: false });
        });
    });

    describe('pruneRoutesDisplay', (): void => {
        const display: MapRoutesDisplay = { hidden: ['mho-1', 'game-2'], colors: { 'mho-1': 'pink', 'mho-3': 'cyan' }, show_previous_days: true };

        it('removes the settings of routes that no longer exist', (): void => {
            const existing: Set<MapRouteKey> = new Set<MapRouteKey>(['mho-1']);

            expect(pruneRoutesDisplay(display, existing)).toEqual({ hidden: ['mho-1'], colors: { 'mho-1': 'pink' }, show_previous_days: true });
        });

        it('returns null when nothing changes', (): void => {
            const existing: Set<MapRouteKey> = new Set<MapRouteKey>(['mho-1', 'game-2', 'mho-3']);

            expect(pruneRoutesDisplay(display, existing)).toBeNull();
        });
    });

    it('toggleHidden adds then removes a key', (): void => {
        const hidden: MapRoutesDisplay = toggleHidden(DEFAULT_ROUTES_DISPLAY, 'mho-4');

        expect(hidden.hidden).toEqual(['mho-4']);
        expect(toggleHidden(hidden, 'mho-4').hidden).toEqual([]);
    });

    it('setPersonalColor sets then resets a personal colour', (): void => {
        const coloured: MapRoutesDisplay = setPersonalColor(DEFAULT_ROUTES_DISPLAY, 'mho-4', 'plum');

        expect(coloured.colors).toEqual({ 'mho-4': 'plum' });
        expect(setPersonalColor(coloured, 'mho-4', null).colors).toEqual({});
        expect(DEFAULT_ROUTES_DISPLAY.colors).toEqual({});
    });
});
