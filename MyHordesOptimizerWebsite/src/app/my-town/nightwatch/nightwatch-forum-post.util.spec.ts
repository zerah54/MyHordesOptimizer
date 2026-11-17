import { buildForumPost, ForumPostInput, ForumPostLabels, ForumWatcher } from './nightwatch-forum-post.util';

const LABELS: ForumPostLabels = {
    pa_emote: ':pa:',
    pile_emote: ':item_pile:',
    water_emote: ':item_water:',
    arrow_emote: ':arrowright:',
    sites_emote: ':sites:',
    defense_emote: ':def:',
    warning_emote: ':warning:',
    dog_emote: ':dog:',
    separator: '---',
    resources_used: 'Ressources utilisées',
    repairable: 'Réparables',
    rechargeable: 'Rechargeables',
    programme_title: 'Programme de veille à',
    repairs_suffix: 'de réparations',
    batteries_suffix: 'piles sont consommées pour la veille',
    base_suffix: 'de base',
    mount_early: 'Montez tôt.',
    drink_before_guitar: 'Buvez avant la guitare, +1 {pa}',
    missing_phrase_intro: 'Si vous n\'avez pas cette phrase :',
    reassuring_quote: 'Vous ne mourrez pas aujourd\'hui !',
    report_it: 'Merci de le signaler !',
    dog_steak: 'Vérifiez la consigne du steak',
    discourse_action: 'Discours rassurant multicolore'
};

function watcher(overrides: Partial<ForumWatcher> = {}): ForumWatcher {
    return { name: 'Alice', job_icon: ':guard:', status_labels: ['Drogué', 'Bu'], defense: 42, items: [{ label: 'Fusil', qty: 2 }], discourse: false, note: null, ...overrides };
}

function input(overrides: Partial<ForumPostInput> = {}): ForumPostInput {
    return {
        instructions: null,
        watchers: [watcher()],
        total_defense: 300,
        cost: { repair_pa: 12, batteries: 5, water: 3 },
        reparable_lines: [{ label: 'Chaise', qty: 2 }],
        rechargeable_lines: [{ label: 'Lampe', qty: 1 }],
        ...overrides
    };
}

describe('buildForumPost', (): void => {
    it('respects the section order', (): void => {
        const text: string = buildForumPost(input({ instructions: 'Hello' }), LABELS);
        const markers: string[] = ['Hello', '[collapse=:sites: Ressources utilisées]', 'Réparables 12:pa:', ':arrowright: 2 Chaise', 'Rechargeables 5:item_pile: | 3:item_water:', ':arrowright: 1 Lampe', '[/collapse]', '---', 'Programme de veille à 300 :def:', '12 :pa: [bad]de réparations[/bad]', '5 piles sont consommées pour la veille', 'Montez tôt.', 'Buvez avant la guitare, +1 :pa:', ':warning: Si vous n\'avez pas cette phrase :', 'Vous ne mourrez pas aujourd\'hui !', 'Merci de le signaler ! :warning:', ':warning::dog: Vérifiez la consigne du steak :dog::warning:', '[collapse=:guard: Alice Drogué, Bu || :arrowright: 42 de base]', ':arrowright: 2 Fusil'];
        let last: number = -1;
        for (const marker of markers) {
            const index: number = text.indexOf(marker, last + 1);
            expect(index, marker).toBeGreaterThan(last);
            last = index;
        }
    });

    it('replaces every {pa} occurrence of the guitar sentence', (): void => {
        const text: string = buildForumPost(input(), { ...LABELS, drink_before_guitar: '+1 {pa} puis +1 {pa}' });
        expect(text).toContain('+1 :pa: puis +1 :pa:');
        expect(text).not.toContain('{pa}');
    });

    it('colors the reassuring speech only for the carrier', (): void => {
        const text: string = buildForumPost(input({ watchers: [watcher({ discourse: true }), watcher({ name: 'Bob' })] }), LABELS);
        expect(text.match(/\[bad\].*Discours rassurant multicolore.*\[\/bad\]/g)?.length).toBe(1);
        const bob: string = text.slice(text.indexOf('Bob'));
        expect(bob).not.toContain('Discours');
        expect(text.indexOf('Discours')).toBeLessThan(text.indexOf(':arrowright: 2 Fusil'));
    });

    it('is valid without watcher', (): void => {
        const text: string = buildForumPost(input({ watchers: [] }), LABELS);
        expect(text).toContain('Programme de veille à 300');
        expect(text.match(/\[collapse=/g)?.length).toBe(1);
        expect(text.match(/\[\/collapse\]/g)?.length).toBe(1);
    });

    it('renders a watcher without item as a block without line', (): void => {
        const text: string = buildForumPost(input({ watchers: [watcher({ items: [] })] }), LABELS);
        expect(text.endsWith('[collapse=:guard: Alice Drogué, Bu || :arrowright: 42 de base]\n[/collapse]')).toBe(true);
    });

    it('never prints undefined or NaN', (): void => {
        const text: string = buildForumPost(input({ cost: { repair_pa: NaN, batteries: NaN, water: NaN }, total_defense: NaN, watchers: [watcher({ defense: NaN, status_labels: [] })] }), LABELS);
        expect(text).not.toContain('undefined');
        expect(text).not.toContain('NaN');
    });
});
