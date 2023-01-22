import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { Components, Modules } from '../_abstract_model/types/_types';
import { ApiServices } from './../_abstract_model/services/api.services';
import { ElementsModule } from './elements/elements.module';
import { IsInTownGuard } from './guards/has-app-key.guard';
import { MaterialModule } from './material-modules.module';
import { ClipboardService } from './services/clipboard.service';
import { LoadingOverlayService } from './services/loading-overlay.service';
import { SnackbarService } from './services/snackbar.service';

let custom_modules: Modules = [MaterialModule, ElementsModule];
let angular_modules: Modules = [BrowserModule, BrowserAnimationsModule, RouterModule, HttpClientModule, FormsModule, ReactiveFormsModule]
let services: Components = [ApiServices, LoadingOverlayService, SnackbarService, ClipboardService]
let guards: Components = [IsInTownGuard];

@NgModule({
    imports: [
        ...angular_modules,
        ...custom_modules,
    ],
    exports: [
        ...angular_modules,
        ...custom_modules,
    ],
    providers: [
        ...services,
        ...guards,
    ]
})

export class SharedModule {
}
