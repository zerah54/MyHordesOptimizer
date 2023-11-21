import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { CampingsComponent } from './campings.component';

const components: Components = [CampingsComponent];

@NgModule({
    imports: [SharedModule, ...components],
    exports: [...components]
})

export class CampingsModule {
}

