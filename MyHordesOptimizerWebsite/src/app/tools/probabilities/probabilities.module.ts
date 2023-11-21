import { NgModule } from '@angular/core';
import { ProbabilitiesComponent } from './probabilities.component';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';

const components: Components = [ProbabilitiesComponent];

@NgModule({
    imports: [SharedModule, ...components],
    exports: [...components]
})

export class ProbabilitiesModule {
}

