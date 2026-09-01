import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    effect,
    input,
    InputSignal,
    InputSignalWithTransform,
    signal,
    untracked,
    WritableSignal
} from '@angular/core';

import { Cell } from '../../../../_abstract_model/types/cell.class';

@Component({
    selector: 'mho-map-border',
    templateUrl: './map-border.component.html',
    styleUrls: ['./map-border.component.scss', '../draw-map.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapBorderComponent {

    public horizontal: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    public vertical: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    public index: InputSignal<null | number> = input<null | number>(null);
    public myCell: InputSignal<Cell | undefined> = input<Cell | undefined>(undefined);
    public hoveredCell: InputSignal<Cell | undefined> = input<Cell | undefined>(undefined);

    // Signaux (pas de simples champs) : lus par le template sous OnPush, ils doivent notifier
    // eux-mêmes leurs consommateurs quand un `effect()` les modifie — un champ muté depuis un effect
    // ne marque pas la vue pour vérification.
    protected readonly my_pos: WritableSignal<boolean> = signal(false);
    protected readonly hovered_pos: WritableSignal<boolean> = signal(false);
    protected readonly cell_index: WritableSignal<number | null> = signal(null);
    private my_cell: Cell | undefined;
    private hovered_cell: Cell | undefined;

    public constructor() {
        // Reproduit les 3 anciens setters `@Input()` : chacun ne réagit qu'à SON entrée, comme le
        // faisait Angular en n'appelant que le setter dont la valeur liée avait changé. `untracked()`
        // isole les lectures de vertical()/horizontal()/cell_index() dans isMyPos()/isHoveredPos() pour
        // ne pas leur ajouter une dépendance qu'elles n'avaient pas avant (my_pos/hovered_pos ne
        // réagissaient qu'à index/myCell/hoveredCell, jamais à un changement d'orientation seul).
        effect((): void => {
            const index: number | null = this.index();
            untracked((): void => {
                this.cell_index.set(index);
                this.isMyPos();
            });
        });
        effect((): void => {
            this.my_cell = this.myCell();
            untracked((): void => this.isMyPos());
        });
        effect((): void => {
            this.hovered_cell = this.hoveredCell();
            untracked((): void => this.isHoveredPos());
        });
    }

    private isMyPos(): void {
        const cell_index: number | null = this.cell_index();
        if (this.my_cell === undefined || this.my_cell === null || cell_index === undefined || cell_index === null) return;

        if (this.vertical() && this.my_cell.displayed_y === cell_index) {
            this.my_pos.set(true);
        }
        if (this.horizontal() && this.my_cell.displayed_x === cell_index) {
            this.my_pos.set(true);
        }
    }

    private isHoveredPos(): void {
        const cell_index: number | null = this.cell_index();
        if (this.hovered_cell === undefined || this.hovered_cell === null || cell_index === undefined || cell_index === null) return;

        if (this.vertical() && this.hovered_cell.displayed_y === cell_index) {
            this.hovered_pos.set(true);
        } else if (this.horizontal() && this.hovered_cell.displayed_x === cell_index) {
            this.hovered_pos.set(true);
        } else {
            this.hovered_pos.set(false);
        }
    }

}
