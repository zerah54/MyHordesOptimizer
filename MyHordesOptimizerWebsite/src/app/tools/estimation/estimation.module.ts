import { NgModule } from '@angular/core';
import { EstimationComponent } from './estimation.component';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';

const components: Components = [EstimationComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [...components],
    exports: [...components]
})

export class EstimationModule {
}

