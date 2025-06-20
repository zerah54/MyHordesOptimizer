import { booleanAttribute, Component, EventEmitter, input, Input, InputSignalWithTransform, Output } from '@angular/core';
import { Dictionary, Imports } from '../../../_abstract_model/types/_types';
import { areAllDirectionsSelected, AreAllDirectionsSelectedPipe, IsDirectionSelectedPipe } from './is-scrut-direction-selected.pipe';

const angular_common: Imports = [];
const components: Imports = [];
const pipes: Imports = [AreAllDirectionsSelectedPipe, IsDirectionSelectedPipe];
const material_modules: Imports = [];

@Component({
    selector: 'mho-compass-rose',
    templateUrl: './compass-rose.component.html',
    styleUrls: ['./compass-rose.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
})
export class CompassRoseComponent {


    public readonly: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});
    public withDiags: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});
    public multiple: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});
    public withLegend: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});

    @Input() public selectedScrutZone!: Dictionary<boolean>;
    @Output() public selectedScrutZoneChange: EventEmitter<Dictionary<boolean>> = new EventEmitter();

    public addToSelection(direction: string): void {
        if (!this.readonly()) {
            if (this.multiple()) {
                const selected_scrut: Dictionary<boolean> = {...this.selectedScrutZone};
                selected_scrut[direction] = !selected_scrut[direction];
                this.selectedScrutZoneChange.next(selected_scrut);
            } else {
                const selected_scrut: Dictionary<boolean> = {};
                selected_scrut[direction] = true;
                this.selectedScrutZoneChange.next(selected_scrut);
            }
        }
    }

    public addAllToSelection(): void {
        if (!this.readonly() && this.multiple() && this.withDiags()) {
            const is_all_selected: boolean = areAllDirectionsSelected(this.selectedScrutZone);

            const selected_scrut: Dictionary<boolean> = {...this.selectedScrutZone};

            Object.keys(this.selectedScrutZone).forEach((key: string) => {
                selected_scrut[key] = !is_all_selected;
            });
            this.selectedScrutZoneChange.next(selected_scrut);
        }
    }


    // public changeScrutZone(zone: ZoneRegen, changed_scrut_zone: boolean) {

    //     this.changeOptions('displayed_scrut_zone', selected_scrut);
    // }
}
