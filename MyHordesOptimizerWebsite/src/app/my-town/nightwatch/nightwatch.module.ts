import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { NightwatchComponent } from './nightwatch.component';

const components: Components = [NightwatchComponent];

@NgModule({
    imports: [SharedModule, ...components],
    exports: [...components]
})

export class NightwatchModule {
}

