import { Component, HostBinding } from '@angular/core';

@Component({
    selector: 'mho-thanks',
    templateUrl: './thanks.component.html',
    styleUrls: ['./thanks.component.scss']
})
export class ThanksComponent {
    @HostBinding('style.display') display: string = 'contents';

}
