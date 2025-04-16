import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { HORDES_IMG_REPO } from 'src/app/_abstract_model/const';
import { Imports } from 'src/app/_abstract_model/types/_types';

const angular_common: Imports = [];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule];

@Component({
    selector: 'mho-368-pictos',
    templateUrl: '368-pictos.component.html',
    styleUrls: [ '368-pictos.component.scss' ],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class PictosComponent {
    protected board: ({ id: number, img: string; } | undefined)[][] = [];
    protected pictos_rescued: number = 0;
    protected attempts: number = 0;
    protected current_lot: [ { id: number, img: string; }, { id: number, img: string; } ] | [] = [];
    protected is_lot_horizontal: boolean = true; // Determines if the current lot is horizontal or vertical
    protected game_over: boolean = true;
    protected time_spent: number = 0; // Time in seconds
    protected interval?: NodeJS.Timeout;
    protected picto: { id: number, img: string; }[] = [
        { id: 1, img: 'pictos/r_batgun.gif' },
        { id: 2, img: 'pictos/r_watgun.gif' },
        { id: 3, img: 'pictos/r_tronco.gif' },
        { id: 4, img: 'pictos/r_cdhwin.gif' }
    ];
    protected HORDES_IMG_REPO: string = HORDES_IMG_REPO; // Path to the folder where images are stored

    protected readonly pictos_to_rescue: number = 368; // Total number of pictos to rescue

    public ngOnInit(): void {
        this.init();
    }

    protected onCellClick(row: number, col: number): void {
        if (this.current_lot?.length === 2 && !this.game_over) {
            if (this.is_lot_horizontal) {
                // Try to place horizontally
                if (col + 1 < 6 && this.board[ row ][ col ] === undefined && this.board[ row ][ col + 1 ] === undefined) {
                    this.board[ row ][ col ] = this.current_lot[ 0 ];
                    this.board[ row ][ col + 1 ] = this.current_lot[ 1 ];
                } else {
                    return;
                }
            } else {
                // Try to place vertically
                if (row + 1 < 6 && this.board[ row ][ col ] === undefined && this.board[ row + 1 ][ col ] === undefined) {
                    this.board[ row ][ col ] = this.current_lot[ 0 ];
                    this.board[ row + 1 ][ col ] = this.current_lot[ 1 ];
                } else {
                    return;
                }
            }
            this.attempts++;
            this.checkAndRemoveGroups();
            this.generateNewLot();
        }
    }

    private generateNewLot(): void {
        this.current_lot = [
            this.picto[ Math.floor(Math.random() * this.picto.length) ],
            this.picto[ Math.floor(Math.random() * this.picto.length) ]
        ];
        this.is_lot_horizontal = Math.random() > 0.5; // Randomly decide if the lot is horizontal or vertical

        if (!this.canPlaceLot()) {
            this.game_over = true;

            // Stop the timer if no valid moves are left
            if (this.interval) {
                clearInterval(this.interval);
            }
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

    private checkAndRemoveGroups(): void {
        // Check horizontal groups
        for (let i = 0; i < 6; i++) {
            let count = 1;
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
                            this.board[ i ][ k ] = undefined;
                        }
                        this.pictos_rescued += count;
                    }
                }
            }
        }

        // Check vertical groups
        for (let j = 0; j < 6; j++) {
            let count = 1;
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
                            this.board[ k ][ j ] = undefined;
                        }
                        this.pictos_rescued += count;
                    }
                }
            }
        }

        if (this.pictos_rescued === this.pictos_to_rescue) {
            this.game_over = true;
            alert(`Congratulations!`);
        }
    }
}
