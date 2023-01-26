import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { Components } from 'src/app/_abstract_model/types/_types';
import { ScrutateurComponent } from './scrutateur/scrutateur.component';
import { StatisticsComponent } from './statistics.component';

let components: Components = [StatisticsComponent, ScrutateurComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [...components],
    exports: [...components]
})

export class StatisticsModule {
}

