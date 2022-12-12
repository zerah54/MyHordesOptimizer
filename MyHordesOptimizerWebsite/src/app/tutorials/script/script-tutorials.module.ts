import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ScriptDocumentationComponent } from './doc/doc.component';
import { TutoScriptInstallationComponent } from './tuto-script-installation/tuto-script-installation.component';


const components: any[] = [TutoScriptInstallationComponent, ScriptDocumentationComponent];


@NgModule({
    declarations: [...components],
    imports: [SharedModule],
    exports: [...components],
})
export class ScriptTutorialsModule { }
