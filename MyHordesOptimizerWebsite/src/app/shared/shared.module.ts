import { NgOptimizedImage } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { ApiServices } from '../_abstract_model/services/api.services';
import { DigsServices } from '../_abstract_model/services/digs.service';
import { WishlistServices } from '../_abstract_model/services/wishlist.service';
import { Components, Modules } from '../_abstract_model/types/_types';
import { ElementsModule } from './elements/elements.module';
import { IsInTownGuard } from './guards/has-app-key.guard';
import { InDevModeGuard } from './guards/in-dev-mode.guard';
import { MaterialModule } from './material-modules.module';
import { PipesModule } from './pipes/pipes.module';
import { ClipboardService } from './services/clipboard.service';
import { LoadingOverlayService } from './services/loading-overlay.service';
import { SnackbarService } from './services/snackbar.service';

const custom_modules: Modules = [MaterialModule, ElementsModule, PipesModule];
const angular_modules: Modules = [BrowserModule, BrowserAnimationsModule, RouterModule, HttpClientModule, FormsModule, ReactiveFormsModule, NgOptimizedImage];
const services: Components = [ApiServices, DigsServices, LoadingOverlayService, SnackbarService, ClipboardService, WishlistServices];
const guards: Components = [IsInTownGuard, InDevModeGuard];
const external_modules: Modules = [TableVirtualScrollModule];

@NgModule({
    imports: [
        ...angular_modules,
        ...custom_modules,
        ...external_modules,
    ],
    exports: [
        ...angular_modules,
        ...custom_modules,
        ...external_modules,
    ],
    providers: [
        ...services,
        ...guards,
    ]
})

export class SharedModule {
}
