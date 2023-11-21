import { NgModule } from '@angular/core';
import { Modules } from '../_abstract_model/types/_types';
import { SharedModule } from '../shared/shared.module';
import { CampingModule } from './camping/camping.module';
import { ProbabilitiesModule } from './probabilities/probabilities.module';

const modules: Modules = [CampingModule, ProbabilitiesModule];

@NgModule({
    imports: [SharedModule, ...modules],
    exports: [...modules]
})

export class ToolsModule {
}

