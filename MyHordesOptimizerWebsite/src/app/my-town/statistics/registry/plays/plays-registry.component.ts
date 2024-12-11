import { CommonModule, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { DisplayPseudoMode, Entry } from '../../../../_abstract_model/interfaces';
import { Imports } from '../../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenInfoComponent } from '../../../../shared/elements/citizen-info/citizen-info.component';
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
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes,]
})
export class PlaysRegistryComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input({required: true}) completeCitizenList!: CitizenInfo;
    @Input({required: true}) displayPseudo!: DisplayPseudoMode;

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
            label: $localize`Dés / Cartes / Ballon`
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
            id: 'ball',
            img: 'item/item_soccer.gif',
            label: $localize`Ballon`
        }
    ];

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    private entries: Entry[] = [];

    private readonly dices_keywords: string[] = ['Dés', 'Ein paar Würfel', 'Dice', 'Dados'];
    private readonly cards_keywords: string[] = ['Jeu de cartes incomplet', 'Unvollständiges Kartenspiel', 'Incomplete Deck of Cards', 'Juego de cartas incompleto'];
    private readonly ball_keywords: string[] = ['Ballon de foot', 'Fußball', 'Soccer ball', 'Balón de fútbol'];


    public entryHasPlayKeyword(entry: Entry, keyword: string): boolean {
        return entry.entry?.indexOf(' ' + keyword + ' ') > -1 || entry.entry?.indexOf(' ' + keyword + '.') > -1;
    }

    public changePlaysTab(event: MatTabChangeEvent): void {
        this.play_type = <PlayType>event.tab.labelClass;
        setTimeout(() => {
            this.filterEntriesByType(this.entries);
        });
    }

    private filterEntriesByType(entries: Entry[]): void {
        if (this.play_type === 'card') {
            this.entries_by_type = entries.filter((entry: Entry) => {
                return this.cards_keywords.some((cards_keyword: string): boolean => this.entryHasPlayKeyword(entry, cards_keyword));
            });
        } else if (this.play_type === 'dice') {
            this.entries_by_type = entries.filter((entry: Entry) => {
                return this.dices_keywords.some((dices_keyword: string): boolean => this.entryHasPlayKeyword(entry, dices_keyword));
            });
        } else if (this.play_type === 'ball') {
            this.entries_by_type = entries.filter((entry: Entry) => {
                return this.ball_keywords.some((ball_keyword: string): boolean => this.entryHasPlayKeyword(entry, ball_keyword));
            });
        } else {
            const card_entries: Entry[] = entries.filter((entry: Entry) => {
                return this.cards_keywords.some((cards_keyword: string): boolean => this.entryHasPlayKeyword(entry, cards_keyword));
            });
            const dice_entries: Entry[] = entries.filter((entry: Entry) => {
                return this.dices_keywords.some((dices_keyword: string): boolean => this.entryHasPlayKeyword(entry, dices_keyword));
            });
            const ball_entries: Entry[] = entries.filter((entry: Entry) => {
                return this.ball_keywords.some((ball_keyword: string): boolean => this.entryHasPlayKeyword(entry, ball_keyword));
            });
            this.entries_by_type = entries.filter((entry: Entry) => {
                const is_card_keyword: boolean = this.cards_keywords
                    .some((cards_keyword: string): boolean => this.entryHasPlayKeyword(entry, cards_keyword));
                const is_dice_keyword: boolean = this.dices_keywords
                    .some((dices_keyword: string): boolean => this.entryHasPlayKeyword(entry, dices_keyword));
                const is_ball_keyword: boolean = this.ball_keywords
                    .some((ball_keyword: string): boolean => this.entryHasPlayKeyword(entry, ball_keyword));
                const citizen: Citizen | undefined = this.completeCitizenList.citizens
                    .find((citizen: Citizen): boolean => entry.entry?.indexOf(citizen.name) > -1);
                let has_pendant: boolean;
                if (is_dice_keyword) {
                    has_pendant = card_entries.some((cards_entry: Entry): boolean => {
                        const citizen_for_entry: Citizen | undefined = this.completeCitizenList.citizens
                            .find((citizen: Citizen): boolean => cards_entry.entry?.indexOf(citizen.name) > -1);
                        return citizen_for_entry !== undefined && citizen_for_entry === citizen;
                    });
                } else if (is_card_keyword) {
                    has_pendant = dice_entries.some((dice_entry: Entry): boolean => {
                        const citizen_for_entry: Citizen | undefined = this.completeCitizenList.citizens
                            .find((citizen: Citizen): boolean => dice_entry.entry?.indexOf(citizen.name) > -1);
                        return citizen_for_entry !== undefined && citizen_for_entry === citizen;
                    });
                } else if (is_ball_keyword) {
                    has_pendant = ball_entries.some((ball_entry: Entry): boolean => {
                        const citizen_for_entry: Citizen | undefined = this.completeCitizenList.citizens
                            .find((citizen: Citizen): boolean => ball_entry.entry?.indexOf(citizen.name) > -1);
                        return citizen_for_entry !== undefined && citizen_for_entry === citizen;
                    });
                } else {
                    has_pendant = false;
                }
                return (is_dice_keyword || is_card_keyword || is_ball_keyword) && has_pendant;
            });
        }
    }

}

type PlayType = 'dice' | 'card' | 'ball' | 'plays';

interface GameTab {
    id: PlayType;
    label: string;
    img: string;
}
