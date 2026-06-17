import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatDialogModule];

@Component({
    selector: 'mho-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class ConfirmDialogComponent {
    protected data: ConfirmDialogData = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

}

export interface ConfirmDialogData {
    title: string;
    text: string;
}
