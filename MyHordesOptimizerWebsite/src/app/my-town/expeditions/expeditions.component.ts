import { Component, HostBinding } from '@angular/core';

@Component({
    selector: 'mho-expeditions',
    templateUrl: './expeditions.component.html',
    styleUrls: ['./expeditions.component.scss']
})
export class ExpeditionsComponent {
    @HostBinding('style.display') display: string = 'contents';
}
