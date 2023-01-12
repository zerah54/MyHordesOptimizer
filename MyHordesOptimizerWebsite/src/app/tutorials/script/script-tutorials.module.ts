import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { Components } from 'src/app/_abstract_model/types/_types';
import { TutoScriptAlertsComponent } from './tuto-script-alerts/tuto-script-alerts.component';
import { TutoScriptDisplayComponent } from './tuto-script-display/tuto-script-display.component';
import { TutoScriptExternalToolsComponent } from './tuto-script-external-tools/tuto-script-external-tools.component';
import { TutoScriptInstallationComponent } from './tuto-script-installation/tuto-script-installation.component';
import { TutoScriptToolsComponent } from './tuto-script-tools/tuto-script-tools.component';
import { TutoScriptWikiComponent } from './tuto-script-wiki/tuto-script-wiki.component';


const components: Components = [
    TutoScriptInstallationComponent, TutoScriptExternalToolsComponent, TutoScriptToolsComponent,
    TutoScriptWikiComponent, TutoScriptAlertsComponent, TutoScriptDisplayComponent
];


@NgModule({
    declarations: [...components],
    imports: [SharedModule],
    exports: [...components],
})
export class ScriptTutorialsModule { }
