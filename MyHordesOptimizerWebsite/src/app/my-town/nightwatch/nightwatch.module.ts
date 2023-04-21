import { NgModule } from '@angular/core';
import { NightwatchComponent } from './nightwatch.component';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';

const components: Components = [NightwatchComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [...components],
    exports: [...components]
})

export class NightwatchModule {
}

