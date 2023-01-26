import { Component, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { Dictionary } from 'src/app/_abstract_model/types/_types';
import { AreAllScrutDirectionsSelectedPipe } from './is-scrut-direction-selected.pipe';

@Component({
    selector: 'mho-compass-rose',
    templateUrl: './compass-rose.component.html',
    styleUrls: ['./compass-rose.component.scss']
})
export class CompassRoseComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() selectedScrutZone!: Dictionary<boolean>;

    @Output() selectedScrutZoneChange: EventEmitter<Dictionary<boolean>> = new EventEmitter()

    public constructor(private are_all_scrut_direction_selected_pipe: AreAllScrutDirectionsSelectedPipe) {

    }
    public addToSelection(direction: string): void {
        let selected_scrut: Dictionary<boolean> = { ...this.selectedScrutZone };
        selected_scrut[direction] = !selected_scrut[direction];
        this.selectedScrutZoneChange.next(selected_scrut);
    }

    public addAllToSelection(): void {
        const is_all_selected: boolean = this.are_all_scrut_direction_selected_pipe.transform(this.selectedScrutZone);

        let selected_scrut: Dictionary<boolean> = { ...this.selectedScrutZone };

        Object.keys(this.selectedScrutZone).forEach((key: string) => {
            selected_scrut[key] = !is_all_selected;
        });
        this.selectedScrutZoneChange.next(selected_scrut);
    }


    // public changeScrutZone(zone: ZoneRegen, changed_scrut_zone: boolean) {

    //     this.changeOptions('displayed_scrut_zone', selected_scrut);
    // }
}
