import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import * as moment from 'moment';

@Component({
    selector: 'mho-despair-deaths-calculator',
    templateUrl: './despair-deaths-calculator.component.html',
    styleUrls: ['./despair-deaths-calculator.component.scss'],
    standalone: true,
    imports: [
        MatDialogTitle,
        MatButtonModule,
        MatDialogClose,
        MatIconModule,
        MatDialogContent,
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
    ],
})
export class DespairDeathsCalculatorComponent {
    @HostBinding('style.display') display: string = 'contents';

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
        console.log('test', this.days);
        const saved_days: KilledZombiesForDay[] = [...this.days];
        const new_days: KilledZombiesForDay[] = [this.day_0];

        let i: number = 0;
        while (i === 0 || new_days[i].nb_night_dead_zombies && i < 100) {
            const current_day: KilledZombiesForDay = new_days[i];
            i++;
            console.log('current_day', current_day);
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
