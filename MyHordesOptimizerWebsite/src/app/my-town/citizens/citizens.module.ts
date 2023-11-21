import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { CitizensDigsComponent } from './citizens-digs/citizens-digs.component';
import { CitizensDispoComponent } from './citizens-dispo/citizens-dispo.component';
import { CitizensListComponent } from './citizens-list/citizens-list.component';
import { TypeRowPipe } from './citizens-list/type-row.pipe';
import { CitizensComponent } from './citizens.component';

const components: Components = [CitizensComponent, CitizensListComponent, CitizensDigsComponent, CitizensDispoComponent];
const pipes: Components = [TypeRowPipe];

@NgModule({
    imports: [SharedModule, ...components, ...pipes],
    exports: [...components]
})

export class CitizensModule {
}

