import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

let material_modules: any[] = [MatToolbarModule, MatIconModule, MatButtonModule]

@NgModule({
    imports: material_modules,
    exports: material_modules
})

export class MaterialModule { }