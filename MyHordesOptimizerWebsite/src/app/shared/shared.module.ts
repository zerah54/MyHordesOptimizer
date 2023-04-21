import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { Components, Modules } from '../_abstract_model/types/_types';
import { ElementsModule } from './elements/elements.module';
import { IsInTownGuard } from './guards/has-app-key.guard';
import { MaterialModule } from './material-modules.module';
import { ArrayItemDetailsPipe } from './pipes/array-item-details.pipe';
import { CitizensFromShortPipe } from './pipes/citizens-from-short.pipe';
import { ItemDetailsPipe } from './pipes/item-details.pipe';
import { ClipboardService } from './services/clipboard.service';
import { LoadingOverlayService } from './services/loading-overlay.service';
import { SnackbarService } from './services/snackbar.service';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { DigsServices } from '../_abstract_model/services/digs.service';
import { FilterRuinsByKmPipe } from './pipes/filter-ruins-by-km.pipe';
import { WishlistServices } from '../_abstract_model/services/wishlist.service';
import { CustomKeyValuePipe } from './pipes/key-value.pipe';
import { ItemsGroupByCategory } from './pipes/items-group-by-category.pipe';
import { InDevModeGuard } from './guards/in-dev-mode.guard';
import { ApiServices } from '../_abstract_model/services/api.services';
import { NgOptimizedImage } from '@angular/common';

const custom_modules: Modules = [MaterialModule, ElementsModule];
const angular_modules: Modules = [BrowserModule, BrowserAnimationsModule, RouterModule, HttpClientModule, FormsModule, ReactiveFormsModule, NgOptimizedImage];
const services: Components = [ApiServices, DigsServices, LoadingOverlayService, SnackbarService, ClipboardService, WishlistServices];
const guards: Components = [IsInTownGuard, InDevModeGuard];
const pipes: Components = [ArrayItemDetailsPipe, CitizensFromShortPipe, ItemDetailsPipe, FilterRuinsByKmPipe, CustomKeyValuePipe, ItemsGroupByCategory];
const external_modules: Modules = [TableVirtualScrollModule];

@NgModule({
    declarations: [...pipes],
    imports: [
        ...angular_modules,
        ...custom_modules,
        ...external_modules,
    ],
    exports: [
        ...angular_modules,
        ...custom_modules,
        ...external_modules,
        ...pipes
    ],
    providers: [
        ...services,
        ...guards,
        ...pipes
    ]
})

export class SharedModule {
}
