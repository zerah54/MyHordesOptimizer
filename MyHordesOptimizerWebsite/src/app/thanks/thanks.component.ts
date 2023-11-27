import { Component, HostBinding } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'mho-thanks',
    templateUrl: './thanks.component.html',
    styleUrls: ['./thanks.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, MatButtonModule, MatDialogClose, MatIconModule, MatDialogContent]
})
export class ThanksComponent {
    @HostBinding('style.display') display: string = 'contents';

}
