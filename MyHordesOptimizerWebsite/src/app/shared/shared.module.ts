import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './material-modules.module';

let custom_modules: any[] = [MaterialModule];
let angular_modules: any[] = [BrowserModule, BrowserAnimationsModule, RouterModule]

@NgModule({
    imports: [
        ...angular_modules,
        ...custom_modules
    ],
    exports: [
        ...angular_modules,
        ...custom_modules
    ]
})

export class SharedModule {
}
