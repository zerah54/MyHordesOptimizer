import { Component, HostBinding } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'mho-expeditions',
    templateUrl: './expeditions.component.html',
    styleUrls: ['./expeditions.component.scss'],
    standalone: true,
    imports: [MatCardModule]
})
export class ExpeditionsComponent {
    @HostBinding('style.display') display: string = 'contents';
}
