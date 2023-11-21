import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { MenuComponent } from './menu.component';

const components: Components = [MenuComponent];

@NgModule({
    imports: [SharedModule, ...components],
    exports: [...components]
})

export class MenuModule {
}

