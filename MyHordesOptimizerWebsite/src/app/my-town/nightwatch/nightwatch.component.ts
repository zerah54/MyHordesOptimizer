import { Component, HostBinding } from '@angular/core';

@Component({
    selector: 'mho-nightwatch',
    templateUrl: './nightwatch.component.html',
    styleUrls: ['./nightwatch.component.scss']
})
export class NightwatchComponent {
    @HostBinding('style.display') display: string = 'contents';
}
