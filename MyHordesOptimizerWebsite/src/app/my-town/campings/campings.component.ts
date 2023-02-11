import { Component, HostBinding } from '@angular/core';

@Component({
    selector: 'mho-campings',
    templateUrl: './campings.component.html',
    styleUrls: ['./campings.component.scss']
})
export class CampingsComponent {
    @HostBinding('style.display') display: string = 'contents';
}
