import { TooltipIconComponent } from './tooltip-icon/tooltip-icon.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconButtonComponent } from './icon-button/icon-button.component';

let angular_modules: any[] = [
    BrowserModule
];

let lib_modules: any[] = [
    FontAwesomeModule
];

let elements: any[] = [
    IconButtonComponent, TooltipIconComponent
]

@NgModule({
    declarations: [
        elements
    ],
    imports: [
        ...angular_modules,
        ...lib_modules
    ],
    exports: [
        ...angular_modules,
        ...lib_modules,
        ...elements
    ]
})
export class ElementsModule { }
