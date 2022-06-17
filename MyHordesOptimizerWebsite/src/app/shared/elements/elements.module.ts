import { SelectComponent } from './select/select.component';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './../material-modules.module';
import { ItemComponent } from './item/item.component';

let components: any[] = [ItemComponent, SelectComponent];
let custom_modules: any[] = [MaterialModule]
let angular_modules: any[] = [BrowserModule, BrowserAnimationsModule, RouterModule, HttpClientModule, FormsModule]

@NgModule({
    imports: [...custom_modules, ...angular_modules],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class ElementsModule {
}

