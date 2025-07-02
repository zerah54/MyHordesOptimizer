import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, inject, input, InputSignal, OnInit, output, OutputEmitterRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../../../../_abstract_model/const';
import { ApiService } from '../../../../../_abstract_model/services/api.service';
import { Imports } from '../../../../../_abstract_model/types/_types';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { ItemCountShort } from '../../../../../_abstract_model/types/item-count-short.class';
import { Item } from '../../../../../_abstract_model/types/item.class';
import { LastUpdateComponent } from '../../../../../shared/elements/last-update/last-update.component';
import { ArrayItemDetailsPipe } from '../../../../../shared/pipes/array-item-details.pipe';
import { ItemDetailsPipe } from '../../../../../shared/pipes/item-details.pipe';
import { ItemsInBagsPipe } from './items-in-bags.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage, ReactiveFormsModule];
const components: Imports = [LastUpdateComponent];
const pipes: Imports = [ArrayItemDetailsPipe, ItemDetailsPipe, ItemsInBagsPipe];
const material_modules: Imports = [MatCheckboxModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatMenuModule];

@Component({
    selector: 'mho-map-update-cell',
    templateUrl: './map-update-cell.component.html',
    styleUrls: ['./map-update-cell.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MapUpdateCellComponent implements OnInit {

    public citizens: InputSignal<Citizen[]> = input.required();

    public cell: InputSignal<Cell> = input.required();
    public cellChange: OutputEmitterRef<Cell> = output();

    public all_items: Item[] = [];

    public cell_form!: FormGroup;

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();

    private readonly api: ApiService = inject(ApiService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    constructor(private fb: FormBuilder) {

    }

    public ngOnInit(): void {
        this.api.getItems()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((all_items: Item[]) => {
                this.all_items = all_items;
            });

        this.cell_form = this.fb.group({
            nb_zombies: [this.cell().nb_zombie],
            nb_killed_zombies: [this.cell().nb_zombie_killed],
            is_dryed: [this.cell().is_dryed],
            items: [this.cell().items],
        });

        this.cell_form.valueChanges
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((values: CellInfoUpdate) => {
                let new_cell: Cell = this.cell();
                new_cell.is_dryed = values.is_dryed;
                new_cell.nb_zombie = +values.nb_zombies;
                new_cell.nb_zombie_killed = +values.nb_killed_zombies;
                new_cell.items = [...values.items];
                this.cellChange.emit(new_cell);
            });
    }


    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param {Cell} cell
     * @param {number} item_id
     */
    public addItem(cell: Cell, item_id: number): void {
        if (cell) {
            const item_in_list_index: number | undefined = cell.items.findIndex((item_in_cell: ItemCountShort): boolean => item_in_cell.item_id === item_id);
            if (item_in_list_index !== undefined && item_in_list_index !== null && item_in_list_index > -1) {
                cell.items[item_in_list_index].count++;
            } else {
                const item: Item = <Item>this.all_items.find((item: Item) => item.id === item_id);
                const short_item: ItemCountShort = new ItemCountShort({
                    isBroken: !!item.is_broken,
                    count: 1,
                    id: item.id
                });
                cell.items.push(short_item);
                cell.items = [...cell.items];
            }

            this.cell_form.get('items')?.setValue([...cell.items]);
        }
    }

    /**
     * On retire 1 au compteur de l'item
     * Si l'item tombe à 0, on le retire de la liste
     *
     * @param {Cell} cell
     * @param {number} item_id
     */
    public removeItem(cell: Cell, item_id: number): void {
        if (cell) {
            const item_in_list_index: number | undefined = cell.items.findIndex((item_in_cell: ItemCountShort) => item_in_cell.item_id === item_id);

            if (item_in_list_index !== undefined && item_in_list_index !== null && item_in_list_index > -1 && cell.items[item_in_list_index].count <= 1) {
                cell.items.splice(item_in_list_index, 1);
            } else {
                cell.items[item_in_list_index].count--;
            }
            cell.items = [...cell.items];

            this.cell_form.get('items')?.setValue([...cell.items]);
        }
    }

    /**
     * On vide complètement les objets de la case
     *
     * @param {Cell} cell
     */
    public emptyItems(cell: Cell): void {
        if (cell) {
            cell.items = [];

            this.cell_form.get('items')?.setValue([...cell.items]);
        }
    }

}


interface CellInfoUpdate {
    nb_zombies: number;
    nb_killed_zombies: number;
    is_dryed: boolean;
    items: ItemCountShort[];
}
