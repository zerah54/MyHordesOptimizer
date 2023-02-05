import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, HostBinding, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { BREAKPOINTS } from 'src/app/_abstract_model/const';
import { ZoneRegen } from 'src/app/_abstract_model/enum/zone-regen.enum';
import { CitizenInfo } from 'src/app/_abstract_model/types/citizen-info.class';
import { Citizen } from 'src/app/_abstract_model/types/citizen.class';
import { Item } from 'src/app/_abstract_model/types/item.class';
import { Ruin } from 'src/app/_abstract_model/types/ruin.class';
import { Town } from 'src/app/_abstract_model/types/town.class';
import { Dictionary } from 'src/app/_abstract_model/types/_types';
import { ApiServices } from '../../_abstract_model/services/api.services';

@Component({
    selector: 'mho-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MapComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @HostListener('window:resize', ['$event'])
    onResize() {
        this.is_gt_xs = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);
    }

    /** La carte de la ville */
    public map!: Town;
    public all_ruins!: Ruin[];
    public all_items!: Item[];
    public all_citizens!: Citizen[];

    public options!: MapOptions;

    public new_distance_option: Distance = {
        value: 1,
        unit: 'km'
    }

    public is_gt_xs: boolean = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);

    private readonly default_options: MapOptions = {
        map_type: 'digs',
        dig_mode: 'average',
        displayed_scrut_zone: {},
        distances: []
    }

    constructor(private breakpoint_observer: BreakpointObserver, private api: ApiServices) {

    }

    ngOnInit(): void {
        this.api.getMap().subscribe((map: Town) => {
            this.map = map;
        });
        this.api.getRuins().subscribe((ruins: Ruin[]) => {
            this.all_ruins = ruins;
        });
        this.api.getItems().subscribe((items: Item[]) => {
            this.all_items = items;
        });
        this.api.getCitizens().subscribe((citizens: CitizenInfo) => {
            this.all_citizens = citizens.citizens;
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

        let current_distances: Distance[] = [...this.options.distances];

        const already_exists: boolean = [...current_distances].some((distance: Distance) => {
            return distance.unit === this.new_distance_option.unit
            && +distance.value === +this.new_distance_option.value
            && distance.round_trip === this.new_distance_option.round_trip
        })

        /** Si il existe une option absolument identique, alors on n'ajoute rien */
        if (already_exists && current_distances.length > 0) return;

        /** Sinon, on ajoute à la liste */
        current_distances.push({...this.new_distance_option});

        this.changeOptions('distances', [...current_distances]);
    }


    public removeDistanceFromList(distance_to_remove: Distance): void {

        let current_distances: Distance[] = [...this.options.distances];

        const index: number = current_distances.findIndex((distance: Distance) => {
            return distance.unit === distance_to_remove.unit
            && +distance.value === +distance_to_remove.value
            && distance.round_trip === distance_to_remove.round_trip
        })

        /** Si il n'existe pas d'option absolument identique, alors on ne retire rien */
        if (index < 0) return;

        /** Sinon, on retire de la liste */
        current_distances.splice(index, 1);

        this.changeOptions('distances', current_distances);
    }

    public changeOptions<T>(key: string, value: T): void {
        this.options[key] = value;
        setTimeout(() => {
            this.options = { ...this.options };
            localStorage.setItem('MAP_OPTIONS', JSON.stringify(this.options));
        })
    }

    private checkIfAllOptionsExist(): void {
        let options_keys: string[] = Object.keys(this.options);
        let default_options_keys: string[] = Object.keys(this.default_options);

        default_options_keys.forEach((default_option_key: string) => {
            /** Si la liste des options ne contient pas une option par défaut, on l'ajoute */
            if (!options_keys.some((option_key: string) => option_key === default_option_key)) {
                this.changeOptions(default_option_key, this.default_options[default_option_key])
            }
        });
    }
}

export interface MapOptions {
    map_type: 'digs' | 'danger';
    dig_mode: 'max' | 'average';
    displayed_scrut_zone: Dictionary<boolean>;
    distances: Distance[];
}

export interface Distance {
    value: number;
    unit: 'km' | 'pa';
    round_trip?: boolean;
}
