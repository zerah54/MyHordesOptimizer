import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TutoScriptAlertsComponent } from './script/tuto-script-alerts/tuto-script-alerts.component';
import { TutoScriptDisplayComponent } from './script/tuto-script-display/tuto-script-display.component';
import { TutoScriptExternalToolsComponent } from './script/tuto-script-external-tools/tuto-script-external-tools.component';
import { TutoScriptInstallationComponent } from './script/tuto-script-installation/tuto-script-installation.component';
import { TutoScriptToolsComponent } from './script/tuto-script-tools/tuto-script-tools.component';
import { TutoScriptWikiComponent } from './script/tuto-script-wiki/tuto-script-wiki.component';
import { TutoSiteFirstUseComponent } from './site/tuto-site-first-use/tuto-site-first-use.component';

const routes: Routes = [
    {path: 'tutorials', redirectTo: 'tutorials/script/installation'},
    {
        path: 'tutorials', children: [
            {path: 'script', redirectTo: 'script/installation'},
            {
                path: 'script', children: [
                    {
                        path: 'alerts',
                        component: TutoScriptAlertsComponent,
                        title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Script` + ' - ' + $localize`Notifications`
                    },
                    {
                        path: 'display',
                        component: TutoScriptDisplayComponent,
                        title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Script` + ' - ' + $localize`Affichage`
                    },
                    {
                        path: 'external-tools',
                        component: TutoScriptExternalToolsComponent,
                        title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Script` + ' - ' + $localize`Outils externes`
                    },
                    {
                        path: 'installation',
                        component: TutoScriptInstallationComponent,
                        title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Script` + ' - ' + $localize`Installation`
                    },
                    {
                        path: 'tools',
                        component: TutoScriptToolsComponent,
                        title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Script` + ' - ' + $localize`Outils`
                    },
                    {
                        path: 'wiki',
                        component: TutoScriptWikiComponent,
                        title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Script` + ' - ' + $localize`Wiki`
                    },
                ]
            },
            {path: 'site', redirectTo: 'site/first-use'},
            {
                path: 'site', children: [
                    {
                        path: 'first-use',
                        component: TutoSiteFirstUseComponent,
                        title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Site` + ' - ' + $localize` diverses`
                    },
                ]
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TutorialsRoutingModule {
}
