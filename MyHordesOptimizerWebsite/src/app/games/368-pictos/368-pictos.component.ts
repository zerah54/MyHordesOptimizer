import { CdkDragRelease, DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, Signal, signal, viewChildren, WritableSignal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { Imports } from 'src/app/_abstract_model/types/_types';
import { MaxPipe } from 'src/app/_core/pipes/number.pipe';

import { PictosHighlightedCell } from './368-pictos-highlighted-cell.pipe';

const angular_common: Imports = [];
const components: Imports = [];
const pipes: Imports = [ MaxPipe, PictosHighlightedCell ];
const material_modules: Imports = [ MatCardModule, DragDropModule ];

@Component({
    selector: 'mho-368-pictos',
    templateUrl: '368-pictos.component.html',
    styleUrls: [ '368-pictos.component.scss' ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ ...angular_common, ...components, ...material_modules, ...pipes ]
})
export class PictosGameComponent implements OnInit {

    // Signaux (pas de simples champs) : mutés depuis setInterval/setTimeout et lus par le template
    // sous OnPush — un champ muté depuis un callback asynchrone ne marque pas la vue pour vérification.
    protected readonly board: WritableSignal<(PictosGameCell | undefined)[][]> = signal([]);
    protected readonly pictos_rescued: WritableSignal<number> = signal(0);
    protected readonly current_lot: WritableSignal<[ PictosGameCell, PictosGameCell ] | []> = signal([]);
    protected readonly is_lot_horizontal: WritableSignal<boolean> = signal(true); // Determines if the current lot is horizontal or vertical
    protected readonly game_over: WritableSignal<boolean> = signal(true);
    protected readonly time_spent: WritableSignal<number> = signal(0); // Time in seconds

    // attempts/highlighted_cells restent de simples champs : mutés uniquement de façon synchrone
    // depuis un événement du propre template du composant (click, cdkDragMoved/Released/Started),
    // ce qui marque déjà la vue pour vérification sans passer par un signal.
    protected attempts: number = 0;
    protected highlighted_cells: [ { row: number, col: number; }, { row: number, col: number; } ] | [] = [];
    protected HORDES_IMG_REPO: string = HORDES_IMG_REPO; // Path to the folder where images are stored
    protected readonly pictos_to_rescue: number = 368; // Total number of pictos to rescue
    private cells: Signal<readonly ElementRef<HTMLDivElement>[]> = viewChildren('cellDiv', { read: ElementRef });
    private cells_lot: Signal<readonly ElementRef<HTMLDivElement>[]> = viewChildren('cellLotDiv', { read: ElementRef });
    private interval?: NodeJS.Timeout;
    private picto: PictosGameCell[] = [
        { id: 1, img: 'pictos/r_batgun.gif', to_remove: false },
        { id: 2, img: 'pictos/r_watgun.gif', to_remove: false },
        { id: 3, img: 'pictos/r_tronco.gif', to_remove: false },
        { id: 4, img: 'pictos/r_cdhwin.gif', to_remove: false }
    ];

    public ngOnInit(): void {
        this.init();
    }

    protected init(): void {
        this.board.set(Array.from({ length: 6 }, () => Array(6).fill(undefined)));
        this.pictos_rescued.set(0);
        this.attempts = 0;
        this.current_lot.set([]);
        this.time_spent.set(0);
        this.game_over.set(false);

        this.interval = setInterval(() => {
            this.time_spent.update((time_spent: number) => time_spent + 1);
        }, 1000);

        this.generateNewLot();
    }

    protected onCellClick(row: number, col: number): void {
        if (this.current_lot()?.length === 2 && !this.game_over()) {
            if (this.is_lot_horizontal()) {
                // Try to place horizontally
                if (this.canBePlacedHorizontally(row, col)) {
                    this.setCell(row, col, this.current_lot()[ 0 ]);
                    this.setCell(row, col + 1, this.current_lot()[ 1 ]);
                } else {
                    return;
                }
            } else {
                // Try to place vertically
                if (this.canBePlacedVertically(row, col)) {
                    this.setCell(row, col, this.current_lot()[ 0 ]);
                    this.setCell(row + 1, col, this.current_lot()[ 1 ]);
                } else {
                    return;
                }
            }
            this.attempts++;
            setTimeout(() => {
                this.generateNewLotAfterRemoval(this.checkAndRemoveGroups());
            });
        }
    }

    protected onDragMoved(): void {
        const first_cell_lot: ElementRef<HTMLDivElement> = this.cells_lot()[ 0 ];
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
            const cell_is_in_highlighted_index: number = this.highlighted_cells.findIndex((cell_highlighted: { row: number, col: number; }) => {
                return cell_highlighted.row === x && cell_highlighted.col === y;
            });

            // Si il y a superposition, on vérifie si il est déjà dans la liste des cellules mises en surbrillance
            if (cell_is_in_highlighted_index > -1) return;

            if (this.is_lot_horizontal()) {
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

        const first_cell_lot: ElementRef<HTMLDivElement> = this.cells_lot()[ 0 ];
        if (!first_cell_lot || !this.cells() || this.cells().length <= 0) return;

        /** On regarde si il y a superposition */
        const overlap: ElementRef<HTMLDivElement> | undefined = this.cells().find((cell: ElementRef<HTMLDivElement>) => {
            return this.areElementsOverlappingMoreThan50Percent(cell.nativeElement, first_cell_lot.nativeElement);
        });

        let placed: boolean = false;

        if (overlap) {

            const x: number = +(overlap.nativeElement.getAttribute('x') || 0);
            const y: number = +(overlap.nativeElement.getAttribute('y') || 0);

            if (this.is_lot_horizontal()) {
                if (this.canBePlacedHorizontally(x, y)) {
                    this.setCell(x, y, this.current_lot()[ 0 ]);
                    this.setCell(x, y + 1, this.current_lot()[ 1 ]);
                    placed = true;
                }
            } else {
                if (this.canBePlacedVertically(x, y)) {
                    this.setCell(x, y, this.current_lot()[ 0 ]);
                    this.setCell(x + 1, y, this.current_lot()[ 1 ]);
                    placed = true;
                }
            }
        }

        if (placed) {
            this.attempts++;
            this.highlighted_cells = [];
            this.generateNewLotAfterRemoval(this.checkAndRemoveGroups());
        }

        /** Doit être replacé à sa position initiale */
        event.source._dragRef.reset();
    }

    /** Réassignation immuable d'une case du plateau : un signal muté en place ne notifierait pas ses consommateurs. */
    private setCell(row: number, col: number, value: PictosGameCell | undefined): void {
        this.board.update((current: (PictosGameCell | undefined)[][]) => {
            const next: (PictosGameCell | undefined)[][] = [ ...current ];
            next[ row ] = [ ...next[ row ] ];
            next[ row ][ col ] = value;
            return next;
        });
    }

    private generateNewLot(): void {
        this.current_lot.set([
            { ...this.picto[ Math.floor(Math.random() * this.picto.length) ] },
            { ...this.picto[ Math.floor(Math.random() * this.picto.length) ] }
        ]);
        this.is_lot_horizontal.set(Math.random() > 0.5); // Randomly decide if the lot is horizontal or vertical

        if (!this.canPlaceLot()) {
            this.endGame();
        }
    }

    private canPlaceLot(): boolean {
        const board: (PictosGameCell | undefined)[][] = this.board();
        if (this.is_lot_horizontal()) {
            // Check if the current lot can be placed horizontally
            for (let i: number = 0; i < 6; i++) {
                for (let j: number = 0; j < 5; j++) {
                    if (board[ i ][ j ] === undefined && board[ i ][ j + 1 ] === undefined) {
                        return true;
                    }
                }
            }
        } else {
            // Check if the current lot can be placed vertically
            for (let j: number = 0; j < 6; j++) {
                for (let i: number = 0; i < 5; i++) {
                    if (board[ i ][ j ] === undefined && board[ i + 1 ][ j ] === undefined) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Génère le prochain lot une fois les cases retirées lors du dernier match effectivement vidées
     * (250ms) : `canPlaceLot()` doit voir un plateau à jour, pas un plateau encore encombré par des
     * cases marquées `to_remove` mais pas encore `undefined` — sinon la partie peut se terminer à
     * tort alors qu'il restait de la place.
     */
    private generateNewLotAfterRemoval(had_removals: boolean): void {
        if (had_removals) {
            setTimeout(() => this.generateNewLot(), 250);
        } else {
            this.generateNewLot();
        }
    }

    private checkAndRemoveGroups(): boolean {
        const to_remove: { row: number, col: number, picto: number | undefined; }[] = [];
        const board: (PictosGameCell | undefined)[][] = this.board();

        // Mark horizontal groups
        for (let i: number = 0; i < 6; i++) {
            let count: number = 1;
            for (let j: number = 0; j < 6; j++) {
                if (board[ i ][ j ] !== undefined) {
                    count = 1;
                    const current_picto: number | undefined = board[ i ][ j ]?.id;
                    while (j + 1 < 6 && board[ i ][ j + 1 ]?.id === current_picto) {
                        count++;
                        j++;
                    }
                    if (count >= 3) {
                        for (let k: number = j; k >= j - count + 1; k--) {
                            to_remove.push({ row: i, col: k, picto: current_picto });
                        }
                    }
                }
            }
        }

        // Mark vertical groups
        for (let j: number = 0; j < 6; j++) {
            let count: number = 1;
            for (let i: number = 0; i < 6; i++) {
                if (board[ i ][ j ] !== undefined) {
                    count = 1;
                    const current_picto: number | undefined = board[ i ][ j ]?.id;
                    while (i + 1 < 6 && board[ i + 1 ][ j ]?.id === current_picto) {
                        count++;
                        i++;
                    }
                    if (count >= 3) {
                        for (let k: number = i; k >= i - count + 1; k--) {
                            to_remove.push({ row: k, col: j, picto: current_picto });
                        }
                    }
                }
            }
        }

        // Remove marked cells
        to_remove.forEach((cell: { row: number, col: number; }) => {
            // Relecture volontaire de `this.board()` (pas de la capture `board` ci-dessus) : préserve
            // le comportement hérité où une case appartenant à la fois à un groupe horizontal ET
            // vertical est traitée deux fois (double incrément de pictos_rescued, non corrigé ici).
            const current_cell: PictosGameCell | undefined = this.board()[ cell.row ][ cell.col ];
            if (current_cell) {
                this.setCell(cell.row, cell.col, { ...current_cell, to_remove: true });
            }
            this.pictos_rescued.update((pictos_rescued: number) => pictos_rescued + 1);
            setTimeout(() => {
                this.setCell(cell.row, cell.col, undefined);
            }, 250);
        });

        if (this.pictos_rescued() >= this.pictos_to_rescue) {
            this.endGame();
            alert('Congratulations!');
        }

        return to_remove.length > 0;
    }

    private endGame(): void {
        this.game_over.set(true);

        // Stop the timer if no valid moves are left
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    private canBePlacedHorizontally(row: number, col: number): boolean {
        const board: (PictosGameCell | undefined)[][] = this.board();
        return col + 1 < 6 && board[ row ][ col ] === undefined && board[ row ][ col + 1 ] === undefined;
    }

    private canBePlacedVertically(row: number, col: number): boolean {
        const board: (PictosGameCell | undefined)[][] = this.board();
        return row + 1 < 6 && board[ row ][ col ] === undefined && board[ row + 1 ][ col ] === undefined;
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
