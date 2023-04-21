import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Components } from '../_abstract_model/types/_types';
import { ThanksComponent } from './thanks.component';

const components: Components = [ThanksComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components
    ],
    exports: [...components]
})

export class ThanksModule {
}

