import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { CitizensDigsComponent } from './citizens-digs/citizens-digs.component';
import { CitizensListComponent } from './citizens-list/citizens-list.component';
import { CitizensComponent } from './citizens.component';

const components: Components = [CitizensComponent, CitizensListComponent, CitizensDigsComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [...components],
    exports: [...components]
})

export class CitizensModule {
}

