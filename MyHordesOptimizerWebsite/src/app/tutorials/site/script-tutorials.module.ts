import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { Components } from 'src/app/_abstract_model/types/_types';
import { TutoSiteFirstUseComponent } from './tuto-site-first-use/tuto-site-first-use.component';


const components: Components = [TutoSiteFirstUseComponent];


@NgModule({
    declarations: [...components],
    imports: [SharedModule],
    exports: [...components],
})
export class SiteTutorialsModule { }
