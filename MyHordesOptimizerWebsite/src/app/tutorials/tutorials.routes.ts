import { Route } from '@angular/router';

import { TUTORIAL_ROUTE_DATA_KEY, TutorialPage } from './_model/tutorial.model';
import { DISCORD_BOT_COMMANDS } from './content/discord-bot/commands.content';
import { DISCORD_BOT_INSTALLATION } from './content/discord-bot/installation.content';
import { SCRIPT_EXTENSION_ADDITIONAL_INFO } from './content/script-extension/additional-info.content';
import { SCRIPT_EXTENSION_ALERTS } from './content/script-extension/alerts.content';
import { SCRIPT_EXTENSION_EXTERNAL_TOOLS } from './content/script-extension/external-tools.content';
import { SCRIPT_EXTENSION_FORUM } from './content/script-extension/forum.content';
import { SCRIPT_EXTENSION_GETTING_STARTED } from './content/script-extension/getting-started.content';
import { SCRIPT_EXTENSION_INSTALLATION } from './content/script-extension/installation.content';
import { SCRIPT_EXTENSION_INTERFACE } from './content/script-extension/interface.content';
import { SCRIPT_EXTENSION_TOOLS } from './content/script-extension/tools.content';
import { SCRIPT_EXTENSION_WIKI } from './content/script-extension/wiki.content';
import { SITE_ACCOUNT } from './content/site/account.content';
import { SITE_DIRECTORY } from './content/site/directory.content';
import { SITE_GAMES } from './content/site/games.content';
import { SITE_MY_TOWN } from './content/site/my-town.content';
import { SITE_TOOLS } from './content/site/tools.content';
import { SITE_WIKI } from './content/site/wiki.content';
import { TutoSiteFirstUseComponent } from './site/tuto-site-first-use/tuto-site-first-use.component';
import { TutorialPageComponent } from './tutorial-page/tutorial-page.component';

const SCRIPT_EXTENSION: string = $localize`Script / Extension`;
const SITE: string = $localize`Site`;
const DISCORD_BOT: string = $localize`Bot Discord`;

function pageTitle(section: string, page: string): string {
    return 'MyHordes Optimizer' + ' - ' + $localize`Tutoriels` + ' - ' + section + ' - ' + page;
}

/** Page de tutoriel décrite par un contenu (dossier `content`), affichée par {@link TutorialPageComponent}. */
function tutorialRoute(path: string, section: string, page: TutorialPage): Route {
    return {
        path,
        component: TutorialPageComponent,
        data: { [TUTORIAL_ROUTE_DATA_KEY]: page },
        title: pageTitle(section, page.title)
    };
}

export default [
    { path: '', redirectTo: 'script-extension/installation', pathMatch: 'full' },
    { path: 'script-extension', redirectTo: 'script-extension/installation', pathMatch: 'full' },
    { path: 'site', redirectTo: 'site/first-use', pathMatch: 'full' },
    { path: 'discord-bot', redirectTo: 'discord-bot/installation', pathMatch: 'full' },
    {
        path: 'script-extension', children: [
            tutorialRoute('installation', SCRIPT_EXTENSION, SCRIPT_EXTENSION_INSTALLATION),
            tutorialRoute('getting-started', SCRIPT_EXTENSION, SCRIPT_EXTENSION_GETTING_STARTED),
            tutorialRoute('tools', SCRIPT_EXTENSION, SCRIPT_EXTENSION_TOOLS),
            tutorialRoute('wiki', SCRIPT_EXTENSION, SCRIPT_EXTENSION_WIKI),
            tutorialRoute('external-tools', SCRIPT_EXTENSION, SCRIPT_EXTENSION_EXTERNAL_TOOLS),
            tutorialRoute('additional-info', SCRIPT_EXTENSION, SCRIPT_EXTENSION_ADDITIONAL_INFO),
            tutorialRoute('display', SCRIPT_EXTENSION, SCRIPT_EXTENSION_INTERFACE),
            tutorialRoute('forum', SCRIPT_EXTENSION, SCRIPT_EXTENSION_FORUM),
            tutorialRoute('alerts', SCRIPT_EXTENSION, SCRIPT_EXTENSION_ALERTS)
        ]
    },
    {
        path: 'site', children: [
            {
                path: 'first-use',
                component: TutoSiteFirstUseComponent,
                title: pageTitle(SITE, $localize`Première utilisation`)
            },
            tutorialRoute('my-town', SITE, SITE_MY_TOWN),
            tutorialRoute('tools', SITE, SITE_TOOLS),
            tutorialRoute('wiki', SITE, SITE_WIKI),
            tutorialRoute('directory', SITE, SITE_DIRECTORY),
            tutorialRoute('games', SITE, SITE_GAMES),
            tutorialRoute('account', SITE, SITE_ACCOUNT)
        ]
    },
    {
        path: 'discord-bot', children: [
            tutorialRoute('installation', DISCORD_BOT, DISCORD_BOT_INSTALLATION),
            tutorialRoute('commands', DISCORD_BOT, DISCORD_BOT_COMMANDS)
        ]
    }
] satisfies Route[];
