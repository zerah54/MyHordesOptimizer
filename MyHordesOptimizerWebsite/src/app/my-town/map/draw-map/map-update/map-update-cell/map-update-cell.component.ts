import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, inject, input, InputSignal, OnInit, output,OutputEmitterRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../../../_abstract_model/const';
import { Direction } from '../../../../../_abstract_model/enum/direction.enum';
import { ApiService } from '../../../../../_abstract_model/services/api.service';
import { Imports } from '../../../../../_abstract_model/types/_types';
import { Cell } from '../../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../../_abstract_model/types/item.class';
import { ItemCountShort } from '../../../../../_abstract_model/types/item-count-short.class';
import { ArrayItemDetailsPipe } from '../../../../../_core/pipes/array-item-details.pipe';
import { ItemDetailsPipe } from '../../../../../_core/pipes/item-details.pipe';
import { LastUpdateComponent } from '../../../../../_shared/last-update/last-update.component';
import { ItemsInBagsPipe } from './items-in-bags.pipe';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage, ReactiveFormsModule];
const components: Imports = [LastUpdateComponent];
const pipes: Imports = [ArrayItemDetailsPipe, ItemDetailsPipe, ItemsInBagsPipe];
const material_modules: Imports = [MatCheckboxModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatMenuModule, MatSelectModule];

@Component({
    selector: 'mho-map-update-cell',
    templateUrl: './map-update-cell.component.html',
    styleUrls: ['./map-update-cell.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MapUpdateCellComponent implements OnInit {
    private readonly fb: FormBuilder = inject(FormBuilder);


    public citizens: InputSignal<Citizen[]> = input.required();

    public cell: InputSignal<Cell> = input.required();
    public cellChange: OutputEmitterRef<Cell> = output();

    protected all_items: Item[] = [];

    protected cell_form!: FormGroup;

    /** Les quatre directions accessibles, dans l'ordre d'affichage du radar */
    protected readonly directions: RadarDirection[] = [
        { key: 'north', label: Direction.NORTH.getLabel() },
        { key: 'west', label: Direction.WEST.getLabel() },
        { key: 'east', label: Direction.EAST.getLabel() },
        { key: 'south', label: Direction.SOUTH.getLabel() }
    ];

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly locale: string = moment.locale();

    private readonly api: ApiService = inject(ApiService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

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
            scav_zone_level: [this.cell().scav_zone_level],
            scout_zone_level: [this.cell().scout_zone_level],
            scav_north: [null],
            scav_south: [null],
            scav_east: [null],
            scav_west: [null],
            scout_north: [null],
            scout_south: [null],
            scout_east: [null],
            scout_west: [null],
        });

        this.cell_form.valueChanges
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((values: CellInfoUpdate) => {
                const new_cell: Cell = this.cell();
                new_cell.is_dryed = values.is_dryed;
                new_cell.nb_zombie = +values.nb_zombies;
                new_cell.nb_zombie_killed = +values.nb_killed_zombies;
                new_cell.items = [...values.items];
                new_cell.scav_zone_level = MapUpdateCellComponent.toNullableNumber(values.scav_zone_level);
                new_cell.scout_zone_level = MapUpdateCellComponent.toNullableNumber(values.scout_zone_level);
                /** Les radars décrivent les cases voisines : ils ne sont envoyés que si au moins une direction est renseignée */
                new_cell.scav_next_cells = MapUpdateCellComponent.buildRadar<boolean>([values.scav_north, values.scav_south, values.scav_east, values.scav_west]);
                new_cell.scout_next_cells = MapUpdateCellComponent.buildRadar<number>([
                    MapUpdateCellComponent.toNullableNumber(values.scout_north),
                    MapUpdateCellComponent.toNullableNumber(values.scout_south),
                    MapUpdateCellComponent.toNullableNumber(values.scout_east),
                    MapUpdateCellComponent.toNullableNumber(values.scout_west)
                ]);
                this.cellChange.emit(new_cell);
            });
    }

    /** Un champ vide ou non renseigné ne doit pas être transmis comme la valeur 0 */
    private static toNullableNumber(value: number | string | null | undefined): number | null {
        if (value === null || value === undefined || value === '') return null;
        const parsed: number = +value;
        return isNaN(parsed) ? null : parsed;
    }

    /** Construit un radar à partir des 4 directions, ou null si aucune n'est renseignée */
    private static buildRadar<T>(values: (T | null)[]): { north: T | null, south: T | null, east: T | null, west: T | null } | null {
        const [north, south, east, west]: (T | null)[] = values;
        if (north === null && south === null && east === null && west === null) return null;
        return { north, south, east, west };
    }


    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param {Cell} cell
     * @param {number} item_id
     */
    protected addItem(cell: Cell, item_id: number): void {
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
    protected removeItem(cell: Cell, item_id: number): void {
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
    protected emptyItems(cell: Cell): void {
        if (cell) {
            cell.items = [];

            this.cell_form.get('items')?.setValue([...cell.items]);
        }
    }

}


interface RadarDirection {
    key: 'north' | 'south' | 'east' | 'west';
    label: string;
}

interface CellInfoUpdate {
    nb_zombies: number;
    nb_killed_zombies: number;
    is_dryed: boolean;
    items: ItemCountShort[];
    scav_zone_level: number | null;
    scout_zone_level: number | null;
    /** Radar du fouineur : true = case voisine épuisée, false = il reste des objets, null = non renseigné */
    scav_north: boolean | null;
    scav_south: boolean | null;
    scav_east: boolean | null;
    scav_west: boolean | null;
    /** Radar de l'éclaireur : estimation du nombre de zombies par direction */
    scout_north: number | null;
    scout_south: number | null;
    scout_east: number | null;
    scout_west: number | null;
}
