import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule];

@Component({
    selector: 'mho-thirst-management',
    templateUrl: './thirst-management.component.html',
    styleUrls: ['./thirst-management.component.scss'],
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ThirstManagementComponent {
    @HostBinding('style.display') display: string = 'contents';

    public readonly locale: string = moment.locale();

    public states_and_actions: (Action | State)[] = [
        {type: 'state', thirst: 'none', ap: 0, wounded: false, ep: 0, cp: 0, shoes: false, bike: false}
    ]

    public addAction(): void {
        this.states_and_actions.push({type: 'action'});
        let states = this.states_and_actions.filter((state: StateOrAction) => state.type === 'state')
        this.states_and_actions.push({...states[states.length - 1]});
    }
}

interface StateOrAction {
    type: 'state' | 'action'
}

interface State extends StateOrAction {
    type: 'state';
    thirst: 'none' | 'thirsty' | 'dehydrated';
    ap: number;
    ep: number;
    wounded: boolean;
    cp: number;
    shoes: boolean;
    bike: boolean
}

interface Action extends StateOrAction {
    type: 'action';
    action?: 'move' | 'drink_water' | 'eat_6_ap' | 'eat_7_ap' | 'drug_6_ap' | 'drug_8_ap' | 'coffee' | 'se' | 'heal';
}
