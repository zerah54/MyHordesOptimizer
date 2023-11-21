import { Component, HostBinding } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'mho-nightwatch',
    templateUrl: './nightwatch.component.html',
    styleUrls: ['./nightwatch.component.scss'],
    standalone: true,
    imports: [MatCardModule]
})
export class NightwatchComponent {
    @HostBinding('style.display') display: string = 'contents';
}
