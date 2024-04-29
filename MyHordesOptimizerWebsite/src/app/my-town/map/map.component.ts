import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, HostBinding, HostListener, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BREAKPOINTS } from '../../_abstract_model/const';
import { ApiService } from '../../_abstract_model/services/api.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Dictionary, Imports } from '../../_abstract_model/types/_types';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { Item } from '../../_abstract_model/types/item.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { Town } from '../../_abstract_model/types/town.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { CompassRoseComponent } from '../../shared/elements/compass-rose/compass-rose.component';
import { DrawMapComponent } from './draw-map/draw-map.component';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [CompassRoseComponent, DrawMapComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatCheckboxModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatOptionModule, MatSelectModule, MatSidenavModule];

@Component({
    selector: 'mho-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MapComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    /** La carte de la ville */
    public map!: Town;
    public all_ruins!: Ruin[];
    public all_items!: Item[];
    public all_citizens!: Citizen[];

    public options!: MapOptions;
    public readonly is_dev: boolean = !environment.production;

    public new_distance_option: Distance = {
        value: 1,
        unit: 'km'
    };

    public is_gt_xs: boolean = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);

    private readonly default_options: MapOptions = {
        map_type: 'digs',
        dig_mode: 'average',
        trash_mode: 'nb',
        displayed_scrut_zone: {},
        distances: []
    };

    private api_service: ApiService = inject(ApiService);
    private town_service: TownService = inject(TownService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    @HostListener('window:resize', ['$event'])
    onResize(): void {
        this.is_gt_xs = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    }


    constructor(private breakpoint_observer: BreakpointObserver) {

    }

    ngOnInit(): void {
        this.town_service
            .getMap()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (map: Town) => {
                    this.map = map;
                }
            });
        this.api_service
            .getRuins()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (ruins: Ruin[]) => {
                    this.all_ruins = ruins;
                }
            });
        this.api_service
            .getItems()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (items: Item[]) => {
                    this.all_items = items;
                }
            });
        this.town_service
            .getCitizens()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (citizens: CitizenInfo): void => {
                    this.all_citizens = citizens.citizens;
                }
            });

        this.options = JSON.parse(localStorage.getItem('MAP_OPTIONS') || JSON.stringify(this.default_options));
        this.checkIfAllOptionsExist();
    }

    public addDistanceToList(): void {

        this.new_distance_option.value = +this.new_distance_option.value;
        /** On nettoie les options impossibles */
        if (this.new_distance_option.unit === 'km') {
            this.new_distance_option.round_trip = undefined;
        }

        const current_distances: Distance[] = [...this.options.distances];

        const already_exists: boolean = [...current_distances].some((distance: Distance) => {
            return distance.unit === this.new_distance_option.unit
                && +distance.value === +this.new_distance_option.value
                && distance.round_trip === this.new_distance_option.round_trip;
        });

        /** Si il existe une option absolument identique, alors on n'ajoute rien */
        if (already_exists && current_distances.length > 0) return;

        /** Sinon, on ajoute à la liste */
        current_distances.push({ ...this.new_distance_option });

        this.changeOptions('distances', [...current_distances]);
    }


    public removeDistanceFromList(distance_to_remove: Distance): void {

        const current_distances: Distance[] = [...this.options.distances];

        const index: number = current_distances.findIndex((distance: Distance) => {
            return distance.unit === distance_to_remove.unit
                && +distance.value === +distance_to_remove.value
                && distance.round_trip === distance_to_remove.round_trip;
        });

        /** Si il n'existe pas d'option absolument identique, alors on ne retire rien */
        if (index < 0) return;

        /** Sinon, on retire de la liste */
        current_distances.splice(index, 1);

        this.changeOptions('distances', current_distances);
    }

    public changeOptions<T>(key: string, value: T): void {
        (<{ [key: string]: unknown }><unknown>this.options)[key] = value;
        setTimeout(() => {
            this.options = { ...this.options };
            localStorage.setItem('MAP_OPTIONS', JSON.stringify(this.options));
        });
    }

    private checkIfAllOptionsExist(): void {
        const options_keys: string[] = Object.keys(this.options);
        const default_options_keys: string[] = Object.keys(this.default_options);

        default_options_keys.forEach((default_option_key: string) => {
            /** Si la liste des options ne contient pas une option par défaut, on l'ajoute */
            if (!options_keys.some((option_key: string) => option_key === default_option_key)) {
                this.changeOptions(default_option_key, (<{ [key: string]: unknown }><unknown>this.default_options)[default_option_key]);
            }
        });
    }
}

export interface MapOptions {
    map_type: 'digs' | 'danger' | 'trash';
    dig_mode: 'max' | 'average';
    trash_mode: 'nb' | 'def';
    displayed_scrut_zone: Dictionary<boolean>;
    distances: Distance[];
}

export interface Distance {
    value: number;
    unit: 'km' | 'pa';
    round_trip?: boolean;
}
