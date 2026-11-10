import { sitePage } from './site-pages';

describe('sitePage', (): void => {
    it('donne le libellé d\'une page du site', (): void => {
        expect(sitePage('townBank').label).toBe('Banque');
        expect(sitePage('toolsOverflow').label).toBe('Simulateur de débordement');
    });

    it('distingue les bâtiments d\'extérieur des chantiers dans le wiki', (): void => {
        expect(sitePage('wikiRuins').label).toBe('Bâtiments');
        expect(sitePage('wikiBuildings').label).toBe('Chantiers');
    });
});
