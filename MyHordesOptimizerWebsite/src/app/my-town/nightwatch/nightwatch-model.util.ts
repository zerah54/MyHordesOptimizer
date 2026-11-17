import { NightwatchItemDefDTO, NightwatchReferentialDTO, NightwatchStatusDefDTO } from './nightwatch.types';

/** Contexte de calcul : référentiel et état de la ville. */
export interface NightwatchContext {
    referential: NightwatchReferentialDTO;
    town_is_panda: boolean;
    round_path_level: number;
    has_guard_room: boolean;
    has_sprinkler: boolean;
    built_building_uids: ReadonlySet<string>;
}

/** Données d'un veilleur nécessaires au calcul ; `items_broken[id]` = unités cassées de `items[id]`. */
export interface WatcherInput {
    items: Record<number, number>;
    items_broken: Record<number, number>;
    statuses: string[];
    is_ghoul: boolean;
    past_watches: number;
    is_pro: boolean;
    hero_bonus: number;
    baths: number;
}

export type PlannedWatcher = WatcherInput & { user_id: number };
export type RealWatcher = WatcherInput & { user_id: number };

/** Palier de survie affiché (seuils du jeu : 15, 30, 45, 60, 75, 90 %). */
export type SurvivalTier = 'certain' | 't15' | 't30' | 't45' | 't60' | 't75' | 't90' | 'dire';

/** Alerte sur un veilleur ; le plafond de veilleurs est une alerte du plan, affichée par l'onglet Plan. */
export interface WatcherAlert {
    kind: 'unknown_item' | 'risk_above_zero';
    item_id?: number;
}

const GHOUL_KEY: string = 'ghoul';
const TIER_THRESHOLDS: ReadonlyArray<[number, SurvivalTier]> = [
    [0.15, 't15'], [0.3, 't30'], [0.45, 't45'], [0.6, 't60'], [0.75, 't75'], [0.9, 't90']
];

/**
 * Clés de statuts effectives : statuts du plan, plus `ghoul` si le citoyen l'est (compté une seule fois).
 * @param input veilleur
 * @returns clés dédoublonnées
 */
function effectiveStatuses(input: WatcherInput): Set<string> {
    const keys: Set<string> = new Set<string>(input.statuses);
    if (input.is_ghoul) {
        keys.add(GHOUL_KEY);
    }
    return keys;
}

/**
 * Défense d'une unité intacte d'un objet.
 * @param item_id identifiant de l'objet
 * @param ctx contexte de calcul
 * @returns défense ; 0 si objet inconnu ou Armurerie absente (sauf objet essentiel)
 */
export function itemDefense(item_id: number, ctx: NightwatchContext): number {
    const ref: NightwatchReferentialDTO = ctx.referential;
    const def: NightwatchItemDefDTO | undefined = ref.items[item_id];
    if (def === undefined) {
        return 0;
    }
    if (!def.isEssential && !ctx.built_building_uids.has(ref.itemDefenseRequiresBuildingUid)) {
        return 0;
    }
    let defense: number = def.defense;
    for (const bonus of ref.defenseBonuses) {
        if (ctx.built_building_uids.has(bonus.buildingUid) && bonus.idItems.includes(item_id)) {
            defense = Math.floor(defense * (1 + bonus.factor));
        }
    }
    return defense;
}

/**
 * Risque de mort d'un veilleur, dans l'ordre du jeu : base, fatigue, bains, objets, ghoul/statuts,
 * corps de garde, ronde niveau 3, arroseurs, doublement panda, bonus héroïque.
 * @param input veilleur
 * @param ctx contexte de calcul
 * @returns fraction arrondie à 4 décimales, éventuellement négative
 */
export function deathRisk(input: WatcherInput, ctx: NightwatchContext): number {
    const ref: NightwatchReferentialDTO = ctx.referential;
    const table: number[] = input.is_pro ? ref.fatiguePro : ref.fatigue;
    const watches: number = Number.isFinite(input.past_watches) ? Math.max(0, Math.floor(input.past_watches)) : 0;
    const baths: number = Number.isFinite(input.baths) ? Math.max(0, input.baths) : 0;
    const fatigue: number = table.length === 0 ? 0 : table[Math.min(watches, table.length - 1)];
    let risk: number = ref.baseRisk + fatigue;

    if (fatigue > 0) {
        risk = Math.max(ref.baseRisk, risk - baths * ref.bathBonus);
    }

    for (const key of Object.keys(input.items)) {
        const id: number = Number(key);
        const quantity: number = input.items[id];
        const def: NightwatchItemDefDTO | undefined = ref.items[id];
        if (def === undefined || quantity <= 0) {
            continue;
        }
        risk -= def.watchImpact * (def.cumulative ? quantity : 1);
    }

    for (const status of effectiveStatuses(input)) {
        const def: NightwatchStatusDefDTO | undefined = ref.statuses[status];
        if (def !== undefined) {
            risk += def.deathRisk;
        }
    }

    if (ctx.has_guard_room) {
        risk -= ref.guardRoomBonus;
    }
    if (ctx.round_path_level === 3) {
        risk -= ref.roundPathLevel3Bonus;
    }
    if (ctx.has_sprinkler) {
        risk += ref.sprinklerMalus;
    }
    if (ctx.town_is_panda && risk >= 0) {
        risk *= 2;
    }
    risk -= input.hero_bonus;

    return Math.round(risk * 10000) / 10000;
}

/**
 * Défense d'un veilleur : 10 + statuts + objets intacts + discours rassurant.
 * @param input veilleur
 * @param ctx contexte de calcul
 * @param discourse_active vrai si un veilleur du plan porte le Discours rassurant
 * @returns défense
 */
export function watcherDefense(input: WatcherInput, ctx: NightwatchContext, discourse_active: boolean): number {
    let defense: number = 10;
    for (const status of effectiveStatuses(input)) {
        defense += ctx.referential.statuses[status]?.defense ?? 0;
    }
    for (const key of Object.keys(input.items)) {
        const id: number = Number(key);
        const intact: number = Math.max(0, input.items[id] - (input.items_broken[id] ?? 0));
        defense += intact * itemDefense(id, ctx);
    }
    return defense + (discourse_active ? ctx.referential.discourseDefense : 0);
}

/**
 * Palier de survie ; le risque négatif n'est pas borné avant comparaison.
 * @param risk fraction de risque
 * @returns palier
 */
export function survivalTier(risk: number): SurvivalTier {
    if (risk <= 0) {
        return 'certain';
    }
    for (const [threshold, tier] of TIER_THRESHOLDS) {
        if (risk <= threshold) {
            return tier;
        }
    }
    return 'dire';
}

/**
 * Plafond de veilleurs selon le Chemin de ronde.
 * @param ctx contexte de calcul
 * @returns plafond ; niveau absent du référentiel = niveau 0
 */
export function watcherCap(ctx: NightwatchContext): number {
    const caps: Record<number, number> = ctx.referential.watcherCapByRoundPathLevel;
    return caps[ctx.round_path_level] ?? caps[0] ?? 0;
}

/**
 * Défense de veille de la ville.
 * @param defenses défense de chaque veilleur
 * @returns somme
 */
export function townWatchDefense(defenses: number[]): number {
    return defenses.reduce((sum: number, d: number): number => sum + d, 0);
}

/**
 * Alertes d'un veilleur : objets inconnus du référentiel, risque > 0.
 * @param input veilleur
 * @param ctx contexte de calcul
 * @returns alertes
 */
export function watcherAlerts(input: WatcherInput, ctx: NightwatchContext): WatcherAlert[] {
    const alerts: WatcherAlert[] = [];
    for (const key of Object.keys(input.items)) {
        const id: number = Number(key);
        if (input.items[id] > 0 && ctx.referential.items[id] === undefined) {
            alerts.push({ kind: 'unknown_item', item_id: id });
        }
    }
    if (deathRisk(input, ctx) > 0) {
        alerts.push({ kind: 'risk_above_zero' });
    }
    return alerts;
}
