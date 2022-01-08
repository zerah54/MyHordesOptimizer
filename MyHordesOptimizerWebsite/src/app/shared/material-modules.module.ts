import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';

let material_modules: any[] = [MatToolbarModule, MatIconModule, MatButtonModule, MatSidenavModule, MatListModule, MatFormFieldModule, MatInputModule];

@NgModule({
    imports: material_modules,
    exports: material_modules
})

export class MaterialModule { }
