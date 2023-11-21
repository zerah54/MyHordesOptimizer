import { Component, HostBinding } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'mho-buildings',
    templateUrl: './buildings.component.html',
    styleUrls: ['./buildings.component.scss'],
    standalone: true,
    imports: [MatCardModule]
})
export class BuildingsComponent {
    @HostBinding('style.display') display: string = 'contents';
}
