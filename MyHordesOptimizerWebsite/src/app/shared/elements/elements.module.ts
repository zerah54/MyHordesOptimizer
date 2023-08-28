import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { Components, Modules } from '../../_abstract_model/types/_types';
import { MaterialModule } from '../material-modules.module';
import { PipesModule } from '../pipes/pipes.module';
import { AccordionComponent } from './accordion/accordion.component';
import { AvatarComponent } from './avatar/avatar.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { DigComponent } from './dig/dig.component';
import { FilterFieldComponent } from './filter-field/filter-field.component';
import { ItemComponent } from './item/item.component';
import { LastUpdateComponent } from './last-update/last-update.component';
import { ListElementAddRemoveComponent } from './list-elements-add-remove/list-element-add-remove.component';
import { MenuAddComponent } from './list-elements-add-remove/menu-add/menu-add.component';
import { MenuRemoveComponent } from './list-elements-add-remove/menu-remove/menu-remove.component';
import { HeaderWithNumberFilterComponent } from './lists/header-with-number-filter/header-with-number-filter.component';
import { HeaderWithNumberPreviousNextFilterComponent } from './lists/header-with-number-previous-next/header-with-number-previous-next-filter.component';
import { HeaderWithSelectFilterComponent } from './lists/header-with-select-filter/header-with-select-filter.component';
import { HeaderWithStringFilterComponent } from './lists/header-with-string-filter/header-with-string-filter.component';
import { RecipeComponent } from './recipe/recipe.component';
import { LabelPipe } from './select/label.pipe';
import { SelectComponent } from './select/select.component';

const components: Components = [
    ItemComponent, SelectComponent, RecipeComponent, FilterFieldComponent, LastUpdateComponent, AccordionComponent, ListElementAddRemoveComponent, MenuAddComponent,
    MenuRemoveComponent, ConfirmDialogComponent, DigComponent, AvatarComponent
];
const list_headers: Components = [HeaderWithStringFilterComponent, HeaderWithNumberFilterComponent, HeaderWithSelectFilterComponent, HeaderWithNumberPreviousNextFilterComponent];
const local_components: Components = [LabelPipe];
const custom_modules: Modules = [MaterialModule, PipesModule];
const angular_modules: Modules = [BrowserModule, BrowserAnimationsModule, RouterModule, HttpClientModule, FormsModule, NgOptimizedImage];
const pipes: Components = [DecimalPipe];

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


