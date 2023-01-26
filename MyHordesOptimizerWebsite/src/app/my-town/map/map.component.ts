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

    public is_gt_xs: boolean = this.breakpoint_observer.isMatched(BREAKPOINTS['gt-xs']);

    private readonly default_options: MapOptions = {
        map_type: 'digs',
        dig_mode: 'average',
        displayed_scrut_zone: {}
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
}
