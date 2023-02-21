import { Component, HostBinding, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'mho-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss']
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
