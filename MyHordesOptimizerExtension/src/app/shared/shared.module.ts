import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ElementsModule } from './elements/elements.module';
import { RoutingGuard } from './guards/routing.guard';
import { UserService } from './services/user.service';

let angular_modules: any[] = [
    BrowserModule, FormsModule
];

let lib_modules: any[] = [
    FontAwesomeModule
];

let custom_modules: any[] = [
    ElementsModule
]

let custom_injectables: any[] = [
    RoutingGuard, UserService
];

@NgModule({
    imports: [
        ...angular_modules,
        ...lib_modules,
        ...custom_modules
    ],
    exports: [
        ...angular_modules,
        ...lib_modules,
        ...custom_modules
    ],
    providers: [
        ...custom_injectables
    ]
})
export class SharedModule { }
