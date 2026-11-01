import { mapThemeVariables } from './map-theme-variables';

describe('map-theme-variables', (): void => {
    it('préfixe les jetons', (): void => expect(mapThemeVariables({ 'map-l0': '#112233' })['--mho-map-l0']).toBe('#112233'));
    it('garde l\'opacité des hachures', (): void => expect(mapThemeVariables({ 'map-hatch': '#112233' })['--mho-map-hatch']).toBe('rgba(17, 34, 51, 0.08)'));
    it('garde l\'opacité du marqueur', (): void => expect(mapThemeVariables({ 'map-marker': '#112233' })['--mho-map-marker']).toBe('rgba(17, 34, 51, 0.85)'));
    it('map-fg alimente aussi les valeurs sans icône', (): void => expect(mapThemeVariables({ 'map-fg': '#112233' })['--mho-map-bare-fg']).toBe('#112233'));
    it('sans map-fg, pas de --mho-map-bare-fg', (): void => expect('--mho-map-bare-fg' in mapThemeVariables({ 'map-l0': '#112233' })).toBe(false));
    it('thème vide : aucune variable', (): void => expect(Object.keys(mapThemeVariables({})).length).toBe(0));
});
