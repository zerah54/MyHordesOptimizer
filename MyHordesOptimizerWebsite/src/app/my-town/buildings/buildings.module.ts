import { NgModule } from '@angular/core';
import { BuildingsComponent } from './buildings.component';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';

const components: Components = [BuildingsComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [...components],
    exports: [...components]
})

export class BuildingsModule {
}

