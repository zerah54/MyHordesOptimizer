import { NgOptimizedImage } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { Components, Modules } from '../_abstract_model/types/_types';
import { ElementsModule } from './elements/elements.module';
import { IsInTownGuard } from './guards/has-app-key.guard';
import { InDevModeGuard } from './guards/in-dev-mode.guard';
import { MaterialModule } from './material-modules.module';
import { PipesModule } from './pipes/pipes.module';
import { ChartsThemingService } from './services/charts-theming.service';
import { ClipboardService } from './services/clipboard.service';
import { LoadingOverlayService } from './services/loading-overlay.service';
import { SnackbarService } from './services/snackbar.service';

const custom_modules: Modules = [MaterialModule, ElementsModule, PipesModule];
const angular_modules: Modules = [BrowserModule, BrowserAnimationsModule, FormsModule, ReactiveFormsModule, NgOptimizedImage];
const services: Components = [LoadingOverlayService, SnackbarService, ClipboardService, ChartsThemingService];
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
