import { Component, HostBinding, ViewChildren, QueryList } from '@angular/core';
import { MatInput } from '@angular/material/input';

@Component({
    selector: 'mho-probabilities',
    templateUrl: './probabilities.component.html',
    styleUrls: ['./probabilities.component.scss']
})
export class ProbabilitiesComponent {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChildren('chances') chances!: QueryList<MatInput>;

    public nb_people: number = 1;

    calculateProbabilities(): void {
        console.log('chances', this.chances);
    }

}
