import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { Components } from 'src/app/_abstract_model/types/_types';
import { CampingComponent } from './camping.component';
import { FilterRuinsByKmPipe } from './filter-ruins-by-km.pipe';

let components: Components = [CampingComponent];
let pipes: Components = [FilterRuinsByKmPipe];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components,
        ...pipes
    ],
    exports: [...components]
})

export class CampingModule {
}

