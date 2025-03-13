import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, FormsModule, ReactiveFormsModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatButtonToggleModule, MatCardModule, MatFormFieldModule, MatInputModule];

@Component({
    selector: 'mho-minesweeper',
    templateUrl: 'minesweeper.component.html',
    styleUrls: ['minesweeper.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MinesweeperComponent implements OnInit {
    public board: Cell[][] = [];
    public remaining_mines: number = 0;
    public game_over: boolean = false;
    public custom_size_form: FormGroup;
    public timer: number = 0;

    public sizes_list: MinesweeperSize[] = [
        {id: 'small', label: $localize`Facile`, height: 9, width: 9, mines: 10},
        {id: 'medium', label: $localize`Moyen`, height: 16, width: 16, mines: 40, default: true},
        {id: 'large', label: $localize`Difficile`, height: 16, width: 30, mines: 99},
        {id: 'expert', label: $localize`Expert`, height: 50, width: 50, mines: 500},
        {id: 'impossible', label: $localize`Impossible`, height: 100, width: 100, mines: 2000},
        {id: 'custom', label: $localize`Personnalisé`, height: 16, width: 30, mines: 120}
    ];
    public selected_size: MinesweeperSize = this.sizes_list.find((size: MinesweeperSize) => size.default) ?? this.sizes_list[0];

    public themes_list: MinesweeperTheme[] = [
        {id: 'legacy', label: $localize`Classique`, default: true},
        // { id: 'modern', label: $localize`Moderne` },
        {id: 'myhordes', label: `MyHordes`}
    ];
    public selected_theme: MinesweeperTheme = this.themes_list.find((theme: MinesweeperTheme) => theme.default) ?? this.themes_list[0];

    constructor(private fb: FormBuilder) {
        this.custom_size_form = this.fb.group({
            width: [10, [Validators.required, Validators.min(10)]],
            height: [10, [Validators.required, Validators.min(10)]],
            mines: [10, [Validators.required, Validators.min(1)]]
        });
    }

    public ngOnInit(): void {
        this.resetGame();
    }

    public resetGame(): void {
        if (this.selected_size.id === 'custom') {
            this.selected_size.width = Math.max(1, this.selected_size.width);
            this.selected_size.height = Math.max(1, this.selected_size.height);
            this.selected_size.mines = Math.min(Math.max(1, this.selected_size.height), this.selected_size.width * this.selected_size.height);
        }
        this.initializeBoard(this.selected_size.width, this.selected_size.height, this.selected_size.mines);
        this.game_over = false;
        this.remaining_mines = this.selected_size.mines;
        this.timer = 0;
    }

    private initializeBoard(width: number, height: number, mines: number): void {
        this.board = Array(height).fill(null).map(() =>
            Array(width).fill(null).map(() => ({
                is_mine: false,
                is_revealed: false,
                is_flagged: false,
                is_questioned: false,
                is_highlighted: false,
                is_game_over: false,
                adjacent_mines: 0
            }))
        );

        let placedMines: number = 0;
        while (placedMines < mines) {
            const x: number = Math.floor(Math.random() * width);
            const y: number = Math.floor(Math.random() * height);
            if (!this.board[y][x].is_mine) {
                this.board[y][x].is_mine = true;
                placedMines++;
                this.incrementAdjacentCells(x, y);
            }
        }
    }

    private incrementAdjacentCells(x: number, y: number): void {
        for (let i: number = -1; i <= 1; i++) {
            for (let j: number = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const new_x: number = x + i;
                const new_y: number = y + j;
                if (new_x >= 0 && new_x < this.board[0].length && new_y >= 0 && new_y < this.board.length) {
                    this.board[new_y][new_x].adjacent_mines++;
                }
            }
        }
    }

    public revealCell(i: number, j: number): void {
        if (this.game_over || this.board[i][j].is_flagged || this.board[i][j].is_questioned) return;

        if (this.board[i][j].is_revealed) {
            this.revealAdjacentIfSafe(i, j);
            return;
        }

        this.board[i][j].is_revealed = true;

        if (this.board[i][j].is_mine) {
            this.board[i][j].is_game_over = true;
            this.game_over = true;
            this.revealAllMines();
        } else if (this.board[i][j].adjacent_mines === 0) {
            this.revealAdjacentCells(i, j);
        }

        this.checkWinCondition();
    }

    private revealAdjacentIfSafe(i: number, j: number): void {
        let flagged_count: number = 0;
        for (let x: number = -1; x <= 1; x++) {
            for (let y: number = -1; y <= 1; y++) {
                const new_i: number = i + x;
                const new_j: number = j + y;
                if (this.isValidCell(new_i, new_j) && (this.board[new_i][new_j].is_flagged || this.board[new_i][new_j].is_questioned)) {
                    flagged_count++;
                }
            }
        }

        if (flagged_count === this.board[i][j].adjacent_mines) {
            for (let x: number = -1; x <= 1; x++) {
                for (let y: number = -1; y <= 1; y++) {
                    const new_i: number = i + x;
                    const new_j: number = j + y;
                    if (this.isValidCell(new_i, new_j) && !this.board[new_i][new_j].is_revealed && !this.board[new_i][new_j].is_flagged && !this.board[new_i][new_j].is_questioned) {
                        this.revealCell(new_i, new_j);
                    }
                }
            }
        }
    }

    private revealAdjacentCells(i: number, j: number): void {
        for (let x: number = -1; x <= 1; x++) {
            for (let y: number = -1; y <= 1; y++) {
                const new_i: number = i + x;
                const new_j: number = j + y;
                if (new_i >= 0 && new_i < this.board.length && new_j >= 0 && new_j < this.board[0].length) {
                    if (!this.board[new_i][new_j].is_revealed && !this.board[new_i][new_j].is_flagged && !this.board[new_i][new_j].is_questioned) {
                        this.revealCell(new_i, new_j);
                    }
                }
            }
        }
    }

    public cycleMarker(i: number, j: number, event: Event): void {
        event.preventDefault();
        if (this.game_over || this.board[i][j].is_revealed) return;

        const cell: Cell = this.board[i][j];

        if (!cell.is_flagged && !cell.is_questioned) {
            cell.is_flagged = true;
            this.remaining_mines--;
        } else if (cell.is_flagged) {
            cell.is_flagged = false;
            cell.is_questioned = true;
            this.remaining_mines++;
        } else {
            cell.is_questioned = false;
        }
    }

    private revealAllMines(): void {
        this.board.forEach((row: Cell[]) => {
            row.forEach((cell: Cell) => {
                if (cell.is_mine) cell.is_revealed = true;
            });
        });
    }

    private checkWinCondition(): void {
        const all_non_mines_revealed: boolean = this.board.every((row: Cell[]) =>
            row.every((cell: Cell) => cell.is_revealed || cell.is_mine)
        );

        if (all_non_mines_revealed && this.remaining_mines === 0) {
            this.game_over = true;
        }
    }

    public highlightAdjacentCells(i: number, j: number, event: MouseEvent): void {
        if (event.button !== 0 || !this.board[i][j].is_revealed || this.board[i][j].adjacent_mines === 0) return;

        this.board[i][j].is_highlighted = true;

        for (let x: number = -1; x <= 1; x++) {
            for (let y: number = -1; y <= 1; y++) {
                const new_i: number = i + x;
                const new_j: number = j + y;
                if (this.isValidCell(new_i, new_j) && !this.board[new_i][new_j].is_revealed && !this.board[new_i][new_j].is_flagged && !this.board[new_i][new_j].is_questioned) {
                    this.board[new_i][new_j].is_highlighted = true;
                }
            }
        }
    }

    public unhighlightCells(): void {
        this.board.forEach((row: Cell[]) => {
            row.forEach((cell: Cell) => {
                cell.is_highlighted = false;
            });
        });
    }

    private isValidCell(i: number, j: number): boolean {
        return i >= 0 && i < this.board.length && j >= 0 && j < this.board[0].length;
    }

}

interface Cell {
    is_mine: boolean;
    is_revealed: boolean;
    is_flagged: boolean;
    adjacent_mines: number;
    is_questioned: boolean;
    is_highlighted: boolean;
    is_game_over: boolean;
}

interface MinesweeperTheme {
    id: string;
    label: string;
    default?: boolean;
}

interface MinesweeperSize {
    id: string;
    label: string;
    height: number;
    width: number;
    mines: number;
    default?: boolean;
}
