import { Component, HostBinding } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AutoDestroy } from 'src/app/shared/decorators/autodestroy.decorator';
import { Dictionary } from 'src/app/_abstract_model/types/_types';
import { ApiServices } from './../../_abstract_model/services/api.services';

@Component({
    selector: 'mho-estimation',
    templateUrl: './estimation.component.html',
    styleUrls: ['./estimation.component.scss']
})
export class EstimationComponent {
    @HostBinding('style.display') display: string = 'contents';

    /** Le jour auquel est fait l'estimation */
    public current_day!: number;
    /** Est-ce qu'on fait l'attaque d'aujourd'hui (true) ou de demain (false) */
    public today: boolean = true;
    /** Le template de valeurs */
    public rows: Template[] = [
        {percent: 33},
        {percent: 38},
        {percent: 42},
        {percent: 46},
        {percent: 50},
        {percent: 54},
        {percent: 58},
        {percent: 63},
        {percent: 67},
        {percent: 71},
        {percent: 75},
        {percent: 79},
        {percent: 83},
        {percent: 88},
        {percent: 92},
        {percent: 96},
        {percent: 100}
    ];

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    public constructor(private api_services: ApiServices) {

    }

    public submit(): void {
        const rows_data: Dictionary<string> = {};
        this.rows.forEach((row: Template) => {
            rows_data[row.percent] = row.min && row.max ? row.min + ' - ' + row.max : ' ';
        })
        this.api_services.estimateAttack(rows_data, this.today, this.current_day)
        .pipe(takeUntil(this.destroy_sub))
        .subscribe((response: string) => {
            console.log('response', response);
        });
    }
}

interface Template {
    percent: number;
    min?: string;
    max?: string;
}
