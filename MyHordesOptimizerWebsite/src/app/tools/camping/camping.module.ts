import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { CampingComponent } from './camping.component';

const components: Components = [CampingComponent];

@NgModule({
    imports: [SharedModule, ...components],
    exports: [...components]
})

export class CampingModule {
}

