import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { BuildingsComponent } from './buildings.component';

const components: Components = [BuildingsComponent];

@NgModule({
    imports: [SharedModule, ...components],
    exports: [...components]
})

export class BuildingsModule {
}

