import { NgModule } from '@angular/core';
import { CampingsComponent } from './campings.component';
import { SharedModule } from '../../shared/shared.module';
import { Components } from '../../_abstract_model/types/_types';

const components: Components = [CampingsComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [...components],
    exports: [...components]
})

export class CampingsModule {
}

