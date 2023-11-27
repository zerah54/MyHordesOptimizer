import { NgIf } from '@angular/common';
import { Component, HostBinding, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';

@Component({
    selector: 'mho-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss'],
    standalone: true,
    imports: [NgIf, MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, MatDialogClose]
})
export class ConfirmDialogComponent {
    @HostBinding('style.display') display: string = 'contents';

    constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {

    }
}

export interface ConfirmDialogData {
    title: string;
    text: string;
}
