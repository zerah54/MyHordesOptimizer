import { NgModule } from '@angular/core';
import { CampingComponent } from './camping.component';
import { SharedModule } from '../../shared/shared.module';
import { Components } from '../../_abstract_model/types/_types';

const components: Components = [CampingComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components,
    ],
    exports: [...components]
})

export class CampingModule {
}

