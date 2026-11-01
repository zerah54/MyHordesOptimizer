import { cssColorToHex } from './css-color.util';

describe('cssColorToHex', (): void => {
    it('rgb', (): void => expect(cssColorToHex('rgb(17, 34, 51)')).toBe('#112233'));
    it('rgba ignore l\'alpha', (): void => expect(cssColorToHex('rgba(17, 34, 51, 0.82)')).toBe('#112233'));
    it('syntaxe moderne avec espaces et alpha', (): void => expect(cssColorToHex('rgb(17 34 51 / 50%)')).toBe('#112233'));
    it('invalide', (): void => expect(cssColorToHex('light-dark(#000, #fff)')).toBeNull());
    it('vide', (): void => expect(cssColorToHex('')).toBeNull());
});
