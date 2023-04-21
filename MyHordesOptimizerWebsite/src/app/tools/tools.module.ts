import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Modules } from '../_abstract_model/types/_types';
import { CampingModule } from './camping/camping.module';
import { EstimationModule } from './estimation/estimation.module';
import { ProbabilitiesModule } from './probabilities/probabilities.module';
import { ToolsRoutingModule } from './tools.routing.module';

const modules: Modules = [CampingModule, EstimationModule, ProbabilitiesModule];

@NgModule({
    imports: [SharedModule, ToolsRoutingModule, ...modules],
    exports: [...modules]
})

export class ToolsModule {
}

