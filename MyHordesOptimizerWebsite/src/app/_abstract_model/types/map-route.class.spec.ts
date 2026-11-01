import { toMapRouteStopMode } from './map-route.class';

describe('toMapRouteStopMode', (): void => {
    it('garde les modes connus du site', (): void => {
        expect(toMapRouteStopMode('best')).toBe('best');
        expect(toMapRouteStopMode('l')).toBe('l');
        expect(toMapRouteStopMode('items')).toBe('items');
    });

    it('ramène un mode inconnu ou absent au meilleur potentiel', (): void => {
        expect(toMapRouteStopMode('zigzag')).toBe('best');
        expect(toMapRouteStopMode('')).toBe('best');
        expect(toMapRouteStopMode(null)).toBe('best');
        expect(toMapRouteStopMode(undefined)).toBe('best');
    });
});
