import { SharedModule } from './../shared/shared.module';
import { NgModule } from '@angular/core';
import { NavbarComponent } from './navbar.component';

let components: any[] = [NavbarComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class NavbarModule {
}

