import { CdkDragRelease, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, ElementRef, Signal, viewChildren } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { Imports } from 'src/app/_abstract_model/types/_types';
import { MaxPipe } from 'src/app/shared/pipes/number.pipe';
import { PictosHighlightedCell } from './368-pictos-highlighted-cell.pipe';

const angular_common: Imports = [];
const components: Imports = [];
const pipes: Imports = [ MaxPipe, PictosHighlightedCell ];
const material_modules: Imports = [ MatCardModule, DragDropModule ];

@Component({
    selector: 'mho-368-pictos',
    templateUrl: '368-pictos.component.html',
    styleUrls: [ '368-pictos.component.scss' ],
    host: {style: 'display: contents'},
    imports: [ ...angular_common, ...components, ...material_modules, ...pipes ]
})
export class PictosGameComponent {

    protected cells: Signal<readonly ElementRef<HTMLDivElement>[]> = viewChildren('cellDiv', { read: ElementRef });
    protected cells_lot: Signal<readonly ElementRef<HTMLDivElement>[]> = viewChildren('cellLotDiv', { read: ElementRef });

    protected board: (PictosGameCell | undefined)[][] = [];
    protected pictos_rescued: number = 0;
    protected attempts: number = 0;
    protected current_lot: [ PictosGameCell, PictosGameCell ] | [] = [];
    protected is_lot_horizontal: boolean = true; // Determines if the current lot is horizontal or vertical
    protected highlighted_cells: [ { row: number, col: number; }, { row: number, col: number; } ] | [] = [];
    protected game_over: boolean = true;
    protected time_spent: number = 0; // Time in seconds
    protected interval?: NodeJS.Timeout;
    protected picto: PictosGameCell[] = [
        { id: 1, img: 'pictos/r_batgun.gif', to_remove: false },
        { id: 2, img: 'pictos/r_watgun.gif', to_remove: false },
        { id: 3, img: 'pictos/r_tronco.gif', to_remove: false },
        { id: 4, img: 'pictos/r_cdhwin.gif', to_remove: false }
    ];
    protected HORDES_IMG_REPO: string = HORDES_IMG_REPO; // Path to the folder where images are stored

    protected readonly pictos_to_rescue: number = 368; // Total number of pictos to rescue

    public ngOnInit(): void {
        this.init();
    }

    protected init(): void {
        this.board = Array.from({ length: 6 }, () => Array(6).fill(undefined));
        this.pictos_rescued = 0;
        this.attempts = 0;
        this.current_lot = [];
        this.time_spent = 0;
        this.game_over = false;

        this.interval = setInterval(() => {
            this.time_spent += 1;
        }, 1000);

        this.generateNewLot();
    }

    protected onCellClick(row: number, col: number): void {
        if (this.current_lot?.length === 2 && !this.game_over) {
            if (this.is_lot_horizontal) {
                // Try to place horizontally
                if (this.canBePlacedHorizontally(row, col)) {
                    this.board[ row ][ col ] = this.current_lot[ 0 ];
                    this.board[ row ][ col + 1 ] = this.current_lot[ 1 ];
                } else {
                    return;
                }
            } else {
                // Try to place vertically
                if (this.canBePlacedVertically(row, col)) {
                    this.board[ row ][ col ] = this.current_lot[ 0 ];
                    this.board[ row + 1 ][ col ] = this.current_lot[ 1 ];
                } else {
                    return;
                }
            }
            this.attempts++;
            setTimeout(() => {
                this.checkAndRemoveGroups();
                this.generateNewLot();
            });
        }
    }

    protected onDragMoved(): void {
        const first_cell_lot = this.cells_lot()[ 0 ];
        if (!first_cell_lot || !this.cells() || this.cells().length <= 0) return;

        /** On regarde si il y a superposition */
        const overlap: ElementRef<HTMLDivElement> | undefined = this.cells().find((cell: ElementRef<HTMLDivElement>) => {
            return this.areElementsOverlappingMoreThan50Percent(cell.nativeElement, first_cell_lot.nativeElement);
        });

        if (overlap) {

            /** On regarde si l'élément est dans la liste des cellules */
            const x: number = +(overlap.nativeElement.getAttribute('x') || 0);
            const y: number = +(overlap.nativeElement.getAttribute('y') || 0);

            /** On regarde si l'élément est dans la liste des cellules */
            let cell_is_in_highlighted_index: number = this.highlighted_cells.findIndex((cell_highlighted: { row: number, col: number; }) => {
                return cell_highlighted.row === x && cell_highlighted.col === y;
            });

            // Si il y a superposition, on vérifie si il est déjà dans la liste des cellules mises en surbrillance
            if (cell_is_in_highlighted_index > -1) return;

            if (this.is_lot_horizontal) {
                if (!this.canBePlacedHorizontally(x, y)) return;
                this.highlighted_cells = [ { row: x, col: y }, { row: x, col: y + 1 } ];
            } else {
                if (!this.canBePlacedVertically(x, y)) return;
                this.highlighted_cells = [ { row: x, col: y }, { row: x + 1, col: y } ];
            }

        } else {
            this.highlighted_cells = [];
        }
    }

    protected onDragRelease(event: CdkDragRelease): void {

        const first_cell_lot = this.cells_lot()[ 0 ];
        if (!first_cell_lot || !this.cells() || this.cells().length <= 0) return;

        /** On regarde si il y a superposition */
        const overlap: ElementRef<HTMLDivElement> | undefined = this.cells().find((cell: ElementRef<HTMLDivElement>) => {
            return this.areElementsOverlappingMoreThan50Percent(cell.nativeElement, first_cell_lot.nativeElement);
        });

        let placed: boolean = false;

        if (overlap) {

            const x: number = +(overlap.nativeElement.getAttribute('x') || 0);
            const y: number = +(overlap.nativeElement.getAttribute('y') || 0);

            if (this.is_lot_horizontal) {
                if (this.canBePlacedHorizontally(x, y)) {
                    this.board[ x ][ y ] = this.current_lot[ 0 ];
                    this.board[ x ][ y + 1 ] = this.current_lot[ 1 ];
                    placed = true;
                }
            } else {
                if (this.canBePlacedVertically(x, y)) {
                    this.board[ x ][ y ] = this.current_lot[ 0 ];
                    this.board[ x + 1 ][ y ] = this.current_lot[ 1 ];
                    placed = true;
                }
            }
        }

        if (placed) {
            this.attempts++;
            this.highlighted_cells = [];
            this.checkAndRemoveGroups();
            this.generateNewLot();
        }

        /** Doit être replacé à sa position initiale */
        event.source._dragRef.reset();
    }

    private generateNewLot(): void {
        this.current_lot = [
            { ...this.picto[ Math.floor(Math.random() * this.picto.length) ] },
            { ...this.picto[ Math.floor(Math.random() * this.picto.length) ] }
        ];
        this.is_lot_horizontal = Math.random() > 0.5; // Randomly decide if the lot is horizontal or vertical

        if (!this.canPlaceLot()) {
            this.endGame();
        }
    }

    private canPlaceLot(): boolean {
        if (this.is_lot_horizontal) {
            // Check if the current lot can be placed horizontally
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 5; j++) {
                    if (this.board[ i ][ j ] === undefined && this.board[ i ][ j + 1 ] === undefined) {
                        return true;
                    }
                }
            }
        } else {
            // Check if the current lot can be placed vertically
            for (let j = 0; j < 6; j++) {
                for (let i = 0; i < 5; i++) {
                    if (this.board[ i ][ j ] === undefined && this.board[ i + 1 ][ j ] === undefined) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private checkAndRemoveGroups(): void {
        let to_remove: { row: number, col: number, picto: number | undefined; }[] = [];

        // Mark horizontal groups
        for (let i = 0; i < 6; i++) {
            let count: number = 1;
            for (let j = 0; j < 6; j++) {
                if (this.board[ i ][ j ] !== undefined) {
                    count = 1;
                    let current_picto: number | undefined = this.board[ i ][ j ]?.id;
                    while (j + 1 < 6 && this.board[ i ][ j + 1 ]?.id === current_picto) {
                        count++;
                        j++;
                    }
                    if (count >= 3) {
                        for (let k = j; k >= j - count + 1; k--) {
                            to_remove.push({ row: i, col: k, picto: current_picto });
                        }
                    }
                }
            }
        }

        // Mark vertical groups
        for (let j = 0; j < 6; j++) {
            let count: number = 1;
            for (let i = 0; i < 6; i++) {
                if (this.board[ i ][ j ] !== undefined) {
                    count = 1;
                    let current_picto: number | undefined = this.board[ i ][ j ]?.id;
                    while (i + 1 < 6 && this.board[ i + 1 ][ j ]?.id === current_picto) {
                        count++;
                        i++;
                    }
                    if (count >= 3) {
                        for (let k = i; k >= i - count + 1; k--) {
                            to_remove.push({ row: k, col: j, picto: current_picto });
                        }
                    }
                }
            }
        }

        // Remove marked cells
        to_remove.forEach((cell: { row: number, col: number; }) => {
            if (this.board[ cell.row ][ cell.col ]) {
                (<PictosGameCell> this.board[ cell.row ][ cell.col ]).to_remove = true;
            }
            this.pictos_rescued++;
            setTimeout(() => {
                this.board[ cell.row ][ cell.col ] = undefined;
            }, 250);
        });

        if (this.pictos_rescued >= this.pictos_to_rescue) {
            this.endGame();
            alert(`Congratulations!`);
        }
    }

    private endGame(): void {
        this.game_over = true;

        // Stop the timer if no valid moves are left
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    private canBePlacedHorizontally(row: number, col: number): boolean {
        return col + 1 < 6 && this.board[ row ][ col ] === undefined && this.board[ row ][ col + 1 ] === undefined;
    }

    private canBePlacedVertically(row: number, col: number): boolean {
        return row + 1 < 6 && this.board[ row ][ col ] === undefined && this.board[ row + 1 ][ col ] === undefined;
    }

    private areElementsOverlappingMoreThan50Percent(element1: HTMLDivElement, element2: HTMLDivElement): boolean {
        const rect1: DOMRect = element1.getBoundingClientRect();
        const rect2: DOMRect = element2.getBoundingClientRect();

        const area1: number = rect1.width * rect1.height;
        const area2: number = rect2.width * rect2.height;

        const overlapX: number = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
        const overlapY: number = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
        const overlapArea: number = overlapX * overlapY;

        const overlapPercentage1: number = (overlapArea / area1) * 100;
        const overlapPercentage2: number = (overlapArea / area2) * 100;

        return overlapPercentage1 > 50 || overlapPercentage2 > 50;
    }
}

interface PictosGameCell {
    id: number;
    img: string;
    to_remove: boolean;
}
