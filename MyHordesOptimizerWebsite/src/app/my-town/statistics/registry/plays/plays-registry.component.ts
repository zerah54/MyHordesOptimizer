import { CommonModule, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, input, Input, InputSignal, ViewEncapsulation } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { DisplayPseudoMode, Entry } from '../../../../_abstract_model/interfaces';
import { Imports } from '../../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { CitizenInfoComponent } from '../../../../_shared/citizen-info/citizen-info.component';
import { IsCitizenInEntriesPipe } from '../is-citizen-in-entries.pipe';

const angular_common: Imports = [CommonModule, NgOptimizedImage, NgTemplateOutlet];
const components: Imports = [CitizenInfoComponent];
const pipes: Imports = [IsCitizenInEntriesPipe];
const material_modules: Imports = [MatTabsModule];

@Component({
    selector: 'mho-registry-dice-cards',
    templateUrl: './plays-registry.component.html',
    styleUrls: ['./plays-registry.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes,]
})
export class PlaysRegistryComponent {

    public completeCitizenList: InputSignal<CitizenInfo> = input.required();
    public completeItemsList: InputSignal<Item[]> = input.required();
    public displayPseudo: InputSignal<DisplayPseudoMode> = input.required();

    @Input({required: true}) set registry(registry: Entry[] | undefined) {
        if (registry) {
            this.entries = registry;
            this.filterEntriesByType(registry);
        } else {
            this.entries = [];
        }
    }

    protected entries_by_type: Entry[] = [];
    protected play_type!: PlayType;

    protected readonly tabs: GameTab[] = [
        {
            id: 'plays',
            img: 'item/item_game_box.gif',
            label: $localize`Dés / Cartes / socceron`
        },
        {
            id: 'dice',
            img: 'item/item_dice.gif',
            label: $localize`Dés`
        },
        {
            id: 'card',
            img: 'item/item_cards.gif',
            label: $localize`Cartes`
        },
        {
            id: 'soccer',
            img: 'item/item_soccer.gif',
            label: $localize`socceron`
        }
    ];

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    private entries: Entry[] = [];

    private readonly dices_item: Item = this.completeItemsList().find((item) => item.img.indexOf('item_dice') > -1) as Item;
    private readonly cards_item: Item = this.completeItemsList().find((item) => item.img.indexOf('item_cards') > -1) as Item;
    private readonly soccer_item: Item = this.completeItemsList().find((item) => item.img.indexOf('item_soccer') > -1) as Item;


    protected changePlaysTab(event: MatTabChangeEvent): void {
        this.play_type = <PlayType>event.tab.labelClass;
        setTimeout(() => {
            this.filterEntriesByType(this.entries);
        });
    }

    private entryHasPlayKeyword(entry: Entry, keyword: string): boolean {
        return entry.entry?.indexOf(' ' + keyword + ' ') > -1 || entry.entry?.indexOf(' ' + keyword + '.') > -1;
    }

    private filterEntriesByType(entries: Entry[]): void {
        if (this.play_type === 'card') {
            this.entries_by_type = entries.filter((entry: Entry) => {
                return Object.values(this.cards_item.label).some((label: string): boolean => this.entryHasPlayKeyword(entry, label));
            });
        } else if (this.play_type === 'dice') {
            this.entries_by_type = entries.filter((entry: Entry) => {
                return Object.values(this.dices_item.label).some((label: string): boolean => this.entryHasPlayKeyword(entry, label));
            });
        } else if (this.play_type === 'soccer') {
            this.entries_by_type = entries.filter((entry: Entry) => {
                return Object.values(this.soccer_item.label).some((label: string): boolean => this.entryHasPlayKeyword(entry, label));
            });
        } else {
            const card_entries: Entry[] = entries.filter((entry: Entry) => {
                return Object.values(this.cards_item.label).some((label: string): boolean => this.entryHasPlayKeyword(entry, label));
            });
            const dice_entries: Entry[] = entries.filter((entry: Entry) => {
                return Object.values(this.dices_item.label).some((label: string): boolean => this.entryHasPlayKeyword(entry, label));
            });
            const soccer_entries: Entry[] = entries.filter((entry: Entry) => {
                return Object.values(this.soccer_item.label).some((label: string): boolean => this.entryHasPlayKeyword(entry, label));
            });
            this.entries_by_type = entries.filter((entry: Entry) => {
                const is_card_keyword: boolean = Object.values(this.cards_item.label).some((label: string): boolean => this.entryHasPlayKeyword(entry, label));
                const is_dice_keyword: boolean = Object.values(this.dices_item.label).some((label: string): boolean => this.entryHasPlayKeyword(entry, label));
                const is_soccer_keyword: boolean = Object.values(this.soccer_item.label).some((label: string): boolean => this.entryHasPlayKeyword(entry, label));
                const citizen: Citizen | undefined = this.completeCitizenList().citizens
                    .find((citizen: Citizen): boolean => entry.entry?.indexOf(citizen.name) > -1);
                let has_pendant: boolean;
                if (is_dice_keyword) {
                    has_pendant = card_entries.some((cards_entry: Entry): boolean => {
                        const citizen_for_entry: Citizen | undefined = this.completeCitizenList().citizens
                            .find((citizen: Citizen): boolean => cards_entry.entry?.indexOf(citizen.name) > -1);
                        return citizen_for_entry !== undefined && citizen_for_entry === citizen;
                    });
                } else if (is_card_keyword) {
                    has_pendant = dice_entries.some((dice_entry: Entry): boolean => {
                        const citizen_for_entry: Citizen | undefined = this.completeCitizenList().citizens
                            .find((citizen: Citizen): boolean => dice_entry.entry?.indexOf(citizen.name) > -1);
                        return citizen_for_entry !== undefined && citizen_for_entry === citizen;
                    });
                } else if (is_soccer_keyword) {
                    has_pendant = soccer_entries.some((soccer_entry: Entry): boolean => {
                        const citizen_for_entry: Citizen | undefined = this.completeCitizenList().citizens
                            .find((citizen: Citizen): boolean => soccer_entry.entry?.indexOf(citizen.name) > -1);
                        return citizen_for_entry !== undefined && citizen_for_entry === citizen;
                    });
                } else {
                    has_pendant = false;
                }
                return (is_dice_keyword || is_card_keyword || is_soccer_keyword) && has_pendant;
            });
        }
    }

}

type PlayType = 'dice' | 'card' | 'soccer' | 'plays';

interface GameTab {
    id: PlayType;
    label: string;
    img: string;
}
