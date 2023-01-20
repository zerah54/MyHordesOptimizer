import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { Components } from 'src/app/_abstract_model/types/_types';
import { CitizensDigsComponent } from './citizens-digs/citizens-digs.component';
import { CitizensListComponent } from './citizens-list/citizens-list.component';
import { CitizensComponent } from './citizens.component';

let components: Components = [CitizensComponent, CitizensListComponent, CitizensDigsComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [...components],
    exports: [...components]
})

export class CitizensModule {
}

