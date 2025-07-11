import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import moment from 'moment';
import { Imports } from '../../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule];

@Component({
    selector: 'mho-despair-deaths-calculator',
    templateUrl: './despair-deaths-calculator.component.html',
    styleUrls: ['./despair-deaths-calculator.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
})
export class DespairDeathsCalculatorComponent {

    public readonly locale: string = moment.locale();

    public day_0: KilledZombiesForDay = {
        day: $localize`Jour J`,
        nb_night_dead_zombies: null,
        nb_killed_zombies: null,
        nb_zombies: null,
        nb_pdc: null

    };
    public days: KilledZombiesForDay[] = [
        this.day_0
    ];

    public rebuildElements(): void {
        const saved_days: KilledZombiesForDay[] = [...this.days];
        const new_days: KilledZombiesForDay[] = [this.day_0];

        let i: number = 0;
        while (i === 0 || new_days[i].nb_night_dead_zombies && i < 100) {
            const current_day: KilledZombiesForDay = new_days[i];
            i++;
            const night_killed_zombies: number = Math.floor(Math.max(0, (+(current_day.nb_killed_zombies || 0) + +(current_day.nb_night_dead_zombies || 0) - 1) / 2));
            const new_day: KilledZombiesForDay = {
                day: $localize`Jour J + ${i}`,
                nb_zombies: Math.max(0, +(current_day.nb_zombies || 0) - +night_killed_zombies),
                nb_night_dead_zombies: +night_killed_zombies,
                nb_killed_zombies: saved_days[i] ? saved_days[i].nb_killed_zombies : null,
                nb_pdc: null
            };
            new_days.push(new_day);
            if (night_killed_zombies === 0) {
                break;
            }
        }
        this.days = [...new_days];
    }
}


interface KilledZombiesForDay {
    day: string;
    nb_night_dead_zombies: number | null;
    nb_killed_zombies: number | null;
    nb_zombies: number | null;
    nb_pdc: number | null;
}
