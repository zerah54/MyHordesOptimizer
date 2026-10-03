/**
 * Modèle d'affinage d'attaque — module PUR (aucun import Angular) : il est partagé entre le thread
 * principal (dérivation des valeurs, gate rebound) et les Web Workers du scan CPU.
 *
 * Rejeu f64 exact des actions MyHordes : le CPU dispose du f64 → pas besoin des « forks » du shader
 * GPU (arrondis, poussières au bord zéro), la trajectoire est calculée bit à bit comme PHP.
 *
 * `observed` contient 100 entiers : les contraintes TDG (bloc 1) en slots min 0..24 / max 25..49,
 * et les contraintes du planificateur (bloc ceil(jour/5)·5) en slots min 50..74 / max 75..99.
 * TDG(D) et planificateur(D−1) lisent la même ZombieEstimation (même seed, mêmes offsets, même
 * trajectoire) : leurs paliers contraignent le même scan.
 *
 * Valide uniquement en difficulté normale (en « hard », l'attaque est re-tirée dans la bande :
 * la dérivation targetMax−targetMin → valeur n'a plus de sens).
 */

/**
 * Config candidate pour les réglages estimation.* du jeu (OptModifierEstim*, valeurs dépôt en
 * commentaire) — un seul endroit à éditer pour tester une hypothèse alternative (config serveur
 * possiblement différente du dépôt local). Piloté aussi par estimations.component.ts.
 */
export const GAME_ESTIM_CONFIG = {
    InitialShift: 10, // estimation.shift (dépôt: 10)
    Spread: 10,        // estimation.spread (dépôt: 10)
    Variance: 48,      // estimation.variance (dépôt: 48)
    OffsetMin: 15,     // estimation.offset.min (dépôt: 15)
    OffsetMax: 36,     // estimation.offset.max (dépôt: 36)
};

const SHIFT: number = GAME_ESTIM_CONFIG.InitialShift;
const SPREAD: number = GAME_ESTIM_CONFIG.Spread;
/** Marge absorbant les écarts d'associativité f64 entre notre inversion et le calcul avant de MyHordes. */
const ROUND_EPS: number = 0.000001;

/** Valeur sentinelle dans `observed` : palier non saisi (aucune contrainte à ce %). */
export const NO_CONSTRAINT: number = 2147483647;

/** Paramètres du modèle MyHordes pour un jour d'attaque donné, partagés GPU + CPU. */
export interface RefinerParams {
    /** round(factor·5) : borne basse mt_rand de l'offset de base (hors rebound). */
    base_lo_rand: number;
    /** round(factor·26) : borne haute mt_rand de l'offset de base (hors rebound). */
    base_hi_rand: number;
    /** round(factor·28) : somme nominale des offsets (offMax = somme − offMin). */
    off_sum: number;
    /** Plancher « protect » du rebound : 3 si jour ≤ 30, sinon 1. */
    protect: number;
    /** Largeur de bloc du planificateur ceil(jour/5)·5, appliquée aux slots planif uniquement. */
    blocks: number;
    /** Facteur d'âmes de la tour du jour attaqué au palier q (25 entrées ; 1 sans âme). */
    soul_tdg: number[];
    /** Facteur d'âmes du planificateur de la veille au palier q (25 entrées). */
    soul_planif: number[];
    /** Facteur d'âmes à l'attaque : les valeurs dérivées (cibles avant âmes) sont multipliées par ce facteur. */
    soul_attack: number;
    /** Largeur de shift = factor·shift/100 (0,10 au factor 1). */
    shift_span: number;
    /** Borne haute mt_rand de shift_min ×10⁴ = shift·factor·100. */
    shift_steps: number;
    /** Bornes théoriques du jour (difficulté normale). */
    min_global: number;
    max_global: number;
    /** false si le gate (isReboundPossible) prouve qu'aucun rebound n'a pu avoir lieu. */
    rebound_possible: boolean;
    /**
     * true si les feux d'artifice ont explosé dans la nuit précédant le jour attaqué
     * (BuildingDestructionListener) : les cibles stockées ont été décalées de
     * diff = v_pré·r/100 (floor), r ∈ [13, 16] imprédictible, et l'attaque réelle vaut
     * floor(v_pré·(1−r/100)). Le scan est inchangé (fenêtres sur les cibles courantes) ;
     * seule la dérivation plage → valeur énumère en plus r.
     */
    fireworks: boolean;
}

/** Message d'entrée du worker de scan : une tuile de seeds à scanner. */
export interface ScanTileRequest {
    observed: Int32Array;
    params: RefinerParams;
    first_seed: number;
    count: number;
}

/** Message de sortie du worker de scan : seeds compatibles de la tuile. */
export interface ScanTileResponse {
    hits: number[];
    count: number;
}

/** Port exact de mt_rand PHP (MT19937 mode MT_RAND_MT19937 + php_random_range32). */
export class PhpMt {
    private readonly s: Uint32Array = new Uint32Array(624);
    private count: number = 624;
    /** Curseur du mode « bloc » (rejeux multiples du même seed, voir prepareBlock). */
    private cursor: number = 0;
    private block_overflow: boolean = false;

    public seed(seed: number): void {
        this.s[0] = seed >>> 0;
        for (let i: number = 1; i < 624; i++) {
            const prev: number = this.s[i - 1];
            this.s[i] = (Math.imul(1812433253, prev ^ (prev >>> 30)) + i) >>> 0;
        }
        this.count = 624;
    }

    private static twist(m: number, u: number, v: number): number {
        const mix: number = ((u & 0x80000000) | (v & 0x7fffffff)) >>> 0;
        return (m ^ (mix >>> 1) ^ ((v & 1) ? 0x9908b0df : 0)) >>> 0;
    }

    private static temper(value: number): number {
        let s1: number = value;
        s1 ^= s1 >>> 11;
        s1 = (s1 ^ ((s1 << 7) & 0x9d2c5680)) >>> 0;
        s1 = (s1 ^ ((s1 << 15) & 0xefc60000)) >>> 0;
        s1 = (s1 ^ (s1 >>> 18)) >>> 0;
        return s1;
    }

    private reload(): void {
        const n: number = 624;
        const m: number = 397;
        let p: number = 0;
        for (let i: number = 0; i < n - m; i++, p++) {
            this.s[p] = PhpMt.twist(this.s[p + m], this.s[p], this.s[p + 1]);
        }
        for (let i: number = 0; i < m - 1; i++, p++) {
            this.s[p] = PhpMt.twist(this.s[p + m - n], this.s[p], this.s[p + 1]);
        }
        this.s[p] = PhpMt.twist(this.s[p + m - n], this.s[p], this.s[0]);
        this.count = 0;
    }

    private next(): number {
        if (this.count >= 624) {
            this.reload();
        }
        return PhpMt.temper(this.s[this.count++]);
    }

    private range32(umax: number): number {
        let result: number = this.next();
        if (umax === 0xFFFFFFFF) {
            return result;
        }
        const um: number = (umax + 1) >>> 0;
        if ((um & (um - 1)) === 0) {
            return result & (um - 1);
        }
        const limit: number = (0xFFFFFFFF - (0xFFFFFFFF % um) - 1) >>> 0;
        while (result > limit) {
            result = this.next();
        }
        return result % um;
    }

    public rand(min: number, max: number): number {
        // PHP consomme un tirage même quand min === max : rand_range32 appelle generate()
        // AVANT tout test (umax = 0 → um = 1, puissance de 2 → result & 0 = 0).
        return min + this.range32((max - min) >>> 0);
    }

    // --- Mode « bloc » : le bloc twisté est calculé UNE fois par seed (prepareBlock), puis chaque
    // trajectoire (une par configuration d'offsets) le relit depuis le début via un curseur
    // (startTrajectory), au lieu de re-payer init + reload à chaque base. Une trajectoire consomme
    // au plus ~160 sorties : prepareBlock ne calcule donc QUE les BUDGET premiers éléments twistés
    // (parité exacte avec le shader WGSL du GPU, déjà validé bit-exact vs PHP en production — même
    // troncature, même budget). Si le curseur dépassait BUDGET (cascade de rejets improbable),
    // blockOverflow passe à true et l'appelant doit traiter le seed en candidat conservatif. ---

    /** Sorties MT19937 twistées qu'une trajectoire peut consommer au plus (même valeur que le shader GPU). */
    private static readonly BUDGET: number = 160;
    /** État initial requis pour twister les BUDGET premiers éléments : twist(p) lit s[p+397]. */
    private static readonly BUDGET_INIT: number = PhpMt.BUDGET + 397;

    public prepareBlock(seed: number): void {
        this.s[0] = seed >>> 0;
        for (let i: number = 1; i < PhpMt.BUDGET_INIT; i++) {
            const prev: number = this.s[i - 1];
            this.s[i] = (Math.imul(1812433253, prev ^ (prev >>> 30)) + i) >>> 0;
        }
        const m: number = 397;
        for (let p: number = 0; p < PhpMt.BUDGET; p++) {
            this.s[p] = PhpMt.twist(this.s[p + m], this.s[p], this.s[p + 1]);
        }
    }

    public startTrajectory(): void {
        this.cursor = 0;
        this.block_overflow = false;
    }

    public get blockOverflow(): boolean {
        return this.block_overflow;
    }

    private nextBlock(): number {
        if (this.cursor >= PhpMt.BUDGET) {
            this.block_overflow = true;
            return 0;
        }
        return PhpMt.temper(this.s[this.cursor++]);
    }

    private range32Block(umax: number): number {
        let result: number = this.nextBlock();
        if (umax === 0xFFFFFFFF) {
            return result;
        }
        const um: number = (umax + 1) >>> 0;
        if ((um & (um - 1)) === 0) {
            return result & (um - 1);
        }
        const limit: number = (0xFFFFFFFF - (0xFFFFFFFF % um) - 1) >>> 0;
        while (result > limit) {
            result = this.nextBlock();
        }
        return result % um;
    }

    public randBlock(min: number, max: number): number {
        return min + this.range32Block((max - min) >>> 0);
    }
}

function chance(mt: PhpMt, c: number): boolean {
    // Port exact de RandomGenerator::chance (MyHordes) : court-circuit SANS consommer mt_rand
    // pour c >= 1 (true) ou c <= 0 (false). Le flux RNG saute donc un tirage dès qu'un offset
    // vaut exactement 0.0 en f64 — mais PAS quand il ne garde qu'une poussière ~1e-15 issue des
    // arrondis, cas que le rejeu f64 reproduit naturellement à l'identique de PHP.
    if (c >= 1.0) {
        return true;
    }
    if (c <= 0.0) {
        return false;
    }
    return mt.rand(0, 99) < 100 * c;
}

function chanceBlock(mt: PhpMt, c: number): boolean {
    if (c >= 1.0) {
        return true;
    }
    if (c <= 0.0) {
        return false;
    }
    return mt.randBlock(0, 99) < 100 * c;
}

/** Trajectoire d'offsets [offMin_q, offMax_q] pour q=0..24 (base + seed), en f64 exact. */
export function offsetTrajectory(mt: PhpMt, offMinBase: number, offMaxBase: number, seed: number): [number, number][] {
    let oMin: number = offMinBase;
    let oMax: number = offMaxBase;
    mt.seed(seed);
    const traj: [number, number][] = [[oMin, oMax]];
    const minSpread: number = SPREAD - SHIFT;
    for (let i: number = 0; i < 24; i++) {
        const spendable: number = (Math.max(0, oMin) + Math.max(0, oMax)) / (24 - i);
        const calcNext: () => number = (): number => mt.rand(Math.floor(spendable * 250), Math.floor(spendable * 1000)) / 1000.0;
        if (oMin + oMax > minSpread) {
            const incMin: boolean = chance(mt, oMin / (oMin + oMax));
            const alter: number = calcNext();
            if (chance(mt, 0.25)) {
                const alterMax: number = calcNext();
                oMin = Math.max(0, oMin - alter);
                oMax = Math.max(0, oMax - alterMax);
            } else if (incMin && oMin > 0) {
                oMin = Math.max(0, oMin - alter);
            } else {
                oMax = Math.max(0, oMax - alter);
            }
        }
        traj.push([oMin, oMax]);
    }
    return traj;
}

/**
 * Gate « rebound » : détermine si le deshift des offsets (protect + ré-arrondis, donc plage de
 * bases élargie et sommes ±1) a PU se produire, à partir des seules valeurs saisies.
 *
 * Bornes garanties des cibles (off ≥ 0 et pf ≥ 1 dans le bon sens, valables pour toute
 * configuration) : targetMin ≥ max_q (min_q − 0,5)/pf et targetMax ≤ min_q (max_q + 0,5)/pf.
 * Le rebound se déclenche ssi targetMin·(1−o1) < minGlobal ou targetMax·(1+o2) > maxGlobal, avec
 * o1 ≤ f26r/100 et o2 ≤ (offSum−f5r)/100 avant rebound (les conditions croisées du deshift sont
 * dominées par celles-ci). Si les deux sont exclues avec une marge de 1 zombie → condition
 * nécessaire violée → aucun rebound possible, quel que soit le seed. Sinon, scan complet.
 */
export function isReboundPossible(observed: Int32Array, params: RefinerParams): boolean {
    if (params.fireworks) {
        // Cibles décalées vers le bas après génération : les affichages ne majorent plus la cible
        // max PRÉ-explosion (celle que le rebound a vue) → le gate ne peut rien prouver.
        return true;
    }
    let t_lo: number = -1;
    let t_hi: number = -1;
    for (let q: number = 0; q <= 24; q++) {
        for (const slot of [q, 50 + q]) {
            const obMin: number = observed[slot];
            if (obMin !== NO_CONSTRAINT) {
                const pf: number = slot >= 50 ? params.soul_planif[q] : params.soul_tdg[q];
                t_lo = Math.max(t_lo, (obMin - 0.5) / pf);
            }
        }
        for (const slot of [25 + q, 75 + q]) {
            const obMax: number = observed[slot];
            if (obMax !== NO_CONSTRAINT) {
                const pf: number = slot >= 75 ? params.soul_planif[q] : params.soul_tdg[q];
                const bound: number = (obMax + 0.5) / pf;
                t_hi = t_hi < 0 ? bound : Math.min(t_hi, bound);
            }
        }
    }
    const min_impossible: boolean = t_lo > 0 && t_lo * (1 - params.base_hi_rand / 100) > params.min_global + 1;
    const max_impossible: boolean = t_hi > 0 && t_hi * (1 + (params.off_sum - params.base_lo_rand) / 100) < params.max_global - 1;
    return !(min_impossible && max_impossible);
}

/** Configurations d'offsets (somme, plage de bases) à explorer selon la possibilité de rebound. */
export interface OffsetConfig {
    sum: number;
    base_lo: number;
    base_hi: number;
}

export function offsetConfigs(params: RefinerParams): OffsetConfig[] {
    if (!params.rebound_possible) {
        // Rebound exclu par les bornes observées : offsets = tirages mt_rand purs.
        return [{ sum: params.off_sum, base_lo: params.base_lo_rand, base_hi: params.base_hi_rand }];
    }
    // Somme nominale round(factor·28), plus ±1 : les arrondis séparés de o1/o2 après un rebound
    // peuvent décaler la somme stockée d'une unité (fractions à ,5 ± poussière f64). Les sommes ±1
    // ne passent que par le rebound → plage [protect, somme−protect].
    const configs: OffsetConfig[] = [];
    for (let sum: number = params.off_sum - 1; sum <= params.off_sum + 1; sum++) {
        const rebound_only: boolean = sum !== params.off_sum;
        configs.push({
            sum: sum,
            base_lo: rebound_only ? params.protect : Math.min(params.base_lo_rand, params.protect),
            base_hi: rebound_only ? sum - params.protect : Math.max(params.base_hi_rand, sum - params.protect)
        });
    }
    return configs;
}

interface TargetWindow {
    t_min_lo: number;
    t_min_hi: number;
    t_max_lo: number;
    t_max_hi: number;
}

/**
 * Applique les contraintes du palier q (4 slots : TDG min/max en bloc 1, planif min/max en bloc B)
 * aux fenêtres cibles, puis vérifie qu'il reste au moins un entier dans chacune.
 * Inversion : TDG → round(t·f·pf) = ob ; planif min → round(...) ∈ [ob, ob+B−1] (affichage floor) ;
 * planif max → round(...) ∈ [ob−B+1, ob] (affichage ceil).
 */
function applyBucketConstraints(observed: Int32Array, q: number, offMin: number, offMax: number, params: RefinerParams, win: TargetWindow): boolean {
    const pf_tdg: number = params.soul_tdg[q];
    const pf_planif: number = params.soul_planif[q];
    const blocks: number = params.blocks;
    const obMinTdg: number = observed[q];
    const obMaxTdg: number = observed[25 + q];
    const obMinPlanif: number = observed[50 + q];
    const obMaxPlanif: number = observed[75 + q];
    if (obMinTdg !== NO_CONSTRAINT) {
        const fMin: number = (1 - offMin / 100) * pf_tdg;
        win.t_min_lo = Math.max(win.t_min_lo, (obMinTdg - 0.5 - ROUND_EPS) / fMin);
        win.t_min_hi = Math.min(win.t_min_hi, (obMinTdg + 0.5 + ROUND_EPS) / fMin);
    }
    if (obMinPlanif !== NO_CONSTRAINT) {
        const fMin: number = (1 - offMin / 100) * pf_planif;
        win.t_min_lo = Math.max(win.t_min_lo, (obMinPlanif - 0.5 - ROUND_EPS) / fMin);
        win.t_min_hi = Math.min(win.t_min_hi, (obMinPlanif + blocks - 0.5 + ROUND_EPS) / fMin);
    }
    if (obMaxTdg !== NO_CONSTRAINT) {
        const fMax: number = (1 + offMax / 100) * pf_tdg;
        win.t_max_lo = Math.max(win.t_max_lo, (obMaxTdg - 0.5 - ROUND_EPS) / fMax);
        win.t_max_hi = Math.min(win.t_max_hi, (obMaxTdg + 0.5 + ROUND_EPS) / fMax);
    }
    if (obMaxPlanif !== NO_CONSTRAINT) {
        const fMax: number = (1 + offMax / 100) * pf_planif;
        win.t_max_lo = Math.max(win.t_max_lo, (obMaxPlanif - blocks + 0.5 - ROUND_EPS) / fMax);
        win.t_max_hi = Math.min(win.t_max_hi, (obMaxPlanif + 0.5 + ROUND_EPS) / fMax);
    }
    return Math.ceil(win.t_min_lo) <= Math.floor(win.t_min_hi) && Math.ceil(win.t_max_lo) <= Math.floor(win.t_max_hi);
}

/**
 * Dernier palier q ayant au moins une contrainte saisie (TDG ou planif, min ou max). Au-delà, aucun
 * palier ne peut plus élaguer une branche — que le scan continue jusqu'à q=24 ou s'arrête ici ne
 * change jamais le résultat, seulement le temps de calcul (utile quand la saisie est incomplète).
 */
export function lastConstrainedRound(observed: Int32Array): number {
    for (let q: number = 24; q >= 0; q--) {
        if (observed[q] !== NO_CONSTRAINT || observed[25 + q] !== NO_CONSTRAINT || observed[50 + q] !== NO_CONSTRAINT || observed[75 + q] !== NO_CONSTRAINT) {
            return q;
        }
    }
    return 24;
}

// --- Filtre par paires d'offsets : élimine AVANT le scan les configs (somme, base) pour lesquelles
// AUCUNE trajectoire, quel que soit le seed, ne peut satisfaire les paliers saisis. Chaque test est
// une condition NÉCESSAIRE de trajectoryCompatible (superset garanti, jamais de faux négatif) :
//  - monotonie par côté (un offset ne fait que décroître) ;
//  - décroissance par côté et par round ≤ spendable = somme/(24−i) (alter ≤ floor(sp·1000)/1000) ;
//  - cône de somme bas : au pire les deux côtés perdent sp → somme·(24−n)(23−n)/552 ;
//  - cône de somme haut : hors écrêtage à 0, la somme perd ≥ sp/4 − 0,001 (floor(sp·250)/1000) ;
//    l'écrêtage (côté choisi < alter) n'arrive qu'une fois par côté → 2 rounds de marge ;
//  - fenêtres cibles : inversion de applyBucketConstraints (même ROUND_EPS). ---

/** Couple (somme, base) d'offsets initiaux : une trajectoire candidate du scan. */
export interface OffsetPair {
    sum: number;
    base: number;
}

/**
 * Nœuds de branch-and-bound par config au-delà desquels la config est GARDÉE (fail-open). Mesuré
 * (2026-09-29) : ≤ 1 351 nœuds par config et 0,03-0,2 ms par appel sur 2,4 M saisies réalistes ;
 * pire cas adverse (saisie incohérente) 8 000 nœuds, 48 ms. 20 000 ne sert donc que de garde-fou
 * contre une explosion non vue, sans jamais trancher en pratique.
 */
export const FEASIBILITY_BUDGET: number = 20000;
/** Tolérance des comparaisons du filtre (erreurs f64 ~1e-13 sur des offsets ≤ 36). */
const FEASIBILITY_EPS: number = 1e-9;
/** Marge sur le cumul de décroissance lors du calcul des bornes cibles extrêmes. */
const CUM_MARGIN: number = 1e-6;

interface SumCone {
    /** Borne basse de oMin+oMax après n rounds. */
    lo: number[];
    /** Borne haute de oMin+oMax après n rounds. */
    hi: number[];
    /** Borne haute de la décroissance cumulée d'UN côté après n rounds. */
    cum: number[];
}

/** Cônes de somme et de décroissance cumulée d'une config de somme initiale `sum`. */
function buildSumCone(sum: number): SumCone {
    const lo: number[] = new Array<number>(25).fill(0);
    const hi: number[] = new Array<number>(25).fill(0);
    const cum: number[] = new Array<number>(25).fill(0);
    for (let n: number = 0; n <= 24; n++) {
        lo[n] = n >= 23 ? 0 : (sum * (24 - n) * (23 - n)) / 552;
        let remaining: number = sum;
        for (let i: number = 0; i <= n - 3; i++) {
            remaining = remaining * (1 - 0.25 / (24 - i)) + 0.001;
        }
        hi[n] = remaining;
    }
    for (let n: number = 1; n <= 24; n++) {
        cum[n] = cum[n - 1] + hi[n - 1] / (24 - (n - 1));
    }
    return { lo, hi, cum };
}

/** Rapport minimal somme(n2)/somme(n1) pour n1 < n2 (les deux côtés perdent sp à chaque round). */
function sumDecayMin(n1: number, n2: number): number {
    return n1 >= 23 ? 0 : ((24 - n2) * (23 - n2)) / ((24 - n1) * (23 - n1));
}

/**
 * Restreint `win` (plage du facteur f = 1 ∓ o/100) avec la contrainte t·f·pf ∈ [c_lo, c_hi], pour
 * TOUT t de [t_lo, t_hi] (union : c/t est monotone en t, les extrêmes sont aux bornes).
 */
function narrowFactor(win: [number, number], c_lo: number, c_hi: number, pf: number, t_lo: number, t_hi: number): void {
    win[0] = Math.max(win[0], Math.min(c_lo / (t_lo * pf), c_lo / (t_hi * pf)));
    win[1] = Math.min(win[1], Math.max(c_hi / (t_lo * pf), c_hi / (t_hi * pf)));
}

/**
 * Plage d'offset [o_lo, o_hi] au palier q compatible avec les saisies du côté min (ou max) pour une
 * cible dans [t_lo, t_hi] — inversion de applyBucketConstraints. null si ce côté n'a aucune saisie à q.
 */
function offsetWindow(observed: Int32Array, q: number, min_side: boolean, t_lo: number, t_hi: number, params: RefinerParams): [number, number] | null {
    const ob_tdg: number = observed[(min_side ? 0 : 25) + q];
    const ob_planif: number = observed[(min_side ? 50 : 75) + q];
    if (ob_tdg === NO_CONSTRAINT && ob_planif === NO_CONSTRAINT) {
        return null;
    }
    const blocks: number = params.blocks;
    const factor: [number, number] = [-Infinity, Infinity];
    if (ob_tdg !== NO_CONSTRAINT) {
        narrowFactor(factor, ob_tdg - 0.5 - ROUND_EPS, ob_tdg + 0.5 + ROUND_EPS, params.soul_tdg[q], t_lo, t_hi);
    }
    if (ob_planif !== NO_CONSTRAINT) {
        const c_lo: number = min_side ? ob_planif - 0.5 - ROUND_EPS : ob_planif - blocks + 0.5 - ROUND_EPS;
        const c_hi: number = min_side ? ob_planif + blocks - 0.5 + ROUND_EPS : ob_planif + 0.5 + ROUND_EPS;
        narrowFactor(factor, c_lo, c_hi, params.soul_planif[q], t_lo, t_hi);
    }
    // min : f = 1 − o/100 (décroissant en o) ; max : f = 1 + o/100.
    return min_side ? [100 * (1 - factor[1]), 100 * (1 - factor[0])] : [100 * (factor[0] - 1), 100 * (factor[1] - 1)];
}

/**
 * Existe-t-il une trajectoire d'offsets depuis (offMin0, sum − offMin0) compatible avec une cible
 * min dans [t_min_lo, t_min_hi], une cible max dans [t_max_lo, t_max_hi] et tous les paliers `rounds` ?
 * Conditions nécessaires uniquement : false ⇒ aucune paire de cibles de ces plages n'est possible.
 */
function bandFeasible(observed: Int32Array, params: RefinerParams, rounds: number[], sum: number, off_min0: number, cone: SumCone, t_min_lo: number, t_min_hi: number, t_max_lo: number, t_max_hi: number): boolean {
    const off_max0: number = sum - off_min0;
    let a_prev_high: number = off_min0;
    let b_prev_high: number = off_max0;
    let sum_prev_high: number = sum;
    let sum_prev_low: number = 0;
    let n_prev: number = -1;
    for (const q of rounds) {
        let a_low: number = Math.max(0, off_min0 - cone.cum[q]);
        let a_high: number = Math.min(off_min0, a_prev_high);
        const min_win: [number, number] | null = offsetWindow(observed, q, true, t_min_lo, t_min_hi, params);
        if (min_win !== null) {
            a_low = Math.max(a_low, min_win[0]);
            a_high = Math.min(a_high, min_win[1]);
        }
        if (a_low > a_high + FEASIBILITY_EPS) {
            return false;
        }
        let b_low: number = Math.max(0, off_max0 - cone.cum[q]);
        let b_high: number = Math.min(off_max0, b_prev_high);
        const max_win: [number, number] | null = offsetWindow(observed, q, false, t_max_lo, t_max_hi, params);
        if (max_win !== null) {
            b_low = Math.max(b_low, max_win[0]);
            b_high = Math.min(b_high, max_win[1]);
        }
        if (b_low > b_high + FEASIBILITY_EPS) {
            return false;
        }
        let sum_low: number = Math.max(a_low + b_low, cone.lo[q]);
        if (n_prev >= 0) {
            sum_low = Math.max(sum_low, sum_prev_low * sumDecayMin(n_prev, q));
        }
        const sum_high: number = Math.min(a_high + b_high, cone.hi[q], sum_prev_high);
        if (sum_low > sum_high + FEASIBILITY_EPS) {
            return false;
        }
        a_prev_high = a_high;
        b_prev_high = b_high;
        sum_prev_high = sum_high;
        sum_prev_low = sum_low;
        n_prev = q;
    }
    return true;
}

/**
 * Faisabilité d'une config (somme, base) par branch-and-bound sur les plages entières de cibles.
 * Plages initiales : applyBucketConstraints évalué aux offsets extrêmes de chaque palier (ses bornes
 * sont monotones en l'offset, y compris en f64) → superset exact des cibles que le scan accepterait.
 * Un côté sans aucune saisie n'influe pas → plage réduite à une valeur factice.
 */
function configFeasible(observed: Int32Array, params: RefinerParams, rounds: number[], sum: number, base: number, budget: number): boolean {
    const cone: SumCone = buildSumCone(sum);
    const off_max0: number = sum - base;
    const low: TargetWindow = { t_min_lo: 1, t_min_hi: 1e9, t_max_lo: 1, t_max_hi: 1e9 };
    const high: TargetWindow = { t_min_lo: 1, t_min_hi: 1e9, t_max_lo: 1, t_max_hi: 1e9 };
    let has_min: boolean = false;
    let has_max: boolean = false;
    for (const q of rounds) {
        has_min = has_min || observed[q] !== NO_CONSTRAINT || observed[50 + q] !== NO_CONSTRAINT;
        has_max = has_max || observed[25 + q] !== NO_CONSTRAINT || observed[75 + q] !== NO_CONSTRAINT;
        const min_floor: number = q === 0 ? base : Math.max(0, base - cone.cum[q] - CUM_MARGIN);
        const max_floor: number = q === 0 ? off_max0 : Math.max(0, off_max0 - cone.cum[q] - CUM_MARGIN);
        applyBucketConstraints(observed, q, min_floor, off_max0, params, low);
        applyBucketConstraints(observed, q, base, max_floor, params, high);
    }
    const stack: number[][] = [[
        has_min ? Math.ceil(low.t_min_lo) : 1, has_min ? Math.floor(high.t_min_hi) : 1,
        has_max ? Math.ceil(low.t_max_lo) : 1, has_max ? Math.floor(high.t_max_hi) : 1
    ]];
    let nodes: number = 0;
    while (stack.length > 0) {
        if (++nodes > budget) {
            return true;
        }
        const [min_lo, min_hi, max_lo, max_hi]: number[] = stack.pop() as number[];
        if (min_lo > min_hi || max_lo > max_hi) {
            continue;
        }
        if (!bandFeasible(observed, params, rounds, sum, base, cone, min_lo, min_hi, max_lo, max_hi)) {
            continue;
        }
        if (min_lo === min_hi && max_lo === max_hi) {
            return true;
        }
        if (min_hi - min_lo >= max_hi - max_lo) {
            const mid: number = Math.floor((min_lo + min_hi) / 2);
            stack.push([mid + 1, min_hi, max_lo, max_hi], [min_lo, mid, max_lo, max_hi]);
        } else {
            const mid: number = Math.floor((max_lo + max_hi) / 2);
            stack.push([min_lo, min_hi, mid + 1, max_hi], [min_lo, min_hi, max_lo, mid]);
        }
    }
    return false;
}

/**
 * Configs (somme, base) de {@link offsetConfigs} qu'au moins un seed peut encore rendre compatibles
 * avec les saisies. Superset garanti des configs retenues par le scan (zéro faux négatif) : une config
 * n'est retirée que si elle est PROUVÉE infaisable dans le budget, sinon elle est gardée.
 * @param observed 100 entiers (voir en-tête du fichier).
 * @param params Paramètres du modèle.
 * @param budget Nœuds de branch-and-bound par config avant fail-open (voir {@link FEASIBILITY_BUDGET}).
 * @returns Configs survivantes, dans l'ordre de parcours du scan.
 */
export function feasibleConfigs(observed: Int32Array, params: RefinerParams, budget: number = FEASIBILITY_BUDGET): OffsetPair[] {
    const rounds: number[] = [];
    for (let q: number = 0; q <= 24; q++) {
        if (observed[q] !== NO_CONSTRAINT || observed[25 + q] !== NO_CONSTRAINT || observed[50 + q] !== NO_CONSTRAINT || observed[75 + q] !== NO_CONSTRAINT) {
            rounds.push(q);
        }
    }
    const pairs: OffsetPair[] = [];
    for (const config of offsetConfigs(params)) {
        for (let base: number = config.base_lo; base <= config.base_hi; base++) {
            // Cône haut invalide si la réduction s'arrête avant 0 (somme ≤ SPREAD − SHIFT) : pas de filtre.
            if (SPREAD - SHIFT > 0 || configFeasible(observed, params, rounds, config.sum, base, budget)) {
                pairs.push({ sum: config.sum, base });
            }
        }
    }
    return pairs;
}

/** Fenêtres entières [targetMin, targetMax] compatibles avec tous les paliers, ou null si incohérent. */
function computeTargetWindow(observed: Int32Array, traj: [number, number][], params: RefinerParams): TargetWindow | null {
    const win: TargetWindow = { t_min_lo: 1, t_min_hi: 1e9, t_max_lo: 1, t_max_hi: 1e9 };
    for (let q: number = 0; q <= 24; q++) {
        if (!applyBucketConstraints(observed, q, traj[q][0], traj[q][1], params, win)) {
            return null;
        }
    }
    return {
        t_min_lo: Math.ceil(win.t_min_lo),
        t_min_hi: Math.floor(win.t_min_hi),
        t_max_lo: Math.ceil(win.t_max_lo),
        t_max_hi: Math.floor(win.t_max_hi)
    };
}

/**
 * Scan CPU exact d'une plage de seeds : pour chaque seed, rejoue chaque configuration (somme, base)
 * en f64 avec élagage par palier, et retourne les seeds dont au moins une trajectoire reste
 * cohérente avec toutes les saisies. Exact par construction (mêmes opérations f64 que PHP) ;
 * l'unique cas conservatif est le débordement du bloc MT19937 (blockOverflow), tranché ensuite
 * par deriveValueRange. Seules les configs survivant à {@link feasibleConfigs} sont rejouées.
 */
export function scanSeedRangeCpu(observed: Int32Array, params: RefinerParams, first_seed: number, count: number): number[] {
    const mt: PhpMt = new PhpMt();
    const pairs: OffsetPair[] = feasibleConfigs(observed, params);
    const q_last: number = lastConstrainedRound(observed);
    const hits: number[] = [];
    if (pairs.length === 0) {
        return hits;
    }
    for (let i: number = 0; i < count; i++) {
        const seed: number = (first_seed + i) >>> 0;
        mt.prepareBlock(seed);
        let match: boolean = false;
        for (const pair of pairs) {
            if (trajectoryCompatible(mt, observed, params, pair.base, pair.sum - pair.base, q_last)) {
                match = true;
                break;
            }
        }
        if (match) {
            hits.push(seed);
        }
    }
    return hits;
}

/**
 * Rejoue une trajectoire (mode bloc) avec fenêtres incrémentales et élagage à chaque palier.
 * S'arrête à `qLast` (dernier palier saisi, voir {@link lastConstrainedRound}) : au-delà, aucune
 * contrainte ne peut plus rien élaguer (résultat identique à q=24, juste plus lent à calculer).
 * `24 - q` dans la formule de décroissance reste la VRAIE longueur du jeu (constante du modèle),
 * indépendante d'où l'on choisit d'arrêter le calcul.
 */
function trajectoryCompatible(mt: PhpMt, observed: Int32Array, params: RefinerParams, offMinBase: number, offMaxBase: number, qLast: number): boolean {
    mt.startTrajectory();
    let oMin: number = offMinBase;
    let oMax: number = offMaxBase;
    const win: TargetWindow = { t_min_lo: 1, t_min_hi: 1e9, t_max_lo: 1, t_max_hi: 1e9 };
    const minSpread: number = SPREAD - SHIFT;
    for (let q: number = 0; q <= qLast; q++) {
        if (!applyBucketConstraints(observed, q, oMin, oMax, params, win)) {
            return false;
        }
        if (q === qLast) {
            break;
        }
        const spendable: number = (Math.max(0, oMin) + Math.max(0, oMax)) / (24 - q);
        if (oMin + oMax > minSpread) {
            const incMin: boolean = chanceBlock(mt, oMin / (oMin + oMax));
            const alter: number = mt.randBlock(Math.floor(spendable * 250), Math.floor(spendable * 1000)) / 1000.0;
            if (chanceBlock(mt, 0.25)) {
                const alterMax: number = mt.randBlock(Math.floor(spendable * 250), Math.floor(spendable * 1000)) / 1000.0;
                oMin = Math.max(0, oMin - alter);
                oMax = Math.max(0, oMax - alterMax);
            } else if (incMin && oMin > 0) {
                oMin = Math.max(0, oMin - alter);
            } else {
                oMax = Math.max(0, oMax - alter);
            }
        }
        if (mt.blockOverflow) {
            // Cascade de rejets mt_rand improbable : candidat conservatif, re-vérifié par deriveValueRange.
            return true;
        }
    }
    return true;
}

/**
 * Re-vérifie les seeds candidats en f64 exact et dérive la plage de valeurs d'attaque.
 *
 * Pour chaque (seed, somme d'offsets, base), on rejoue la trajectoire, on propage les fenêtres
 * [targetMin, targetMax] à partir des paliers observés, et on dérive les valeurs d'attaque
 * compatibles en énumérant les 10⁴·shift_min possibles (targetMin = round(v·(1−s)),
 * targetMax = round(v·(1+span−s))), y compris les deux cas de deshift où une cible est plaquée
 * sur les bornes du jour.
 *
 * @param observed 100 entiers (voir en-tête du fichier ; NO_CONSTRAINT si non saisi).
 * @param hits Seeds candidats (GPU et/ou scan CPU).
 * @param params Paramètres du modèle (voir RefinerParams).
 * @param observed_planif Sous feux d'artifice uniquement : paliers planif(D−1) PRÉ-explosion, dans
 *        un buffer séparé de `observed` (qui reste TDG post-explosion seul, comme aujourd'hui — le
 *        scan de seeds n'est jamais affecté par ce paramètre). Absent ⇒ comportement inchangé.
 * @returns Valeurs d'attaque compatibles et plage de réduction feux d'artifice compatible (null si
 *          non applicable ou non disponible).
 */
export function deriveValueRange(observed: Int32Array, hits: number[], params: RefinerParams, observed_planif?: Int32Array): DerivedRange {
    const mt: PhpMt = new PhpMt();
    const values: Set<number> = new Set<number>();
    const accepted_reductions: Set<number> = new Set<number>();
    const configs: OffsetConfig[] = offsetConfigs(params);
    for (const seed of hits) {
        for (const config of configs) {
            for (let base: number = config.base_lo; base <= config.base_hi; base++) {
                const traj: [number, number][] = offsetTrajectory(mt, base, config.sum - base, seed);
                const window: TargetWindow | null = computeTargetWindow(observed, traj, params);
                if (window === null) {
                    continue;
                }
                let window_pre: TargetWindow | undefined;
                if (observed_planif) {
                    const computed_pre: TargetWindow | null = computeTargetWindow(observed_planif, traj, params);
                    if (computed_pre === null) {
                        continue;
                    }
                    window_pre = computed_pre;
                }
                addCompatibleValues(values, window, params, window_pre, accepted_reductions);
            }
        }
    }
    const sorted_reductions: number[] = [...accepted_reductions].sort((reduction_a: number, reduction_b: number): number => reduction_a - reduction_b);
    return {
        values: [...values].sort((value_a: number, value_b: number): number => value_a - value_b),
        reduction: observed_planif && sorted_reductions.length > 0
            ? { min: sorted_reductions[0], max: sorted_reductions[sorted_reductions.length - 1] }
            : null
    };
}

/** Résultat de {@link deriveValueRange}. */
export interface DerivedRange {
    /** Valeurs d'attaque compatibles, triées et dédupliquées (vide si aucun hit valide). */
    values: number[];
    /** Plage des % de réduction feux d'artifice (13-16) compatibles avec TDG ET planif, ou null si non applicable. */
    reduction: { min: number; max: number } | null;
}

/** round() PHP (half away from zero) pour x > 0 : même opération f64 que php_round_helper. */
function phpRound(x: number): number {
    return Math.floor(x + 0.5);
}

/**
 * Attaque réelle de la nuit pour une valeur dérivée : round(zombies·pf_attaque), arrondi PHP.
 * @param value Valeur d'attaque dérivée (avant facteur d'âmes).
 * @param params Paramètres du modèle (`soul_attack`).
 */
export function attackFromValue(value: number, params: RefinerParams): number {
    return phpRound(value * params.soul_attack);
}

/**
 * Vérification FORWARD-EXACTE d'un candidat (v, k) : rejeu littéral de la génération du jeu —
 * deshift (port exact de PrepareZombieAttackEstimationAction::deshift, priorité au côté min,
 * somme conservée) puis round(v − v·s1) / round(v + v·s2) — et appartenance aux fenêtres entières.
 * round() étant semi-ouvert en haut ([ob−0,5 ; ob+0,5[), cette vérification élimine les valeurs
 * fantômes que l'inversion d'intervalles fermés admettait quand v·(1−s) tombe exactement sur un ,5
 * (possible car s = k/10⁴ est rationnel et v entier).
 */
function forwardAccepts(v: number, k: number, window: TargetWindow, params: RefinerParams, fireworks_diff: number = 0, window_pre?: TargetWindow): boolean {
    let s_min: number = k / 10000;
    let s_max: number = params.shift_span - s_min;
    const bound_min: number = (v - params.min_global) / v;
    const bound_max: number = (params.max_global - v) / v;
    if (s_min > bound_min) {
        s_max += s_min - bound_min;
        s_min = bound_min;
    } else if (s_max > bound_max) {
        s_min += s_max - bound_max;
        s_max = bound_max;
    }
    const t_min_pre: number = phpRound(v - v * s_min);
    const t_max_pre: number = phpRound(v + v * s_max);
    if (window_pre && !(t_min_pre >= window_pre.t_min_lo && t_min_pre <= window_pre.t_min_hi && t_max_pre >= window_pre.t_max_lo && t_max_pre <= window_pre.t_max_hi)) {
        return false;
    }
    let t_min: number = t_min_pre;
    let t_max: number = t_max_pre;
    if (fireworks_diff > 0) {
        // Explosion des feux d'artifice : cibles stockées = floor(cible − diff), comme le jeu.
        t_min = Math.floor(t_min - fireworks_diff);
        t_max = Math.floor(t_max - fireworks_diff);
    }
    return t_min >= window.t_min_lo && t_min <= window.t_min_hi && t_max >= window.t_max_lo && t_max <= window.t_max_hi;
}

/** Valeurs d'attaque v telles que (targetMin, targetMax) puisse tomber dans la fenêtre. */
function addCompatibleValues(values: Set<number>, window: TargetWindow, params: RefinerParams, window_pre?: TargetWindow, accepted_reductions?: Set<number>): void {
    if (params.fireworks) {
        addCompatibleValuesFireworks(values, window, params, window_pre, accepted_reductions);
        return;
    }
    const span: number = params.shift_span;
    // Les pré-filtres d'intervalles ci-dessous restent des SUPERSETS (marges ±1, sans risque de faux
    // négatif) ; chaque candidat est ensuite tranché par forwardAccepts, qui applique aussi le
    // deshift — les valeurs clampées tombant dans ces plages sont donc traitées correctement.
    // Cas général : shift_min = k/10⁴, shift_max = span − shift_min.
    for (let k: number = 0; k <= params.shift_steps; k++) {
        const sMin: number = k / 10000;
        const sMax: number = span - sMin;
        const vLo: number = Math.max((window.t_min_lo - 1) / (1 - sMin), (window.t_max_lo - 1) / (1 + sMax), params.min_global);
        const vHi: number = Math.min((window.t_min_hi + 1) / (1 - sMin), (window.t_max_hi + 1) / (1 + sMax), params.max_global);
        for (let v: number = Math.ceil(vLo); v <= Math.floor(vHi); v++) {
            if (!values.has(v) && forwardAccepts(v, k, window, params)) {
                values.add(v);
            }
        }
    }
    if (span <= 0) {
        return;
    }
    // Deshift bas : shift_min plaqué sur (v−minGlobal)/v → cibles (minGlobal, round(minGlobal + v·span)),
    // identiques pour tout k déclencheur → une seule vérification avec le plus petit k qui clampe
    // strictement. Couvre les v hors des pré-filtres du cas général.
    if (window.t_min_lo <= params.min_global && params.min_global <= window.t_min_hi) {
        const vLo: number = Math.max((window.t_max_lo - params.min_global - 1) / span, params.min_global);
        const vHi: number = Math.min((window.t_max_hi - params.min_global + 1) / span, params.max_global);
        for (let v: number = Math.ceil(vLo); v <= Math.floor(vHi); v++) {
            if (values.has(v)) {
                continue;
            }
            const bound_min: number = (v - params.min_global) / v;
            let k: number = Math.max(0, Math.floor(bound_min * 10000)) + 1;
            while (k <= params.shift_steps && k / 10000 <= bound_min) {
                k++;
            }
            if (k <= params.shift_steps && forwardAccepts(v, k, window, params)) {
                values.add(v);
            }
        }
    }
    // Deshift haut : shift_max plaqué sur (maxGlobal−v)/v → cibles k-indépendantes ; k = 0 donne le
    // plus grand shift_max, donc si k = 0 ne clampe pas, aucun k ne clampe.
    if (window.t_max_lo <= params.max_global && params.max_global <= window.t_max_hi) {
        const vLo: number = Math.max((params.max_global - window.t_min_hi - 1) / span, params.min_global);
        const vHi: number = Math.min((params.max_global - window.t_min_lo + 1) / span, params.max_global);
        for (let v: number = Math.ceil(vLo); v <= Math.floor(vHi); v++) {
            if (!values.has(v) && forwardAccepts(v, 0, window, params)) {
                values.add(v);
            }
        }
    }
}

/** Pourcentages possibles de réduction de l'attaque par l'explosion des feux d'artifice (mt_rand(13,16)). */
const FIREWORKS_RATIO_MIN: number = 13;
const FIREWORKS_RATIO_MAX: number = 16;

/**
 * Dérivation en mode « feux d'artifice explosés » : les fenêtres portent sur les cibles
 * POST-explosion. On énumère exhaustivement (v_pré, r, k) — l'inversion d'intervalles est
 * piégeuse avec la géométrie décalée, et le coût (≈ (max−min)·4·(steps+1) ≈ 4,5 M de tests
 * par fenêtre, ~100 ms) reste négligeable devant le scan. La valeur ajoutée est l'attaque
 * RÉELLE floor(v_pré·(1−r/100)), pas v_pré.
 */
function addCompatibleValuesFireworks(values: Set<number>, window: TargetWindow, params: RefinerParams, window_pre?: TargetWindow, accepted_reductions?: Set<number>): void {
    for (let r: number = FIREWORKS_RATIO_MIN; r <= FIREWORKS_RATIO_MAX; r++) {
        const ratio: number = 1 - r / 100;
        for (let v: number = params.min_global; v <= params.max_global; v++) {
            const real_attack: number = Math.floor(v * ratio);
            // Pas de court-circuit sur `values.has(real_attack)` : un r peut être le seul à valider
            // ce v alors qu'un autre r a déjà ajouté le même real_attack via un v différent — sauter
            // le test perdrait l'information « ce r est compatible » nécessaire à `accepted_reductions`.
            const diff: number = v - v * ratio;
            for (let k: number = 0; k <= params.shift_steps; k++) {
                if (forwardAccepts(v, k, window, params, diff, window_pre)) {
                    values.add(real_attack);
                    accepted_reductions?.add(r);
                    break;
                }
            }
        }
    }
}
