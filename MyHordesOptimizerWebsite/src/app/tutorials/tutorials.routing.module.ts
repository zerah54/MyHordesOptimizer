import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScriptDocumentationComponent } from './script/doc/doc.component';
import { TutoScriptInstallationComponent } from './script/tuto-script-installation/tuto-script-installation.component';

let routes: Routes = [
    { path: 'tutorials', redirectTo: 'tutorials/script/installation' },
    {
        path: 'tutorials', children: [
            {
                path: 'script', children: [
                    { path: 'installation', component: TutoScriptInstallationComponent },
                    { path: 'documentation', component: ScriptDocumentationComponent },
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
