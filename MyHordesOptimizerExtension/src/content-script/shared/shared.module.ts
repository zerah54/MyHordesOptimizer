import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

let angular_modules: any[] = [BrowserModule];
@NgModule({
    declarations: [
    ],
    imports: [
        ...angular_modules
    ],
    exports: [
        ...angular_modules
    ]
})
export class SharedModule {

}
