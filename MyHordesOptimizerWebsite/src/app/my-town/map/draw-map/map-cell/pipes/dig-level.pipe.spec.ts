import { DIG_LEVELS, DigLevelInfo, DigLevelLabelPipe, digLevelOf } from './dig-level.pipe';

describe('dig levels', (): void => {
    it('follows the thresholds of the game', (): void => {
        expect([0, 1, 2, 3, 6, 7, 15].map((remaining: number): number => digLevelOf(remaining))).toEqual([0, 1, 1, 2, 2, 3, 3]);
        expect(digLevelOf(-3)).toBe(0);
    });

    it('lists the four levels in order', (): void => {
        expect(DIG_LEVELS.map((info: DigLevelInfo): number => info.level)).toEqual([0, 1, 2, 3]);
    });

    it('gives the label of the game, and nothing outside the scale', (): void => {
        const pipe: DigLevelLabelPipe = new DigLevelLabelPipe();
        expect(pipe.transform(0)).toBe(DIG_LEVELS[0].label);
        expect(pipe.transform(3)).toBe(DIG_LEVELS[3].label);
        expect(pipe.transform(null)).toBe('');
        expect(pipe.transform(4)).toBe('');
    });
});
