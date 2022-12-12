import { DecimalPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './../material-modules.module';
import { AccordionComponent } from './accordion/accordion.component';
import { FilterFieldComponent } from './filter-field/filter-field.component';
import { ItemComponent } from './item/item.component';
import { LastUpdateComponent } from './last-update/last-update.component';
import { RecipeComponent } from './recipe/recipe.component';
import { LabelPipe } from './select/label.pipe';
import { SelectComponent } from './select/select.component';

let components: any[] = [ItemComponent, SelectComponent, RecipeComponent, FilterFieldComponent, LastUpdateComponent, AccordionComponent];
let local_components: any[] = [LabelPipe]
let custom_modules: any[] = [MaterialModule]
let angular_modules: any[] = [BrowserModule, BrowserAnimationsModule, RouterModule, HttpClientModule, FormsModule]
let pipes: any[] = [DecimalPipe];

@NgModule({
    imports: [...custom_modules, ...angular_modules],
    declarations: [
        ...components, ...local_components
    ],
    exports: [...components],
    providers: [...pipes]
})

export class ElementsModule {
}


