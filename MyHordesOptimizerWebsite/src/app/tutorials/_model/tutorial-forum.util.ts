import { AccordionItem } from '../../_shared/accordion/accordion.component';
import { TutorialPage, TutorialSection } from './tutorial.model';

/** Entités HTML que l'on rencontre dans les textes des tutoriels. */
const HTML_ENTITIES: Readonly<Record<string, string>> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': '\'',
    '&rsquo;': '’'
};

/**
 * Convertit le HTML simple des tutoriels au format du forum de MyHordes : liens `[link=…]…[/link]`,
 * gras `[b]`, italique `[i]`, éléments de liste `[0]`, sauts de ligne. Les autres balises sont
 * retirées, leur texte conservé.
 */
export function htmlToForum(html: string): string {
    const converted: string = html
        .replace(/\r?\n\s*/g, ' ')
        .replace(/<a\b[^>]*?\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[link=$1]$2[/link]')
        .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '[b]$2[/b]')
        .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '[i]$2[/i]')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<li\b[^>]*>\s*/gi, '\n[0] ')
        .replace(/<\/li>/gi, '')
        .replace(/<\/(ul|ol)>/gi, '\n\n')
        .replace(/<\/p>\s*/gi, '\n\n')
        .replace(/<(ul|ol|p)\b[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&[a-z#0-9]+;/gi, (entity: string): string => HTML_ENTITIES[entity] ?? entity);

    return converted
        .split('\n')
        .map((line: string): string => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function sectionToForum(section: TutorialSection): string {
    const parts: string[] = [];
    if (section.title) {
        parts.push(`[b]${htmlToForum(section.title)}[/b]`);
    }
    if (section.intro) {
        parts.push(htmlToForum(section.intro));
    }
    section.items.forEach((item: AccordionItem): void => {
        parts.push(`[collapse=${htmlToForum(item.title)}]${htmlToForum(item.content)}[/collapse]`);
    });
    if (section.outro) {
        parts.push(htmlToForum(section.outro));
    }
    return parts.join('\n\n');
}

/** Page entière au format du forum : titre, introduction, puis chaque groupe séparé par une ligne. */
export function tutorialToForum(page: TutorialPage): string {
    const parts: string[] = [`[b][big]${htmlToForum(page.title)}[/big][/b]`];
    if (page.lead) {
        parts.push(htmlToForum(page.lead));
    }
    parts.push(page.sections.map((section: TutorialSection): string => sectionToForum(section)).join('\n\n{hr}\n\n'));
    return parts.join('\n\n');
}
