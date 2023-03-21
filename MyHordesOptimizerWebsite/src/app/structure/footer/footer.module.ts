import { NgModule } from '@angular/core';
import { Components } from 'src/app/_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { FooterComponent } from './footer.component';

const components: Components = [FooterComponent];

@NgModule({
    imports: [SharedModule],
    declarations: [...components],
    exports: [...components]
})

export class FooterModule {
}

