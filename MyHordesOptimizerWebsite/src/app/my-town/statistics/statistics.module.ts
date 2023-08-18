import { NgModule } from '@angular/core';
import { Components, Modules } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { EstimationsComponent } from './estimations/estimations.component';
import { SelectedDayEstimationPipe } from './estimations/selected-day-estimations.pipe';
import { RegistryModule } from './registry/registry.module';
import { ScrutateurComponent } from './scrutateur/scrutateur.component';
import { StatisticsComponent } from './statistics.component';

const components: Components = [StatisticsComponent, ScrutateurComponent, EstimationsComponent];
const pipes: Components = [SelectedDayEstimationPipe];
const submodules: Modules = [RegistryModule];

@NgModule({
    imports: [SharedModule, ...submodules],
    declarations: [...components, ...pipes],
    exports: [...components]
})

export class StatisticsModule {
}

