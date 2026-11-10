import { lang, repo_img_hordes_url } from '../config/constants';
import { item_action_effects_texts as t } from '../i18n/texts';
import type { I18nLabel, MhoActionOutcome, MhoChargeChance, MhoItem, MhoItemActionEffects, MhoItemSummary } from '../types';
import { getI18N } from '../utils/i18n';
import { createResultBadge } from './catapult-effect';

/** Crée une ligne de section. */
function createRow(): HTMLDivElement {
    const row: HTMLDivElement = document.createElement('div');
    row.classList.add('mho-item-extra');
    return row;
}

/** Ajoute un texte à la ligne. */
function addText(row: HTMLElement, value: string): void {
    const span: HTMLSpanElement = document.createElement('span');
    span.textContent = value;
    row.appendChild(span);
}

/** Ajoute une icône brute (chemin relatif au dépôt d'images) à la ligne et la renvoie. */
function addIcon(row: HTMLElement, img: string): HTMLImageElement {
    const icon: HTMLImageElement = document.createElement('img');
    icon.src = repo_img_hordes_url + img;
    row.appendChild(icon);
    return icon;
}

/** Ajoute l'icône d'un objet dans un badge `.item`. */
function addItemBadge(row: HTMLElement, summary: MhoItemSummary): void {
    const badge: HTMLSpanElement = document.createElement('span');
    badge.classList.add('item');
    const icon: HTMLImageElement = document.createElement('img');
    icon.src = repo_img_hordes_url + summary.img;
    icon.title = getI18N(summary.label) ?? '';
    badge.appendChild(icon);
    row.appendChild(badge);
}

/** Formate une probabilité (0..1) en pourcentage avec la décimale de la langue, 2 décimales maximum. */
function formatPercent(probability: number): string {
    return `${(Math.round(probability * 10000) / 100).toLocaleString(lang, { maximumFractionDigits: 2 })} %`;
}

/** Libellé de l'action selon son type et son coût en PA. */
function actionLabel(effect: MhoItemActionEffects): string {
    if (effect.kind === 'Open') return getI18N(t.action_open);
    if (effect.kind === 'Slaughter') return getI18N(t.action_slaughter);
    if (effect.kind === 'Attack') return getI18N(t.action_attack);
    // Seul libellé officiel du jeu avec coût en PA (1 PA) ; les données n'ont pas d'autre valeur.
    if (effect.apCost === 1) return getI18N(t.action_purify_ap);
    return getI18N(t.action_purify);
}

/** Ajoute le détail d'une issue d'action. */
function addOutcome(row: HTMLElement, item: MhoItem, outcome: MhoActionOutcome): void {
    if (outcome.kind === 'Produced' && outcome.item) {
        addItemBadge(row, outcome.item);
        addText(row, `×${outcome.quantity ?? 1}`);
    } else if (outcome.kind === 'Kill') {
        addIcon(row, 'icons/small_zombie.gif');
        const kills: number[] = [outcome.killMin, outcome.killMax].filter((k: number | null | undefined): k is number => k !== null && k !== undefined);
        if (outcome.killMin === null && outcome.killMax === null) addText(row, getI18N(t.outcome_all_zombies));
        else if (kills.length > 0) addText(row, kills.length === 2 && kills[0] !== kills[1] ? `${kills[0]}–${kills[1]}` : String(kills[0]));
    } else if (outcome.kind === 'Broken') {
        row.appendChild(createResultBadge(item.imgBroken ?? item.img, getI18N(item.label) ?? '', true, false));
        addText(row, getI18N(t.outcome_broken));
    } else if (outcome.kind === 'Transformed' && outcome.item) {
        addItemBadge(row, outcome.item);
    } else if (outcome.kind === 'Consumed') {
        addText(row, getI18N(t.outcome_consumed));
    }
    addText(row, formatPercent(outcome.probability));
}

/** Retient les entrées applicables : variantes liées à un chantier départagées par `appliesToTown`, à défaut le chantier supposé non construit. */
function selectApplicableEffects(effects: MhoItemActionEffects[]): MhoItemActionEffects[] {
    const townKnown: boolean = effects.some((e: MhoItemActionEffects): boolean => e.appliesToTown === true || e.appliesToTown === false);
    return effects.filter((effect: MhoItemActionEffects): boolean => {
        if (!effect.buildingCondition) return true;
        return townKnown ? effect.appliesToTown !== false : effect.buildingCondition.built === false;
    });
}

/** Section bonus de survie en veille. */
function buildWatchImpactSections(item: MhoItem): HTMLDivElement[] {
    if (!item.watchImpact) return [];
    const row: HTMLDivElement = createRow();
    const sign: string = item.watchImpact > 0 ? '+' : '';
    addText(row, `${getI18N(t.watch_survival)} : ${sign}${item.watchImpact} %`);
    if (item.properties?.includes('nw_impact_cumul')) {
        addText(row, getI18N(t.watch_cumulative));
    }
    return [row];
}

/** Sections du devenir de l'objet en veille, au format de la catapulte. */
function buildNightwatchSections(item: MhoItem, effects: MhoItemActionEffects[]): HTMLDivElement[] {
    const sections: HTMLDivElement[] = [];
    effects.filter((e: MhoItemActionEffects): boolean => e.kind === 'Nightwatch').forEach((effect: MhoItemActionEffects): void => {
        const row: HTMLDivElement = createRow();
        addIcon(row, 'emotes/watch.gif').title = getI18N(t.on_watch);
        addIcon(row, 'emotes/arrowright.gif');
        const item_title: string = getI18N(item.label) ?? '';
        if (effect.outcomes.length === 0) row.appendChild(createResultBadge(item.img, item_title, false, false));
        effect.outcomes.forEach((o: MhoActionOutcome): void => {
            if (o.kind === 'Broken') {
                row.appendChild(createResultBadge(item.imgBroken ?? item.img, item_title, true, false));
            } else if (o.kind === 'Consumed') {
                row.appendChild(createResultBadge(item.img, item_title, false, true));
            } else if (o.kind === 'Transformed' && o.item) {
                row.appendChild(createResultBadge(o.item.img, getI18N(o.item.label) ?? '', false, false));
            }
            if (o.probability < 1) addText(row, formatPercent(o.probability));
        });
        sections.push(row);
    });
    return sections;
}

/** Sections sac : places supplémentaires et groupe d'exclusivité. */
function buildBagSections(item: MhoItem): HTMLDivElement[] {
    const sections: HTMLDivElement[] = [];
    if (item.bagCapacityBonus) {
        const row: HTMLDivElement = createRow();
        addText(row, getI18N(t.bag_slots).replace('$n$', String(item.bagCapacityBonus)));
        sections.push(row);
    }
    if (item.bagExclusiveGroup && item.bagExclusiveGroup.length > 1) {
        const row: HTMLDivElement = createRow();
        addText(row, getI18N(t.bag_exclusive));
        item.bagExclusiveGroup.forEach((s: MhoItemSummary): void => addItemBadge(row, s));
        sections.push(row);
    }
    return sections;
}

/** Une ligne par action applicable, issues filtrées selon les charges de recharge. */
function buildActionSections(item: MhoItem, effects: MhoItemActionEffects[]): HTMLDivElement[] {
    const has_charges: boolean = !!item.reloadCharges && item.reloadCharges.length > 0;
    return selectApplicableEffects(effects.filter((e: MhoItemActionEffects): boolean => e.kind !== 'Nightwatch')).map((effect: MhoItemActionEffects): HTMLDivElement => {
        const row: HTMLDivElement = createRow();
        addText(row, actionLabel(effect));
        if (effect.viaLoadedForm) {
            addText(row, getI18N(t.loaded_form));
            addItemBadge(row, effect.viaLoadedForm);
        }
        effect.outcomes
            .filter((o: MhoActionOutcome): boolean => !(effect.kind === 'Open' && o.kind === 'Consumed') && !(has_charges && effect.kind === 'Attack' && o.kind === 'Transformed'))
            .forEach((o: MhoActionOutcome): void => addOutcome(row, item, o));
        return row;
    });
}

/** Section charges à la recharge : valeur unique ou fourchette détaillée. */
function buildChargesSections(item: MhoItem): HTMLDivElement[] {
    const charges: MhoChargeChance[] = [...(item.reloadCharges ?? [])].sort((a: MhoChargeChance, b: MhoChargeChance): number => b.charges - a.charges);
    if (charges.length === 0) return [];
    const row: HTMLDivElement = createRow();
    const max: number = charges[0].charges;
    const min: number = charges[charges.length - 1].charges;
    let value: string = String(max);
    if (charges.length > 1) {
        const detail: string = charges.map((c: MhoChargeChance): string => `${c.charges} : ${formatPercent(c.probability)}`).join(', ');
        value = `${getI18N(t.reload_charges_range).replace('$min$', String(min)).replace('$max$', String(max))} (${detail})`;
    }
    addText(row, `${getI18N(t.reload_charges)} ${value}`);
    return [row];
}

/** Paliers de rareté en fouille, en pourcentage, du plus courant au plus rare (mêmes seuils que le site). */
const DIG_BANDS: { floor: number; label: I18nLabel }[] = [
    { floor: 5, label: t.dig_very_common },
    { floor: 1, label: t.dig_common },
    { floor: 0.3, label: t.dig_uncommon },
    { floor: 0.1, label: t.dig_rare },
    { floor: 0, label: t.dig_very_rare }
];
/** Au-delà, « 1 sur N » arrondit trop grossièrement : fraction de dénominateur ≤ 10. */
const DIG_FRACTION_FLOOR: number = 25;
const DIG_FRACTION_MAX_OUT_OF: number = 10;

/** Fraction de fouilles réussies la plus lisible pour une probabilité en pourcentage strictement positive. */
function digFraction(percent: number): { hits: number; out_of: number } {
    if (percent < DIG_FRACTION_FLOOR) return { hits: 1, out_of: Math.max(1, Math.round(100 / percent)) };
    const rate: number = percent / 100;
    let best: { hits: number; out_of: number } = { hits: 1, out_of: 1 };
    for (let out_of: number = 2; out_of <= DIG_FRACTION_MAX_OUT_OF; out_of++) {
        const hits: number = Math.max(1, Math.round(rate * out_of));
        if (Math.abs(hits / out_of - rate) < Math.abs(best.hits / best.out_of - rate)) best = { hits, out_of };
    }
    return best;
}

/** Section fréquence en fouille, pour la zone qui s'applique (une zone épuisée ne rend que deux objets). */
function buildDigSections(item: MhoItem): HTMLDivElement[] {
    const not_praf: number = (item.dropRateNotPraf ?? 0) * 100;
    const percent: number = not_praf > 0 ? not_praf : (item.dropRatePraf ?? 0) * 100;
    if (!(percent > 0)) return [];
    const band: I18nLabel = (DIG_BANDS.find((candidate: { floor: number }): boolean => percent >= candidate.floor) ?? DIG_BANDS[DIG_BANDS.length - 1]).label;
    const { hits, out_of } = digFraction(percent);
    const figure: string = (hits === 1 ? getI18N(t.dig_one) : getI18N(t.dig_many).replace('$hits$', String(hits))).replace('$n$', String(out_of));
    const row: HTMLDivElement = createRow();
    addText(row, `${getI18N(t.dig_frequency)} ${getI18N(band)}, ${figure}${not_praf > 0 ? '' : ` ${getI18N(t.dig_depleted)}`}`);
    return [row];
}

/**
 * Sections complémentaires de la fiche objet : fouille, bonus de veille, sac, actions, charges, puis le
 * devenir en veille en dernier pour qu'il précède directement l'effet catapulte.
 * Tableau vide si l'objet n'a aucune de ces données.
 */
export function getItemExtraSections(item: MhoItem): HTMLDivElement[] {
    const effects: MhoItemActionEffects[] = item.actionEffects ?? [];
    return [
        ...buildDigSections(item),
        ...buildWatchImpactSections(item),
        ...buildBagSections(item),
        ...buildActionSections(item, effects),
        ...buildChargesSections(item),
        ...buildNightwatchSections(item, effects)
    ];
}
