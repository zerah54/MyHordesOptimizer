import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    inject,
    input,
    InputSignal,
    OnInit,
    output,
    OutputEmitterRef,
    signal,
    WritableSignal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../../../_abstract_model/const';
import { Direction } from '../../../../../_abstract_model/enum/direction.enum';
import { ApiService } from '../../../../../_abstract_model/services/api.service';
import { Imports } from '../../../../../_abstract_model/types/_types';
import { Cell, MAX_SCOUT_VISITS, scoutLevelFromVisits, ScoutVisitsRange,scoutVisitsRange } from '../../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../../_abstract_model/types/item.class';
import { ItemCountShort } from '../../../../../_abstract_model/types/item-count-short.class';
import { ArrayItemDetailsPipe } from '../../../../../_core/pipes/array-item-details.pipe';
import { ItemDetailsPipe } from '../../../../../_core/pipes/item-details.pipe';
import { ItemImgPipe } from '../../../../../_core/pipes/item-img.pipe';
import { LastUpdateComponent } from '../../../../../_shared/last-update/last-update.component';
import { DIG_LEVELS, DigLevelInfo } from '../../map-cell/pipes/dig-level.pipe';
import { ItemsInBagsPipe } from './items-in-bags.pipe';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage, ReactiveFormsModule];
const components: Imports = [LastUpdateComponent];
const pipes: Imports = [ArrayItemDetailsPipe, ItemImgPipe, ItemDetailsPipe, ItemsInBagsPipe];
const material_modules: Imports = [MatCheckboxModule, MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule, MatTooltipModule];

@Component({
    selector: 'mho-map-update-cell',
    templateUrl: './map-update-cell.component.html',
    styleUrls: ['./map-update-cell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MapUpdateCellComponent implements OnInit {
    public citizens: InputSignal<Citizen[]> = input.required();
    public cell: InputSignal<Cell> = input.required();
    public cellChange: OutputEmitterRef<Cell> = output();
    /** Signal : réassigné depuis le subscribe de getItems() (async) et lu par le propre template. */
    protected readonly all_items: WritableSignal<Item[]> = signal([]);
    protected cell_form!: FormGroup;
    /** Les quatre directions accessibles, dans l'ordre d'affichage du radar */
    protected readonly directions: RadarDirection[] = [
        { key: 'north', label: Direction.NORTH.getLabel() },
        { key: 'west', label: Direction.WEST.getLabel() },
        { key: 'east', label: Direction.EAST.getLabel() },
        { key: 'south', label: Direction.SOUTH.getLabel() }
    ];
    /** Niveaux d'abondance du fouineur, avec les libellés du jeu */
    protected readonly dig_levels: readonly DigLevelInfo[] = DIG_LEVELS;
    protected readonly MAX_SCOUT_VISITS: number = MAX_SCOUT_VISITS;
    /** Avertissement affiché quand le nombre de passages sort de la plage du niveau choisi ; null sinon */
    protected readonly scout_visits_warning: WritableSignal<string | null> = signal(null);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly locale: string = moment.locale();
    private readonly fb: FormBuilder = inject(FormBuilder);
    private readonly api: ApiService = inject(ApiService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    /** Un champ vide ou non renseigné ne doit pas être transmis comme la valeur 0 */
    private static toNullableNumber(value: number | string | null | undefined): number | null {
        if (value === null || value === undefined || value === '') return null;
        const parsed: number = +value;
        return isNaN(parsed) ? null : parsed;
    }

    /** Nombre de passages saisi, ramené à un entier entre 0 et MAX_SCOUT_VISITS ; null si le champ est vide */
    private static toScoutVisits(value: number | string | null | undefined): number | null {
        const visits: number | null = MapUpdateCellComponent.toNullableNumber(value);
        return visits === null ? null : Math.min(MAX_SCOUT_VISITS, Math.max(0, Math.trunc(visits)));
    }

    /** Construit un radar à partir des 4 directions, ou null si aucune n'est renseignée */
    private static buildRadar<T>(values: (T | null)[]): { north: T | null, south: T | null, east: T | null, west: T | null } | null {
        const [north, south, east, west]: (T | null)[] = values;
        if (north === null && south === null && east === null && west === null) return null;
        return { north, south, east, west };
    }

    public ngOnInit(): void {
        this.api.getItems()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((all_items: Item[]) => {
                this.all_items.set(all_items);
            });

        this.cell_form = this.fb.group({
            nb_zombies: [this.cell().nb_zombie],
            nb_killed_zombies: [this.cell().nb_zombie_killed],
            is_dryed: [this.cell().is_dryed],
            items: [this.cell().items],
            scav_zone_level: [this.cell().scav_zone_level],
            scout_zone_level: [this.cell().scout_zone_level],
            scout_visits: [this.cell().scout_visits],
            scav_north: [this.cell().scav_next_cells?.north ?? null],
            scav_south: [this.cell().scav_next_cells?.south ?? null],
            scav_east: [this.cell().scav_next_cells?.east ?? null],
            scav_west: [this.cell().scav_next_cells?.west ?? null],
            scout_north: [this.cell().scout_next_cells?.north ?? null],
            scout_south: [this.cell().scout_next_cells?.south ?? null],
            scout_east: [this.cell().scout_next_cells?.east ?? null],
            scout_west: [this.cell().scout_next_cells?.west ?? null],
        });
        this.updateScoutVisitsWarning(this.cell());

        this.cell_form.valueChanges
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((values: CellInfoUpdate) => {
                const new_cell: Cell = this.cell();
                new_cell.is_dryed = values.is_dryed;
                new_cell.nb_zombie = +values.nb_zombies;
                new_cell.nb_zombie_killed = +values.nb_killed_zombies;
                new_cell.items = [...values.items];
                new_cell.scav_zone_level = MapUpdateCellComponent.toNullableNumber(values.scav_zone_level);
                this.applyScoutVisits(new_cell, values.scout_visits, values.scout_zone_level);
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

    /**
     * Le niveau choisi prime ; sans niveau, celui du nombre de passages est enregistré, sans remplir la liste
     * (taper « 12 » passerait sinon par un « 1 » incompatible).
     *
     * @param {Cell} cell case modifiée
     * @param {number | null} raw_visits valeur saisie dans le champ des passages
     * @param {number | null} raw_level niveau choisi dans la liste
     */
    private applyScoutVisits(cell: Cell, raw_visits: number | null, raw_level: number | null): void {
        const visits: number | null = MapUpdateCellComponent.toScoutVisits(raw_visits);
        if (visits !== null && visits !== raw_visits) {
            const visits_control: AbstractControl = this.cell_form.controls['scout_visits'];
            visits_control.setValue(visits, { emitEvent: false });
        }
        const level: number | null = MapUpdateCellComponent.toNullableNumber(raw_level);
        cell.scout_visits = visits;
        cell.scout_zone_level = level ?? (visits === null ? null : scoutLevelFromVisits(visits));
        this.updateScoutVisitsWarning(cell);
    }

    /**
     * Affiche l'avertissement du champ des passages quand le nombre sort de la plage du niveau d'exploration.
     *
     * @param {Cell} cell case modifiée
     */
    private updateScoutVisitsWarning(cell: Cell): void {
        if (cell.isScoutVisitsConsistent() || cell.scout_zone_level === null) {
            this.scout_visits_warning.set(null);
            return;
        }
        const range: ScoutVisitsRange = scoutVisitsRange(cell.scout_zone_level);
        this.scout_visits_warning.set(range.min === range.max
            ? $localize`Incompatible avec le niveau d'exploration : ${range.max}:max: passages`
            : $localize`Incompatible avec le niveau d'exploration : ${range.min}:min: à ${range.max}:max: passages`);
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
                const item: Item = <Item>this.all_items().find((item: Item) => item.id === item_id);
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
    scout_visits: number | null;
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
