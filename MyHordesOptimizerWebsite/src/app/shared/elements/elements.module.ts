import { DecimalPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './../material-modules.module';
import { FilterFieldComponent } from './filter-field/filter-field.component';
import { ItemComponent } from './item/item.component';
import { RecipeComponent } from './recipe/recipe.component';
import { LabelPipe } from './select/label.pipe';
import { SelectComponent } from './select/select.component';

let components: any[] = [ItemComponent, SelectComponent, RecipeComponent, FilterFieldComponent];
let local_components: any[] = [LabelPipe]
let custom_modules: any[] = [MaterialModule]
let angular_modules: any[] = [BrowserModule, BrowserAnimationsModule, RouterModule, HttpClientModule, FormsModule]
let pipes: any[] = [DecimalPipe];

@NgModule({
    imports: [...custom_modules, ...angular_modules, MaterialModule],
    declarations: [
        ...components, ...local_components
    ],
    exports: [...components],
    providers: [...pipes]
})

export class ElementsModule {
}

