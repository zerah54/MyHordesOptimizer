import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { Components } from 'src/app/_abstract_model/types/_types';
import { ProbabilitiesComponent } from './probabilities.component';
import { ProbabilitiesPipe } from './probabilities.pipe';

let components: Components = [ProbabilitiesComponent];
let pipes: Components = [ProbabilitiesPipe];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components,
        ...pipes
    ],
    exports: [...components]
})

export class ProbabilitiesModule {
}

