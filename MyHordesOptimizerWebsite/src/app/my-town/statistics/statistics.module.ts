import { NgModule } from '@angular/core';
import { ScrutateurComponent } from './scrutateur/scrutateur.component';
import { StatisticsComponent } from './statistics.component';
import { EstimationsComponent } from './estimations/estimations.component';
import { SelectedDayEstimationPipe } from './estimations/selected-day-estimations.pipe';
import { RegistryComponent } from './registry/registry.component';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { CitizenUseDiceOrCardsPipe } from './registry/dice-cards.pipe';
import { BankCleanEntriesPipe, BankDiffPipe } from './registry/bank-gift.pipe';
import { WellPipe } from './registry/well.pipe';

const components: Components = [StatisticsComponent, ScrutateurComponent, EstimationsComponent, RegistryComponent];
const pipes: Components = [SelectedDayEstimationPipe, CitizenUseDiceOrCardsPipe, BankDiffPipe, BankCleanEntriesPipe, WellPipe];

@NgModule({
    imports: [SharedModule],
    declarations: [...components, ...pipes],
    exports: [...components]
})

export class StatisticsModule {
}

