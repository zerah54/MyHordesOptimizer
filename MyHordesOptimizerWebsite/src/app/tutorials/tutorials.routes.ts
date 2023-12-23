import { Route } from '@angular/router';
import { TutoDiscordBotInstallationComponent } from './discord-bot/tuto-discord-bot-installation/tuto-discord-bot-installation.component';
import { TutoScriptAlertsComponent } from './script/tuto-script-extension-alerts/tuto-script-alerts.component';
import { TutoScriptDisplayComponent } from './script/tuto-script-extension-display/tuto-script-display.component';
import { TutoScriptExternalToolsComponent } from './script/tuto-script-extension-external-tools/tuto-script-external-tools.component';
import { TutoScriptInstallationComponent } from './script/tuto-script-extension-installation/tuto-script-installation.component';
import { TutoScriptToolsComponent } from './script/tuto-script-extension-tools/tuto-script-tools.component';
import { TutoScriptWikiComponent } from './script/tuto-script-extension-wiki/tuto-script-wiki.component';
import { TutoSiteFirstUseComponent } from './site/tuto-site-first-use/tuto-site-first-use.component';

export default [
    { path: '', redirectTo: 'script-extension/installation', pathMatch: 'full' },
    { path: 'script-extension', redirectTo: 'script-extension/installation', pathMatch: 'full' },
    { path: 'site', redirectTo: 'site/first-use', pathMatch: 'full' },
    { path: 'discord-bot', redirectTo: 'discord-bot/installation', pathMatch: 'full' },
    {
        path: 'script-extension', children: [
            {
                path: 'alerts',
                component: TutoScriptAlertsComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Script / Extension` + ' - ' + $localize`Notifications`
            },
            {
                path: 'display',
                component: TutoScriptDisplayComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Script / Extension` + ' - ' + $localize`Affichage`
            },
            {
                path: 'external-tools',
                component: TutoScriptExternalToolsComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Script / Extension` + ' - ' + $localize`Outils externes`
            },
            {
                path: 'installation',
                component: TutoScriptInstallationComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Script / Extension` + ' - ' + $localize`Installation`
            },
            {
                path: 'tools',
                component: TutoScriptToolsComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Script / Extension` + ' - ' + $localize`Outils`
            },
            {
                path: 'wiki',
                component: TutoScriptWikiComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Script / Extension` + ' - ' + $localize`Wiki`
            },
        ]
    },
    {
        path: 'site', children: [
            {
                path: 'first-use',
                component: TutoSiteFirstUseComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Site` + ' - ' + $localize`Première utilisation`
            },
        ]
    },
    {
        path: 'discord-bot', children: [
            {
                path: 'installation',
                component: TutoDiscordBotInstallationComponent,
                title: 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + $localize`Bot Discord` + ' - ' + $localize`Installation`
            },
        ]
    },
] satisfies Route[];
