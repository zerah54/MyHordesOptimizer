import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HelpButtonComponent } from './elements/help-button/help-button.component';
import { HelpTooltipComponent } from './elements/help-tooltip/help-tooltip.component';

const angular_modules: any[] = [BrowserModule];
const mho_components: any[] = [HelpButtonComponent, HelpTooltipComponent];
const mho_providers: any[] = [];

@NgModule({
    declarations: [
        ...mho_components
    ],
    imports: [
        ...angular_modules
    ],
    exports: [
        ...angular_modules,
        ...mho_components
    ],
    providers: [...mho_providers]
})
export class SharedModule {

}
