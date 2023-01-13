import { SharedModule } from '../../shared/shared.module';
import { NgModule } from '@angular/core';
import { MenuComponent } from './menu.component';
import { Components } from '../../_abstract_model/types/_types';

let components: Components = [MenuComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class MenuModule {
}

