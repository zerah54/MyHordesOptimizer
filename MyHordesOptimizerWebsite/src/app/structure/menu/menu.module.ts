import { SharedModule } from '../../shared/shared.module';
import { NgModule } from '@angular/core';
import { MenuComponent } from './menu.component';

let components: any[] = [MenuComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class MenuModule {
}

