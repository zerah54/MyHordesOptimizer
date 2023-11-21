import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { ExpeditionsComponent } from './expeditions.component';

const components: Components = [ExpeditionsComponent];

@NgModule({
    imports: [SharedModule, ...components],
    exports: [...components]
})

export class ExpeditionsModule {
}

