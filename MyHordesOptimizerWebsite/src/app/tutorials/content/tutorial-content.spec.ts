import { AccordionItem } from '../../_shared/accordion/accordion.component';
import { TutorialPage, TutorialSection } from '../_model/tutorial.model';
import tutorialRoutes from '../tutorials.routes';
import { DISCORD_BOT_COMMANDS } from './discord-bot/commands.content';
import { DISCORD_BOT_INSTALLATION } from './discord-bot/installation.content';
import { SCRIPT_EXTENSION_ADDITIONAL_INFO } from './script-extension/additional-info.content';
import { SCRIPT_EXTENSION_ALERTS } from './script-extension/alerts.content';
import { SCRIPT_EXTENSION_EXTERNAL_TOOLS } from './script-extension/external-tools.content';
import { SCRIPT_EXTENSION_FORUM } from './script-extension/forum.content';
import { SCRIPT_EXTENSION_GETTING_STARTED } from './script-extension/getting-started.content';
import { SCRIPT_EXTENSION_INSTALLATION } from './script-extension/installation.content';
import { SCRIPT_EXTENSION_INTERFACE } from './script-extension/interface.content';
import { SCRIPT_EXTENSION_TOOLS } from './script-extension/tools.content';
import { SCRIPT_EXTENSION_WIKI } from './script-extension/wiki.content';
import { SITE_ACCOUNT } from './site/account.content';
import { SITE_DIRECTORY } from './site/directory.content';
import { SITE_GAMES } from './site/games.content';
import { SITE_MY_TOWN } from './site/my-town.content';
import { SITE_TOOLS } from './site/tools.content';
import { SITE_WIKI } from './site/wiki.content';

const PAGES: TutorialPage[] = [
    SCRIPT_EXTENSION_INSTALLATION, SCRIPT_EXTENSION_GETTING_STARTED, SCRIPT_EXTENSION_TOOLS, SCRIPT_EXTENSION_WIKI,
    SCRIPT_EXTENSION_EXTERNAL_TOOLS, SCRIPT_EXTENSION_ADDITIONAL_INFO, SCRIPT_EXTENSION_INTERFACE, SCRIPT_EXTENSION_FORUM,
    SCRIPT_EXTENSION_ALERTS, SITE_MY_TOWN, SITE_TOOLS, SITE_WIKI, SITE_DIRECTORY, SITE_GAMES, SITE_ACCOUNT,
    DISCORD_BOT_INSTALLATION, DISCORD_BOT_COMMANDS
];

function allItems(page: TutorialPage): AccordionItem[] {
    return page.sections.flatMap((section: TutorialSection): AccordionItem[] => section.items);
}

describe('tutorial contents', (): void => {
    it.each(PAGES.map((page: TutorialPage): [string, TutorialPage] => [page.title, page]))('%s is complete and well formed', (_title: string, page: TutorialPage): void => {
        expect(page.title.trim()).not.toBe('');
        expect(page.sections.length).toBeGreaterThan(0);
        page.sections.forEach((section: TutorialSection): void => expect(section.items.length).toBeGreaterThan(0));

        const titles: string[] = allItems(page).map((item: AccordionItem): string => item.title);
        expect(new Set(titles).size).toBe(titles.length);

        allItems(page).forEach((item: AccordionItem): void => {
            expect(item.title.trim()).not.toBe('');
            expect(item.content.trim()).not.toBe('');
            expect(item.content).not.toContain('undefined');
            // Chaque liste ouverte est fermée : le HTML passe par [innerHTML] et par la conversion forum.
            expect((item.content.match(/<ul>/g) ?? []).length).toBe((item.content.match(/<\/ul>/g) ?? []).length);
            expect((item.content.match(/<p>/g) ?? []).length).toBe((item.content.match(/<\/p>/g) ?? []).length);
        });
    });

    it('never hard-codes a language in the Firefox add-on link', (): void => {
        const html: string = allItems(SCRIPT_EXTENSION_INSTALLATION).map((item: AccordionItem): string => item.content).join('');
        expect(html).toContain('https://addons.mozilla.org/firefox/addon/mho-addon');
        expect(html).not.toMatch(/addons\.mozilla\.org\/[a-z]{2}(-[A-Z]{2})?\//);
    });

    it('routes every tutorial page', (): void => {
        const routed: unknown[] = tutorialRoutes
            .flatMap((route: { children?: { data?: Record<string, unknown> }[] }): { data?: Record<string, unknown> }[] => route.children ?? [])
            .map((child: { data?: Record<string, unknown> }): unknown => child.data?.['tutorial'])
            .filter((page: unknown): boolean => page !== undefined);
        expect(routed.length).toBe(PAGES.length);
        PAGES.forEach((page: TutorialPage): void => expect(routed).toContain(page));
    });
});
