import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScriptDocumentationComponent } from './script/doc/doc.component';
import { TutoScriptInstallationComponent } from './script/tuto-script-installation/tuto-script-installation.component';
import { TutoScriptUpdateExternalToolsComponent } from './script/tuto-script-update-external-tools/tuto-script-update-external-tools.component';
import { TutoSiteFirstUseComponent } from './site/tuto-site-first-use/tuto-site-first-use.component';

let routes: Routes = [
    { path: 'tutorials', redirectTo: 'tutorials/script/installation' },
    {
        path: 'tutorials', children: [
            {
                path: 'script', children: [
                    { path: 'installation', component: TutoScriptInstallationComponent },
                    { path: 'update-external-tools', component: TutoScriptUpdateExternalToolsComponent },
                    { path: 'documentation', component: ScriptDocumentationComponent },
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
