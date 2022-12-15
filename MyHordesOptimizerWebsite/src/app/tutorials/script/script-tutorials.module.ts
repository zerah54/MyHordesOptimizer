import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ScriptDocumentationComponent } from './doc/doc.component';
import { TutoScriptInstallationComponent } from './tuto-script-installation/tuto-script-installation.component';
import { TutoScriptUpdateExternalToolsComponent } from './tuto-script-update-external-tools/tuto-script-update-external-tools.component';


const components: any[] = [TutoScriptInstallationComponent, ScriptDocumentationComponent, TutoScriptUpdateExternalToolsComponent];


@NgModule({
    declarations: [...components],
    imports: [SharedModule],
    exports: [...components],
})
export class ScriptTutorialsModule { }
