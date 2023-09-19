import { Component, HostBinding, Input } from '@angular/core';

@Component({
    selector: 'mho-avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() src: string | undefined;

}
