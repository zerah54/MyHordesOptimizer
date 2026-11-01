import { ResourceCount } from './resources.util';

/** Éléments qui composent la défense projetée d'une journée. */
export interface DefenseInputs {
    baseDefense: number;
    completedBuildingsDef: number;
    repairsDef: number;
    homesDef: number;
    sources: { def: number; qty: number }[];
}

/** Nature d'un candidat du comparateur. */
export type RankKind = 'building' | 'home' | 'source';

/** Élément comparé : un chantier, une amélioration de maison ou une source de défense hors chantiers. */
export interface RankCandidate {
    label: string;
    kind: RankKind;
    def: number;
    pa: number;
    resources: ResourceCount[];
}

/** Candidat avec son coût réel et son rapport défense / coût. */
export interface RankedCandidate extends RankCandidate {
    realCost: number;
    ratio: number | null;
    missingValueItemIds: number[];
}

/**
 * Défense projetée : base + chantiers terminés + réparations + maisons + sources.
 * @param {DefenseInputs} inputs Composantes de la défense.
 * @returns {number} Défense projetée.
 */
export function projectedDefense(inputs: DefenseInputs): number {
    const sources: number = inputs.sources.reduce((sum: number, source: { def: number; qty: number }): number => sum + source.def * source.qty, 0);
    return inputs.baseDefense + inputs.completedBuildingsDef + inputs.repairsDef + inputs.homesDef + sources;
}

/**
 * Écart entre l'objectif et la défense projetée.
 * @param {number} attack Attaque à couvrir.
 * @param {number} allowedOverflow Débordement autorisé.
 * @param {number} projected Défense projetée.
 * @returns {number} Positif = reste à couvrir, négatif = surplus (signe conservé).
 */
export function defenseGap(attack: number, allowedOverflow: number, projected: number): number {
    return attack - allowedOverflow - projected;
}

/**
 * Classe les candidats par défense obtenue par unité de coût réel (PA + valeur en PA des ressources).
 * @param {RankCandidate[]} candidates Éléments à comparer.
 * @param {ReadonlyMap<number, number>} itemValues Valeur en PA par identifiant d'objet.
 * @returns {RankedCandidate[]} Candidats triés du plus au moins rentable.
 */
export function rankByDefPerPa(candidates: RankCandidate[], itemValues: ReadonlyMap<number, number>): RankedCandidate[] {
    const ranked: RankedCandidate[] = candidates.map((candidate: RankCandidate): RankedCandidate => {
        const missing: number[] = [];
        let resources_cost: number = 0;
        for (const resource of candidate.resources) {
            const value: number | undefined = itemValues.get(resource.itemId);
            if (value === undefined) {
                missing.push(resource.itemId);
            } else {
                resources_cost += resource.count * value;
            }
        }
        const real_cost: number = candidate.pa + resources_cost;
        let ratio: number | null = null;
        if (real_cost > 0) {
            ratio = candidate.def / real_cost;
        } else if (candidate.def > 0) {
            ratio = Infinity;
        }
        return { ...candidate, realCost: real_cost, ratio, missingValueItemIds: missing };
    });
    return ranked.sort((a: RankedCandidate, b: RankedCandidate): number => {
        const rank_a: number = a.ratio === null ? Number.NEGATIVE_INFINITY : a.ratio;
        const rank_b: number = b.ratio === null ? Number.NEGATIVE_INFINITY : b.ratio;
        if (rank_a === rank_b) {
            return a.label.localeCompare(b.label);
        }
        return rank_a > rank_b ? -1 : 1;
    });
}
