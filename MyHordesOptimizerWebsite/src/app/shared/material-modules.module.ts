import { CdkAccordionModule } from '@angular/cdk/accordion';
import { ClipboardModule } from '@angular/cdk/clipboard';

import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Modules } from '../_abstract_model/types/_types';


let material_modules: Modules = [
    MatButtonModule, MatCardModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatProgressSpinnerModule, MatSelectModule,
    MatSidenavModule, MatSnackBarModule, MatTableModule, MatToolbarModule, MatRadioModule, MatCheckboxModule, ClipboardModule, CdkAccordionModule, MatChipsModule, MatTooltipModule,
    MatSortModule
];

@NgModule({
    imports: material_modules,
    exports: material_modules
})

export class MaterialModule { }
