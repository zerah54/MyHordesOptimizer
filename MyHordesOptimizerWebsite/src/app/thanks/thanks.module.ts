import { NgModule } from '@angular/core';
import { Components } from '../_abstract_model/types/_types';
import { SharedModule } from '../shared/shared.module';
import { ThanksComponent } from './thanks.component';

const components: Components = [ThanksComponent];

@NgModule({
    imports: [SharedModule, ...components],
    exports: [...components]
})

export class ThanksModule {
}

