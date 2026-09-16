import { beforeEach, describe, expect, it } from 'vitest';

import { empty_forum_thread_style, getDefaultForumThreadStyleRules } from '../data/forum-styles';
import type { ForumThreadStyleRule } from '../types';
import { applyForumThreadStyles, parseForumThreadStyleRules } from './forum-styles';

function buildRow(title: string): void {
    document.body.innerHTML = `<div class="forum-thread"><div class="title"><div>${title}</div></div></div>`;
}

function buildRule(overrides: Partial<ForumThreadStyleRule>): ForumThreadStyleRule {
    return {
        id: 'r1',
        enabled: true,
        tags: [],
        regex: [],
        style: { ...empty_forum_thread_style, color: '#112233' },
        ...overrides
    };
}

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('applyForumThreadStyles() - critère regex', () => {
    it('un mot simple (sans syntaxe regex) suffit, comme critère fusionné mots/regex', () => {
        buildRow('Grosse alerte zombie ce soir');

        applyForumThreadStyles([buildRule({ regex: ['alerte'] })]);

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('rgb(17, 34, 51)');
    });

    it('applique le style quand une regex correspond au titre', () => {
        buildRow('Alerte zombies imminente');

        applyForumThreadStyles([buildRule({ regex: ['zomb\\w+'] })]);

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('rgb(17, 34, 51)');
    });

    it('ne casse rien avec une regex invalide et laisse la ligne sans style', () => {
        buildRow('Titre quelconque');

        expect(() => applyForumThreadStyles([buildRule({ regex: ['*'] })])).not.toThrow();

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('');
    });

    it('( et ) sont littéraux : pas besoin de les échapper, et ils ne forment plus un groupe', () => {
        buildRow('(MAJ) mise à jour');

        applyForumThreadStyles([buildRule({ regex: ['(MAJ)'] })]);

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('rgb(17, 34, 51)');
    });

    it('( et ) littéraux ne matchent pas un titre où les parenthèses sont absentes', () => {
        buildRow('MAJ mise à jour');

        applyForumThreadStyles([buildRule({ regex: ['(MAJ)'] })]);

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('');
    });

    it('[ et ] sont littéraux : pas besoin de les échapper, et ils ne forment plus une classe de caractères', () => {
        buildRow('Patch [07] du jour');

        applyForumThreadStyles([buildRule({ regex: ['[07]'] })]);

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('rgb(17, 34, 51)');
    });

    it('[ et ] littéraux ne matchent pas un titre qui contient juste les caractères de la classe', () => {
        buildRow('070 est le jour');

        applyForumThreadStyles([buildRule({ regex: ['[07]'] })]);

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('');
    });

    it('{ et } sont littéraux : pas besoin de les échapper, et ils ne forment plus un quantificateur', () => {
        buildRow('Patch a{3} du jour');

        applyForumThreadStyles([buildRule({ regex: ['a{3}'] })]);

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('rgb(17, 34, 51)');
    });

    it('{ et } littéraux ne matchent pas un titre qui contient juste les répétitions du quantificateur', () => {
        buildRow('aaa points ce jour');

        applyForumThreadStyles([buildRule({ regex: ['a{3}'] })]);

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('');
    });

    it('%DAY% se substitue au jour de ville courant lu dans l\'horloge', () => {
        document.body.innerHTML =
            '<div class="game-clock"><div class="town-day"><span class="day-number">7</span></div></div>' +
            '<div class="forum-thread"><div class="title"><div>Jour 7 : bilan</div></div></div>';

        applyForumThreadStyles([buildRule({ regex: ['^Jour %DAY%'] })]);

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('rgb(17, 34, 51)');
    });

    it('%DAY% ne correspond pas si le jour de ville affiché est différent', () => {
        document.body.innerHTML =
            '<div class="game-clock"><div class="town-day"><span class="day-number">3</span></div></div>' +
            '<div class="forum-thread"><div class="title"><div>Jour 7 : bilan</div></div></div>';

        applyForumThreadStyles([buildRule({ regex: ['^Jour %DAY%'] })]);

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('');
    });
});

describe('parseForumThreadStyleRules() - champ regex', () => {
    it('normalise les motifs regex : espaces retirés, entrées vides filtrées', () => {
        const raw: string = JSON.stringify([
            { id: 'r1', enabled: true, tags: [], words: [], regex: [' foo ', '', 'bar'], style: empty_forum_thread_style }
        ]);

        const rules: ForumThreadStyleRule[] | null = parseForumThreadStyleRules(raw);

        expect(rules?.[0]?.regex).toEqual(['foo', 'bar']);
    });

    it('retombe sur un tableau vide quand ni regex ni mots ne sont présents', () => {
        const raw: string = JSON.stringify([
            { id: 'r1', enabled: true, tags: [], style: empty_forum_thread_style }
        ]);

        const rules: ForumThreadStyleRule[] | null = parseForumThreadStyleRules(raw);

        expect(rules?.[0]?.regex).toEqual([]);
    });

    it('migre les anciens mots (rétrocompatibilité < 1.1.62) vers regex, en échappant les caractères spéciaux hors groupements', () => {
        const raw: string = JSON.stringify([
            { id: 'r1', enabled: true, tags: [], words: [' alerte ', 'v1.2+', ''], style: empty_forum_thread_style }
        ]);

        const rules: ForumThreadStyleRule[] | null = parseForumThreadStyleRules(raw);

        expect(rules?.[0]?.regex).toEqual(['alerte', 'v1\\.2\\+']);
    });

    it('un champ regex déjà présent prime sur d\'éventuels anciens mots', () => {
        const raw: string = JSON.stringify([
            { id: 'r1', enabled: true, tags: [], words: ['ancien'], regex: ['nouveau'], style: empty_forum_thread_style }
        ]);

        const rules: ForumThreadStyleRule[] | null = parseForumThreadStyleRules(raw);

        expect(rules?.[0]?.regex).toEqual(['nouveau']);
    });
});

describe('getDefaultForumThreadStyleRules() - règle par défaut du jour de ville', () => {
    function buildClockAndRow(day: number, title: string): void {
        document.body.innerHTML =
            `<div class="game-clock"><div class="town-day"><span class="day-number">${day}</span></div></div>` +
            `<div class="forum-thread"><div class="title"><div>${title}</div></div></div>`;
    }

    it('applique le préfixe calendrier sur un titre "[J<jour>]" (français)', () => {
        buildClockAndRow(42, '[J42] Bilan de la ville');

        applyForumThreadStyles(getDefaultForumThreadStyleRules());

        const prefix: HTMLElement | null = document.querySelector('.mho-thread-prefix');
        expect(prefix?.textContent?.trim()).toBe('📅');
    });

    it('applique le préfixe calendrier sur un titre "[D<jour>]" (anglais/espagnol)', () => {
        buildClockAndRow(7, '[D7] town update');

        applyForumThreadStyles(getDefaultForumThreadStyleRules());

        const prefix: HTMLElement | null = document.querySelector('.mho-thread-prefix');
        expect(prefix?.textContent?.trim()).toBe('📅');
    });

    it('applique le préfixe calendrier sur un titre "[T<jour>]" (allemand)', () => {
        buildClockAndRow(13, '[T13] Zusammenfassung');

        applyForumThreadStyles(getDefaultForumThreadStyleRules());

        const prefix: HTMLElement | null = document.querySelector('.mho-thread-prefix');
        expect(prefix?.textContent?.trim()).toBe('📅');
    });

    it('ne s\'applique pas sans les crochets autour du préfixe (les crochets font partie du critère)', () => {
        buildClockAndRow(42, 'J42 - Bilan de la ville');

        applyForumThreadStyles(getDefaultForumThreadStyleRules());

        const prefix: HTMLElement | null = document.querySelector('.mho-thread-prefix');
        expect(prefix).toBeNull();
    });

    it('ne s\'applique pas si le jour mentionné dans le titre diffère du jour de ville courant', () => {
        buildClockAndRow(5, '[J42] Bilan de la ville');

        applyForumThreadStyles(getDefaultForumThreadStyleRules());

        const prefix: HTMLElement | null = document.querySelector('.mho-thread-prefix');
        expect(prefix).toBeNull();
    });
});

describe('sanitizeRule() - migration des anciens mots vers regex', () => {
    it('un ancien mot sans caractère spécial matche le titre après migration, comme avant', () => {
        buildRow('Grosse alerte zombie ce soir');

        const migrated: ForumThreadStyleRule[] | null = parseForumThreadStyleRules(
            JSON.stringify([{ id: 'r1', enabled: true, tags: [], words: ['alerte'], style: { ...empty_forum_thread_style, color: '#112233' } }])
        );
        applyForumThreadStyles(migrated!);

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('rgb(17, 34, 51)');
    });

    it('un ancien mot contenant un caractère spécial (ex: le point) reste un motif littéral après migration', () => {
        buildRow('version 1x2 disponible');

        const migrated: ForumThreadStyleRule[] | null = parseForumThreadStyleRules(
            JSON.stringify([{ id: 'r1', enabled: true, tags: [], words: ['1.2'], style: { ...empty_forum_thread_style, color: '#112233' } }])
        );
        applyForumThreadStyles(migrated!);

        const title: HTMLElement | null = document.querySelector('.mho-thread-title');
        expect(title?.style.color).toBe('');
    });
});
