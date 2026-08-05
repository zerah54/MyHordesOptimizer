import { PictosHighlightedCell } from './368-pictos-highlighted-cell.pipe';

describe('PictosHighlightedCell', (): void => {
    let pipe: PictosHighlightedCell;

    beforeEach((): void => {
        pipe = new PictosHighlightedCell();
    });

    it('returns false when there are no highlighted cells', (): void => {
        expect(pipe.transform([], 1, 1)).toBe(false);
    });

    it('returns true when the given cell is highlighted', (): void => {
        const highlighted_cells: [{ row: number, col: number; }, { row: number, col: number; }] = [{ row: 1, col: 2 }, { row: 3, col: 4 }];

        expect(pipe.transform(highlighted_cells, 3, 4)).toBe(true);
    });

    it('returns false when the given cell is not highlighted', (): void => {
        const highlighted_cells: [{ row: number, col: number; }, { row: number, col: number; }] = [{ row: 1, col: 2 }, { row: 3, col: 4 }];

        expect(pipe.transform(highlighted_cells, 5, 6)).toBe(false);
    });
});
