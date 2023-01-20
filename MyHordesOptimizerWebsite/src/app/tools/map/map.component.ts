import { Component, HostBinding, OnInit, ViewEncapsulation } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { ZoneRegen } from 'src/app/_abstract_model/enum/zone-regen.enum';
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

    /** La carte de la ville */
    public map!: Town;
    public all_ruins!: Ruin[];
    public all_items!: Item[];

    public options!: MapOptions;

    public scrut_list: ZoneRegen[] = ZoneRegen.getAllValues();

    private readonly default_options: MapOptions = {
        map_type: 'digs',
        dig_mode: 'average',
        display_km: false,
        display_pa: false,
        displayed_scrut_zone: {}
    }

    constructor(public media: MediaObserver, private api: ApiServices) {

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

        this.options = JSON.parse(localStorage.getItem('MAP_OPTIONS') || JSON.stringify(this.default_options));
        this.checkIfAllOptionsExist();
    }

    public changeScrutZone(zone: ZoneRegen, changed_scrut_zone: boolean) {
        let selected_scrut: Dictionary<boolean> = {...this.options.displayed_scrut_zone};

        selected_scrut[zone.key] = changed_scrut_zone;
        this.changeOptions('displayed_scrut_zone', selected_scrut);
    }

    public changeOptions<T>(key: string, value: T): void {
        this.options[key] = value;
        setTimeout(() => {
            this.options = {...this.options};
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
    display_km: boolean;
    display_pa: boolean;
    displayed_scrut_zone: Dictionary<boolean>;
}
