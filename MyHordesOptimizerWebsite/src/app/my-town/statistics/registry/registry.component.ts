import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, HostBinding, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { environment } from '../../../../environments/environment';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { DisplayPseudoMode, Entry } from '../../../_abstract_model/interfaces';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { BankDiffRegistryComponent } from './bank-diff/bank-diff-registry.component';
import { BuildingsRegistryComponent } from './buildings/buildings-registry.component';
import { DigsRegistryComponent } from './digs/digs-registry.component';
import { DoorsRegistryComponent } from './doors/doors-registry.component';
import { FlagRegistryComponent } from './flag/flag-registry.component';
import { PlaysRegistryComponent } from './plays/plays-registry.component';
import { TelescopeRegistryComponent } from './telescope/telescope-registry.component';
import { WellRegistryComponent } from './well/well-registry.component';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage];
const components: Imports = [BankDiffRegistryComponent, PlaysRegistryComponent, DigsRegistryComponent, DoorsRegistryComponent, WellRegistryComponent,
    TelescopeRegistryComponent, FlagRegistryComponent, BuildingsRegistryComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatTooltipModule];

@Component({
    selector: 'mho-registry',
    templateUrl: './registry.component.html',
    styleUrls: ['./registry.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class RegistryComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public dev_mode: boolean = !environment.production;

    public registry: string | undefined;
    public registry_entries: Entry[] | undefined;
    public display_mode: RegistryMode;

    public complete_citizen_list!: CitizenInfo;
    public complete_items_list!: Item[];
    public display_pseudo: DisplayPseudoMode = 'simple';

    public tabs: Tab[] = [
        {mode: 'plays', label: $localize`Dés / Cartes / Ballon`, img: 'item/item_game_box.gif'},
        {mode: 'bank_diff', label: $localize`Différenciel de la banque`, img: 'icons/home.gif'},
        {mode: 'well', label: $localize`Prises dans le puits`, img: 'icons/small_well.gif'},
        {mode: 'digs', label: $localize`Fouilles`, img: 'building/small_dig.gif'},
        {mode: 'doors', label: $localize`Entrées / Sorties`, img: 'log/door_open.gif'},
        {mode: 'telescope', label: $localize`Téléscope`, img: 'item/item_scope.gif'},
        {mode: 'flag', label: $localize`Drapeau`, img: 'item/item_flag.gif'},
        {mode: 'buildings', label: $localize`Utilisation des chantiers`, img: 'icons/home.gif'}
    ];

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    private api_service: ApiService = inject(ApiService);
    private town_service: TownService = inject(TownService);

    public ngOnInit(): void {
        this.town_service
            .getCitizens().subscribe((citizen: CitizenInfo): void => {
            this.complete_citizen_list = citizen;
        });
        this.api_service
            .getItems().subscribe((items: Item[]): void => {
            this.complete_items_list = items;
        });
    }

    public readLogs(display_mode: RegistryMode): void {
        if (this.registry) {
            this.registry_entries = this.registry.split('\n')
                .map((entry: string): Entry => {
                    const hour_match: RegExpMatchArray | null = entry.match(/\d\d?:\d\d/);
                    const hour: string = hour_match && hour_match?.length > 0 ? hour_match[0] : '';
                    return {
                        hour: hour,
                        entry: entry.replace(hour, '').replace(' [X] ', '').replace('[X]', '')
                    };
                })
                .filter((entry: Entry) => entry.entry !== undefined && entry.entry !== null && entry.entry !== '');

            this.display_mode = display_mode;
        } else {
            this.registry = '';
        }
    }

}

type RegistryMode = 'dice' | 'card' | 'digs' | 'bank_diff' | 'well' | 'plays' | 'doors' | 'telescope' | 'flag' | 'buildings' | undefined;

interface Tab {
    mode: RegistryMode;
    label: string;
    img: string;
}
