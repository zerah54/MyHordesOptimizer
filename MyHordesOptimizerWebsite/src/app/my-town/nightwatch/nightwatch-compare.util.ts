import { deathRisk, NightwatchContext, PlannedWatcher, RealWatcher, SurvivalTier, survivalTier, watcherDefense, WatcherInput } from './nightwatch-model.util';

/** Écart entre le plan et l'état réel d'un veilleur ; objets comparés sur les unités intactes. */
export interface WatcherGap {
    user_id: number;
    planned_risk: number;
    real_risk: number;
    planned_defense: number;
    real_defense: number;
    missing_items: Record<number, number>;
    extra_items: Record<number, number>;
    missing_statuses: string[];
    tier_planned: SurvivalTier;
    tier_real: SurvivalTier;
    to_contact: boolean;
}

const GHOUL_KEY: string = 'ghoul';

/**
 * Unités intactes d'un objet d'un veilleur.
 * @param input veilleur
 * @param id identifiant de l'objet
 * @returns quantité intacte
 */
function intactOf(input: WatcherInput, id: number): number {
    return Math.max(0, (input.items[id] ?? 0) - (input.items_broken[id] ?? 0));
}

/**
 * Écarts d'objets intacts entre deux veilleurs.
 * @param from référence
 * @param to comparé
 * @returns objets (et quantités) présents dans `from` et en défaut dans `to`
 */
function shortfall(from: WatcherInput, to: WatcherInput): Record<number, number> {
    const result: Record<number, number> = {};
    for (const key of Object.keys(from.items)) {
        const id: number = Number(key);
        const diff: number = intactOf(from, id) - intactOf(to, id);
        if (diff > 0) {
            result[id] = diff;
        }
    }
    return result;
}

/**
 * Compare chaque veilleur prévu à son état réel.
 * @param planned veilleurs du plan
 * @param real état réel des citoyens ; un veilleur prévu absent est comparé à un citoyen nu
 * @param ctx contexte de calcul
 * @param discourse_active vrai si le Discours rassurant est actif (identique pour plan et réel)
 * @returns un écart par veilleur prévu
 */
export function compareWatchers(
    planned: PlannedWatcher[],
    real: RealWatcher[],
    ctx: NightwatchContext,
    discourse_active: boolean = false
): WatcherGap[] {
    return planned.map((p: PlannedWatcher): WatcherGap => {
        const r: RealWatcher = real.find((c: RealWatcher): boolean => c.user_id === p.user_id) ?? {
            user_id: p.user_id, items: {}, items_broken: {}, statuses: [], is_ghoul: false,
            past_watches: p.past_watches, is_pro: p.is_pro, hero_bonus: 0, baths: 0
        };
        const real_statuses: Set<string> = new Set<string>(r.statuses);
        if (r.is_ghoul) {
            real_statuses.add(GHOUL_KEY);
        }
        const planned_statuses: Set<string> = new Set<string>(p.statuses);
        if (p.is_ghoul) {
            planned_statuses.add(GHOUL_KEY);
        }
        const missing_items: Record<number, number> = shortfall(p, r);
        const missing_statuses: string[] = Array.from(planned_statuses)
            .filter((s: string): boolean => !real_statuses.has(s));
        const planned_risk: number = deathRisk(p, ctx);
        const real_risk: number = deathRisk(r, ctx);
        return {
            user_id: p.user_id,
            planned_risk,
            real_risk,
            planned_defense: watcherDefense(p, ctx, discourse_active),
            real_defense: watcherDefense(r, ctx, discourse_active),
            missing_items,
            extra_items: shortfall(r, p),
            missing_statuses,
            tier_planned: survivalTier(planned_risk),
            tier_real: survivalTier(real_risk),
            to_contact: Object.keys(missing_items).length > 0 || missing_statuses.length > 0 || real_risk > planned_risk
        };
    });
}

/**
 * Totaux de défense prévue/réelle et marge contre l'attaque estimée.
 * @param gaps écarts par veilleur
 * @param estimated_attack attaque estimée, null si inconnue
 * @returns défense prévue, réelle, marge réelle - attaque et marge prévue - attaque (null si attaque inconnue)
 */
export function compareTotals(
    gaps: WatcherGap[],
    estimated_attack: number | null
): { planned: number; real: number; margin_vs_attack: number | null; planned_margin_vs_attack: number | null } {
    const planned: number = gaps.reduce((s: number, g: WatcherGap): number => s + g.planned_defense, 0);
    const real: number = gaps.reduce((s: number, g: WatcherGap): number => s + g.real_defense, 0);
    return {
        planned,
        real,
        margin_vs_attack: estimated_attack === null ? null : real - estimated_attack,
        planned_margin_vs_attack: estimated_attack === null ? null : planned - estimated_attack
    };
}
