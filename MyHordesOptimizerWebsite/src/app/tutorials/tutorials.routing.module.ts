import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TutoScriptAlertsComponent } from './script/tuto-script-alerts/tuto-script-alerts.component';
import { TutoScriptDisplayComponent } from './script/tuto-script-display/tuto-script-display.component';
import { TutoScriptExternalToolsComponent } from './script/tuto-script-external-tools/tuto-script-external-tools.component';
import { TutoScriptInstallationComponent } from './script/tuto-script-installation/tuto-script-installation.component';
import { TutoScriptToolsComponent } from './script/tuto-script-tools/tuto-script-tools.component';
import { TutoScriptWikiComponent } from './script/tuto-script-wiki/tuto-script-wiki.component';
import { TutoSiteFirstUseComponent } from './site/tuto-site-first-use/tuto-site-first-use.component';

let routes: Routes = [
    { path: 'tutorials', redirectTo: 'tutorials/script/installation' },
    {
        path: 'tutorials', children: [
            {
                path: 'script', children: [
                    { path: 'alerts', component: TutoScriptAlertsComponent },
                    { path: 'display', component: TutoScriptDisplayComponent },
                    { path: 'external-tools', component: TutoScriptExternalToolsComponent },
                    { path: 'installation', component: TutoScriptInstallationComponent },
                    { path: 'tools', component: TutoScriptToolsComponent },
                    { path: 'wiki', component: TutoScriptWikiComponent },
                ]
            },
            {
                path: 'site', children: [
                    { path: 'first-use', component: TutoSiteFirstUseComponent },
                ]
            },
        ]
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TutorialsRoutingModule {
}
