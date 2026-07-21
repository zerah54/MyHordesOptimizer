import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import moment, { Moment } from 'moment';

import { Imports } from '../../_abstract_model/types/_types';
import { CounterFromDatePipe, DiffBetweenDatesPipe } from '../../_core/utilities/date.util';
import { GeneratedBoard, generateSolvableBoard } from './minesweeper-generator.util';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatMenuModule, MatIconModule];

@Component({
    selector: 'mho-minesweeper',
    templateUrl: 'minesweeper.component.html',
    styleUrls: ['minesweeper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes, CounterFromDatePipe, DiffBetweenDatesPipe, MatCheckbox]
})
export class MinesweeperComponent implements OnInit, OnDestroy {
    protected board: WritableSignal<Cell[][]> = signal([]);
    protected remaining_mines: WritableSignal<number> = signal(0);
    protected game_over: WritableSignal<boolean> = signal(false);
    protected start_time: WritableSignal<Moment | undefined> = signal(undefined);
    protected end_time: WritableSignal<Moment | undefined> = signal(undefined);
    private board_initialized: WritableSignal<boolean> = signal(false);
    protected seed: WritableSignal<number | undefined> = signal(Math.floor(Math.random() * 0xFFFFFFFF));
    protected random_seed: WritableSignal<boolean> = signal(true);

    protected readonly Math: Math = Math;

    protected sizes_list: Signal<MinesweeperSize[]> = signal([
        { id: 'small', label: $localize`Facile`, height: 9, width: 9, mines: 10 },
        { id: 'medium', label: $localize`Moyen`, height: 16, width: 16, mines: 40, default: true },
        { id: 'large', label: $localize`Difficile`, height: 16, width: 30, mines: 99 },
        { id: 'expert', label: $localize`Expert`, height: 50, width: 50, mines: 500 },
        { id: 'impossible', label: $localize`Impossible`, height: 100, width: 100, mines: 2000 },
        { id: 'custom', label: $localize`Personnalisé`, height: 16, width: 30, mines: 120 }
    ]);
    protected selected_size: WritableSignal<MinesweeperSize> = signal(this.sizes_list().find((size: MinesweeperSize) => size.default) ?? this.sizes_list()[0]);

    protected selected_theme: WritableSignal<'legacy' | 'myhordes'> = signal('legacy');
    private preloadLinks: WritableSignal<HTMLLinkElement[]> = signal([]);

    public ngOnInit(): void {
        this.resetGame();

        const images: string[] = [
            'img/minesweeper/bomb.png', 'img/minesweeper/bombflagged.png', 'img/minesweeper/bombquestion.png', 'img/minesweeper/nobomb.png',
            'img/minesweeper/smile.png', 'img/minesweeper/lose.png', 'img/minesweeper/win.png',
            ...Array.from({ length: 8 }, (_: unknown, i: number) => `img/minesweeper/adjacent_${i + 1}.png`),
            ...Array.from({ length: 10 }, (_: unknown, i: number) => `img/minesweeper/timer_${i}.png`),
        ];

        this.preloadLinks.set(images.map((name: string) => {
            const link: HTMLLinkElement = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = name;
            document.head.appendChild(link);
            return link;
        }));
    }

    public ngOnDestroy(): void {
        this.preloadLinks.update((links: HTMLLinkElement[]) => {
            links.forEach((link: HTMLLinkElement) => link.remove());
            return links;
        });
    }

    protected revealCell(i: number, j: number): void {
        if (this.game_over() || this.board()[i][j].is_flagged || this.board()[i][j].is_questioned) return;

        if (!this.board_initialized()) {
            this.initializeBoard(this.selected_size().width, this.selected_size().height, this.selected_size().mines, j, i);
            this.board_initialized.set(true);
            this.start_time.set(moment());
            this.end_time.set(undefined);
        }

        if (this.board()[i][j].is_revealed) {
            this.revealAdjacentIfSafe(i, j);
            return;
        }

        this.board.update((board: Cell[][]) => {
            board[i][j].is_revealed = true;
            return board;
        });

        if (this.board()[i][j].is_mine) {
            this.board.update((board: Cell[][]) => {
                board[i][j].is_game_over = true;
                return board;
            });
            this.game_over.set(true);
            this.end_time.set(moment());
            this.revealAllMines();
        } else if (this.board()[i][j].adjacent_mines === 0) {
            this.revealAdjacentCells(i, j);
        }

        this.checkWinCondition();
    }

    protected resetGame(new_selected_size?: Partial<MinesweeperSize>): void {
        if (new_selected_size) {
            this.selected_size.update((selected_size: MinesweeperSize) => {
                if (new_selected_size.id) {
                    selected_size = new_selected_size as MinesweeperSize;
                } else {
                    if (new_selected_size.width) selected_size.width = new_selected_size.width;
                    if (new_selected_size.height) selected_size.height = new_selected_size.height;
                    if (new_selected_size.mines) selected_size.mines = new_selected_size.mines;
                }
                return selected_size;
            });
        }
        if (this.selected_size().id === 'custom') {
            this.selected_size.update((selected_size: MinesweeperSize) => {
                selected_size.width = Math.max(1, selected_size.width);
                selected_size.height = Math.max(1, selected_size.height);
                selected_size.mines = Math.min(Math.max(1, selected_size.height), selected_size.width * selected_size.height);
                return selected_size;
            });
        }
        this.initializeBoard(this.selected_size().width, this.selected_size().height, this.selected_size().mines);
        this.board_initialized.set(false);
        this.game_over.set(false);
        this.remaining_mines.set(this.selected_size().mines);
        this.start_time.set(undefined);
        this.end_time.set(undefined);
    }

    protected cycleMarker(i: number, j: number, event: Event): void {
        event.preventDefault();
        if (this.game_over() || this.board()[i][j].is_revealed) return;

        this.board.update((board: Cell[][]) => {
            const cell: Cell = board[i][j];
            if (!cell.is_flagged && !cell.is_questioned) {
                cell.is_flagged = true;
                this.remaining_mines.update((remaining_mines: number) => {
                    remaining_mines--;
                    return remaining_mines;
                });
            } else if (cell.is_flagged) {
                cell.is_flagged = false;
                cell.is_questioned = true;
                this.remaining_mines.update((remaining_mines: number) => {
                    remaining_mines++;
                    return remaining_mines;
                });
            } else {
                cell.is_questioned = false;
            }
            return board;
        });

        this.checkWinCondition();
    }

    protected highlightAdjacentCells(i: number, j: number, event: MouseEvent): void {
        if (event.button !== 0 || !this.board()[i][j].is_revealed || this.board()[i][j].adjacent_mines === 0 || this.game_over()) return;

        this.board.update((board: Cell[][]) => {
            board[i][j].is_highlighted = true;
            return board;
        });

        for (let x: number = -1; x <= 1; x++) {
            for (let y: number = -1; y <= 1; y++) {
                const new_i: number = i + x;
                const new_j: number = j + y;
                if (this.isValidCell(new_i, new_j) && !this.board()[new_i][new_j].is_revealed && !this.board()[new_i][new_j].is_flagged && !this.board()[new_i][new_j].is_questioned) {
                    this.board.update((board: Cell[][]) => {
                        board[new_i][new_j].is_highlighted = true;
                        return board;
                    });
                }
            }
        }
    }

    protected unhighlightCells(): void {
        this.board.update((board: Cell[][]) => {
            board.forEach((row: Cell[]) => {
                row.forEach((cell: Cell) => {
                    cell.is_highlighted = false;
                });
            });
            return board;
        });
    }

    private initializeBoard(width: number, height: number, mines: number, exclude_x?: number, exclude_y?: number): void {
        this.board.set(Array(height).fill(null).map(() =>
            Array(width).fill(null).map(() => ({
                is_mine: false,
                is_revealed: false,
                is_flagged: false,
                is_questioned: false,
                is_highlighted: false,
                is_game_over: false,
                adjacent_mines: 0
            }))
        ));

        if (exclude_x === undefined || exclude_y === undefined) return;

        const result: GeneratedBoard = generateSolvableBoard(width, height, mines, exclude_x, exclude_y, this.getSeed());

        for (let y: number = 0; y < height; y++) {
            for (let x: number = 0; x < width; x++) {
                const idx: number = y * width + x;
                this.board.update((board: Cell[][]) => {
                    board[y][x].is_mine = result.mines[idx] === 1;
                    board[y][x].adjacent_mines = result.adjacent_counts[idx];
                    return board;
                });
            }
        }
    }

    private revealAdjacentIfSafe(i: number, j: number): void {
        let flagged_count: number = 0;
        for (let x: number = -1; x <= 1; x++) {
            for (let y: number = -1; y <= 1; y++) {
                const new_i: number = i + x;
                const new_j: number = j + y;
                if (this.isValidCell(new_i, new_j) && (this.board()[new_i][new_j].is_flagged)) {
                    flagged_count++;
                }
            }
        }

        if (flagged_count === this.board()[i][j].adjacent_mines) {
            for (let x: number = -1; x <= 1; x++) {
                for (let y: number = -1; y <= 1; y++) {
                    const new_i: number = i + x;
                    const new_j: number = j + y;
                    if (this.isValidCell(new_i, new_j) && !this.board()[new_i][new_j].is_revealed && !this.board()[new_i][new_j].is_flagged && !this.board()[new_i][new_j].is_questioned) {
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
                if (new_i >= 0 && new_i < this.board().length && new_j >= 0 && new_j < this.board()[0].length) {
                    if (!this.board()[new_i][new_j].is_revealed && !this.board()[new_i][new_j].is_flagged && !this.board()[new_i][new_j].is_questioned) {
                        this.revealCell(new_i, new_j);
                    }
                }
            }
        }
    }

    private revealAllMines(): void {
        this.board.update((board: Cell[][]) => {
            board.forEach((row: Cell[]) => {
                row.forEach((cell: Cell) => {
                    if (cell.is_mine) cell.is_revealed = true;
                });
            });
            return board;
        });
    }

    private checkWinCondition(): void {
        const all_non_mines_revealed: boolean = this.board().every((row: Cell[]) =>
            row.every((cell: Cell) => cell.is_revealed || cell.is_mine)
        );

        if (all_non_mines_revealed && this.remaining_mines() === 0) {
            this.game_over.set(true);
            this.end_time.set(moment());
        }
    }

    private isValidCell(i: number, j: number): boolean {
        return i >= 0 && i < this.board().length && j >= 0 && j < this.board()[0].length;
    }

    private getSeed(): number {
        if (!this.seed() || this.random_seed()) {
            this.seed.set(Math.floor(Math.random() * 0xFFFFFFFF));
        }
        return this.seed() as number;
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

interface MinesweeperSize {
    id: string;
    label: string;
    height: number;
    width: number;
    mines: number;
    default?: boolean;
}

