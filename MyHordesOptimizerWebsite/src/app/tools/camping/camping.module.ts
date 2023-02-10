import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { Components } from 'src/app/_abstract_model/types/_types';
import { CampingComponent } from './camping.component';

let components: Components = [CampingComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [
        ...components,
    ],
    exports: [...components]
})

export class CampingModule {
}

