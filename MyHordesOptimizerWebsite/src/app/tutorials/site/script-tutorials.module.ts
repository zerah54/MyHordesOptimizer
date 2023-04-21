import { NgModule } from '@angular/core';
import { TutoSiteFirstUseComponent } from './tuto-site-first-use/tuto-site-first-use.component';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';


const components: Components = [TutoSiteFirstUseComponent];


@NgModule({
    declarations: [...components],
    imports: [SharedModule],
    exports: [...components],
})
export class SiteTutorialsModule {
}
