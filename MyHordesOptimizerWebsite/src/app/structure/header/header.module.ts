import { SharedModule } from '../../shared/shared.module';
import { NgModule } from '@angular/core';
import { HeaderComponent } from './header.component';
import { Components } from '../../_abstract_model/types/_types';

const components: Components = [HeaderComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class HeaderModule {
}

