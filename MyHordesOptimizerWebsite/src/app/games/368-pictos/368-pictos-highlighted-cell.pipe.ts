import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: 'pictosHighlightedCell'
})
export class PictosHighlightedCell implements PipeTransform {
    transform(highlighted_cells: [ { row: number, col: number; }, { row: number, col: number; } ] | [], row: number, col: number): boolean {
        if (highlighted_cells.length === 0) return false;
        return highlighted_cells.some((cell: { row: number, col: number; }) => cell.row === row && cell.col === col);
    }
}
