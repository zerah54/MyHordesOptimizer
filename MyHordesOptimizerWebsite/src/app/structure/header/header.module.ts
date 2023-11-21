import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { HeaderComponent } from './header.component';

const components: Components = [HeaderComponent];

@NgModule({
    imports: [SharedModule, ...components],
    exports: [...components]
})

export class HeaderModule {
}

