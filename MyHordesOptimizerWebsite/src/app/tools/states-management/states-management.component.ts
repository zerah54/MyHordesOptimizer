import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, HostBinding, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { Imports } from '../../_abstract_model/types/_types';
import { IconApComponent } from '../../shared/elements/icon-ap/icon-ap.component';
import { IconEpComponent } from '../../shared/elements/icon-ep/icon-ep.component';

const angular_common: Imports = [ CommonModule, FormsModule, NgOptimizedImage ];
const components: Imports = [ IconEpComponent, IconApComponent ];
const pipes: Imports = [];
const material_modules: Imports = [ MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule, MatListModule, MatButtonToggleModule, MatDividerModule ];

@Component({
    selector: 'mho-thirst-management',
    templateUrl: './states-management.component.html',
    styleUrls: [ './states-management.component.scss' ],
    encapsulation: ViewEncapsulation.None,
    host: { style: 'display: contents' },
    imports: [ ...angular_common, ...components, ...material_modules, ...pipes ],
})
export class StatesManagementComponent {
    @HostBinding('style.display') display: string = 'contents';

    public readonly locale: string = moment.locale();

    public states_and_actions: (Action | State)[] = [
        { type: 'state', thirst: 'none', ap: 0, wounded: false, ep: 0, cp: 0, shoes: false, bike: false }
    ];

    actions: actions[] = [
        { value: 'water', viewValue: 'Prise de gourde' },
        { value: 'b6', viewValue: 'Nourriture (B6)' },
        { value: 'move', viewValue: 'Déplacement dans l\'OM' },
    ];

    public addAction(): void {
        this.states_and_actions.push({ type: 'action' });
        let states = this.states_and_actions.filter((state: StateOrAction) => state.type === 'state');
        this.states_and_actions.push({ ...states[ states.length - 1 ] });
    }

    toggleHydratedStatus($event: MouseEvent, value: string, buttonToggle: MatButtonToggle) {
        console.log(value);
        console.log(buttonToggle);
        if (buttonToggle.checked) {
            $event.stopPropagation();
            $event.preventDefault();
            //buttonToggle.value = undefined;
            buttonToggle.checked = false;
        }
    }

    protected readonly HORDES_IMG_REPO = HORDES_IMG_REPO;
}

interface actions {
    value: string;
    viewValue: string;
}


interface StateOrAction {
    type: 'state' | 'action';
}

interface State extends StateOrAction {
    type: 'state';
    thirst: 'none' | 'thirsty' | 'dehydrated';
    ap: number;
    ep: number;
    wounded: boolean;
    cp: number;
    shoes: boolean;
    bike: boolean;
}

interface Action extends StateOrAction {
    type: 'action';
    action?: 'move' | 'drink_water' | 'eat_6_ap' | 'eat_7_ap' | 'drug_6_ap' | 'drug_8_ap' | 'coffee' | 'se' | 'heal';
}
