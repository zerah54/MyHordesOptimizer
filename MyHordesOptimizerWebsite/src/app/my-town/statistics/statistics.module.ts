import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { Components } from 'src/app/_abstract_model/types/_types';
import { ScrutateurComponent } from './scrutateur/scrutateur.component';
import { StatisticsComponent } from './statistics.component';
import { EstimationsComponent } from './estimations/estimations.component';
import { SelectedDayEstimationPipe } from './estimations/selected-day-estimations.pipe';

const components: Components = [StatisticsComponent, ScrutateurComponent, EstimationsComponent];
const pipes: Components = [SelectedDayEstimationPipe];

@NgModule({
    imports: [SharedModule],
    declarations: [...components, ...pipes],
    exports: [...components]
})

export class StatisticsModule {
}

