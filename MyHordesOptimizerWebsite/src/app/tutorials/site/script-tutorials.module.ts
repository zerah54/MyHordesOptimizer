import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { TutoSiteFirstUseComponent } from './tuto-site-first-use/tuto-site-first-use.component';


const components: any[] = [TutoSiteFirstUseComponent];


@NgModule({
    declarations: [...components],
    imports: [SharedModule],
    exports: [...components],
})
export class SiteTutorialsModule { }
