import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FooterComponent } from './footer.component';
import { Components } from '../../_abstract_model/types/_types';

const components: Components = [FooterComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [...components],
    exports: [...components]
})

export class FooterModule {
}

