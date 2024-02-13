import { Component, HostBinding } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'mho-campings',
    templateUrl: './campings.component.html',
    styleUrls: ['./campings.component.scss'],
    standalone: true,
    imports: [MatCardModule]
})
export class CampingsComponent {
    @HostBinding('style.display') display: string = 'contents';
}
