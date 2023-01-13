import { DecimalPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { Components, Modules } from 'src/app/_abstract_model/types/_types';
import { MaterialModule } from './../material-modules.module';
import { AccordionComponent } from './accordion/accordion.component';
import { FilterFieldComponent } from './filter-field/filter-field.component';
import { ItemComponent } from './item/item.component';
import { LastUpdateComponent } from './last-update/last-update.component';
import { ListElementAddRemoveComponent } from './list-elements-add-remove/list-element-add-remove.component';
import { HeaderWithNumberFilterComponent } from './lists/header-with-number-filter/header-with-number-filter.component';
import { HeaderWithSelectFilterComponent } from './lists/header-with-select-filter/header-with-select-filter.component';
import { HeaderWithStringFilterComponent } from './lists/header-with-string-filter/header-with-string-filter.component';
import { RecipeComponent } from './recipe/recipe.component';
import { LabelPipe } from './select/label.pipe';
import { SelectComponent } from './select/select.component';

let components: Components = [ItemComponent, SelectComponent, RecipeComponent, FilterFieldComponent, LastUpdateComponent, AccordionComponent, ListElementAddRemoveComponent];
let list_headers: Components = [HeaderWithStringFilterComponent, HeaderWithNumberFilterComponent, HeaderWithSelectFilterComponent];
let local_components: Components = [LabelPipe];
let custom_modules: Modules = [MaterialModule];
let angular_modules: Modules = [BrowserModule, BrowserAnimationsModule, RouterModule, HttpClientModule, FormsModule];
let pipes: Components = [DecimalPipe];

@NgModule({
    imports: [...custom_modules, ...angular_modules],
    declarations: [
        ...components, ...local_components, ...list_headers
    ],
    exports: [...components, ...list_headers],
    providers: [...pipes]
})

export class ElementsModule {
}


