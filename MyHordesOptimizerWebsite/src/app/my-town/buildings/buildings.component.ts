import { Component, HostBinding } from '@angular/core';

@Component({
    selector: 'mho-buildings',
    templateUrl: './buildings.component.html',
    styleUrls: ['./buildings.component.scss']
})
export class BuildingsComponent {
    @HostBinding('style.display') display: string = 'contents';
}
