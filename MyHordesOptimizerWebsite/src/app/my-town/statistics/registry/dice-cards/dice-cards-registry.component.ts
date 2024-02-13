import { CommonModule, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Entry } from '../../../../_abstract_model/interfaces';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenUseDiceOrCardsPipe } from './dice-cards.pipe';

@Component({
    selector: 'mho-registry-dice-cards',
    templateUrl: './dice-cards-registry.component.html',
    styleUrls: ['./dice-cards-registry.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [MatTabsModule, NgOptimizedImage, NgTemplateOutlet, CommonModule, CitizenUseDiceOrCardsPipe]
})
export class DiceCardsRegistryComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input({ required: true }) completeCitizenList!: CitizenInfo;

    @Input({ required: true }) set registry(registry: Entry[] | undefined) {
        if (registry) {
            this.entries = registry;
            this.filterEntriesByType(registry);
        } else {
            this.entries = [];
        }
    }

    protected entries_by_type: Entry[] = [];
    protected play_type!: PlayType;

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    private entries: Entry[] = [];

    private readonly dices_keywords: string[] = ['Dés', 'Ein paar Würfel', 'Dice', 'Dados'];
    private readonly cards_keywords: string[] = ['Jeu de cartes incomplet', 'Unvollständiges Kartenspiel', 'Incomplete Deck of Cards', 'Juego de cartas incompleto'];


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
        } else {
            const card_entries: Entry[] = entries.filter((entry: Entry) => {
                return this.cards_keywords.some((cards_keyword: string): boolean => this.entryHasPlayKeyword(entry, cards_keyword));
            });
            const dice_entries: Entry[] = entries.filter((entry: Entry) => {
                return this.dices_keywords.some((dices_keyword: string): boolean => this.entryHasPlayKeyword(entry, dices_keyword));
            });
            this.entries_by_type = entries.filter((entry: Entry) => {
                const is_card_keyword: boolean = this.cards_keywords
                    .some((cards_keyword: string): boolean => this.entryHasPlayKeyword(entry, cards_keyword));
                const is_dice_keyword: boolean = this.dices_keywords
                    .some((dices_keyword: string): boolean => this.entryHasPlayKeyword(entry, dices_keyword));
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
                } else {
                    has_pendant = false;
                }
                return (is_dice_keyword || is_card_keyword) && has_pendant;
            });
        }
    }

}

type PlayType = 'dice' | 'card' | 'plays';
