import { CostSummary } from './nightwatch-stock.util';

/** Ligne objet quantifiée. */
export interface ForumLine {
    label: string;
    qty: number;
}

/** Veilleur tel que rédigé dans le message. */
export interface ForumWatcher {
    name: string;
    job_icon: string;
    status_labels: string[];
    defense: number;
    items: ReadonlyArray<ForumLine>;
    /** Porte l'action « Discours rassurant multicolore », mise en rouge sur sa première ligne. */
    discourse: boolean;
    note: string | null;
}

/** Données du message. */
export interface ForumPostInput {
    instructions: string | null;
    watchers: ReadonlyArray<ForumWatcher>;
    total_defense: number;
    cost: CostSummary;
    reparable_lines: ReadonlyArray<ForumLine>;
    rechargeable_lines: ReadonlyArray<ForumLine>;
}

/**
 * Tous les textes et icônes du message, fournis par l'appelant (traduits via `$localize`).
 * Valeurs d'emotes usuelles : `:pa:`, `:item_pile:`, `:item_water:`, `:arrowright:`, `:sites:`, `:warning:`, `:dog:`.
 * `drink_before_guitar` peut contenir `{pa}`, remplacé par `pa_emote`.
 */
export interface ForumPostLabels {
    pa_emote: string;
    pile_emote: string;
    water_emote: string;
    arrow_emote: string;
    sites_emote: string;
    defense_emote: string;
    warning_emote: string;
    dog_emote: string;
    separator: string;
    resources_used: string;
    repairable: string;
    rechargeable: string;
    programme_title: string;
    repairs_suffix: string;
    batteries_suffix: string;
    base_suffix: string;
    mount_early: string;
    drink_before_guitar: string;
    missing_phrase_intro: string;
    reassuring_quote: string;
    report_it: string;
    dog_steak: string;
    discourse_action: string;
}

/**
 * Nombre affichable : jamais NaN ni infini.
 * @param {number} value Valeur brute.
 * @returns {number} Valeur, ou 0 si non finie.
 */
function safe(value: number): number {
    return Number.isFinite(value) ? value : 0;
}

/**
 * Lignes `→ qté libellé`.
 * @param {ReadonlyArray<ForumLine>} lines Lignes.
 * @param {ForumPostLabels} labels Libellés.
 * @returns {string[]} Lignes BBCode.
 */
function itemLines(lines: ReadonlyArray<ForumLine>, labels: ForumPostLabels): string[] {
    return lines.map((line: ForumLine): string => `${labels.arrow_emote} ${safe(line.qty)} ${line.label}`);
}

/**
 * Bloc repliable d'un veilleur.
 * @param {ForumWatcher} watcher Veilleur.
 * @param {ForumPostLabels} labels Libellés.
 * @returns {string} Bloc `[collapse]`.
 */
function watcherBlock(watcher: ForumWatcher, labels: ForumPostLabels): string {
    const status: string = watcher.status_labels.length > 0 ? ` ${watcher.status_labels.join(', ')}` : '';
    const lines: string[] = [];
    if (watcher.note !== null && watcher.note.trim() !== '') {
        lines.push(`[i]${watcher.note.trim()}[/i]`);
    }
    if (watcher.discourse) {
        lines.push(`[bad]${labels.arrow_emote} 1 ${labels.discourse_action}[/bad]`);
    }
    lines.push(...itemLines(watcher.items, labels));
    const head: string = `[collapse=${watcher.job_icon} ${watcher.name}${status} || ${labels.arrow_emote} ${safe(watcher.defense)} ${labels.base_suffix}]`;
    return [head, ...lines, '[/collapse]'].join('\n');
}

/**
 * Message forum du programme de veille.
 * @param {ForumPostInput} input Données du plan.
 * @param {ForumPostLabels} labels Textes et icônes injectés.
 * @returns {string} Message BBCode.
 */
export function buildForumPost(input: ForumPostInput, labels: ForumPostLabels): string {
    const repair: number = safe(input.cost.repair_pa);
    const batteries: number = safe(input.cost.batteries);
    const sections: string[] = [];
    if (input.instructions !== null && input.instructions.trim() !== '') {
        sections.push(input.instructions.trim());
    }
    sections.push([
        `[collapse=${labels.sites_emote} ${labels.resources_used}][big][b][u]${labels.repairable} ${repair}${labels.pa_emote}[/u][/b][/big]`,
        ...itemLines(input.reparable_lines, labels),
        '',
        `[big][b][i][u]${labels.rechargeable} ${batteries}${labels.pile_emote} | ${safe(input.cost.water)}${labels.water_emote}[/u][/i][/b][/big]`,
        ...itemLines(input.rechargeable_lines, labels),
        '[/collapse]'
    ].join('\n'));
    sections.push([
        labels.separator,
        `${labels.programme_title} ${safe(input.total_defense)} ${labels.defense_emote}`,
        `${repair} ${labels.pa_emote} [bad]${labels.repairs_suffix}[/bad]`,
        `${batteries} ${labels.batteries_suffix}`
    ].join('\n'));
    sections.push([
        labels.mount_early,
        labels.drink_before_guitar.replaceAll('{pa}', labels.pa_emote),
        `${labels.warning_emote} ${labels.missing_phrase_intro}`,
        `[quote]${labels.reassuring_quote}[/quote]`,
        `${labels.report_it} ${labels.warning_emote}`,
        `${labels.warning_emote}${labels.dog_emote} ${labels.dog_steak} ${labels.dog_emote}${labels.warning_emote}`
    ].join('\n'));
    if (input.watchers.length > 0) {
        sections.push(input.watchers.map((watcher: ForumWatcher): string => watcherBlock(watcher, labels)).join('\n'));
    }
    return sections.join('\n\n');
}
