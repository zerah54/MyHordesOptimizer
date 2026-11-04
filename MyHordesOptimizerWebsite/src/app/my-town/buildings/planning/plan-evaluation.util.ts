import { BudgetLine, CitizenCapacity, citizenCapacity, PoolBudget, poolBudgets } from './budget.util';
import { BuildingProgress, evaluateProgram, remainingAp, StepResult } from './building-progress.util';
import { BuildingUpgradesDTO, upgradeDefenseBonus } from './building-upgrades.types';
import { defenseGap, projectedDefense, rankByDefPerPa, RankCandidate, RankedCandidate } from './defense.util';
import {
    buildingDefenseGain,
    defenseGain,
    DefenseGainContext,
    DefenseGainResult,
    homeDefenseFactor,
    PlannedDefense,
    plannedDefenseGains,
    TownDefenseFactors
} from './defense-gain.util';
import { CIRCULAR_QUARTERS_UID, DEFENSE_FIXINGS_STEP, DEFENSE_FIXINGS_UID } from './defense-rules.const';
import { cascadeLevels } from './home-upgrades.util';
import { nightLifeLoss, ownNightLoss } from './night-survival.util';
import { BuildingPlanContentDTO, PlanCitizenDTO, PlanLossDTO, PlanLossKind, PlanPool, PlanTaskDTO, PlanTownLineDTO } from './plan.types';
import { missingResources, ResourceCount, sumResources } from './resources.util';
import { freeThreshold } from './workshop.util';

/** Uid du chantier « Atelier ». */
export const WORKSHOP_UID: string = 'small_refine_#00';

/** Uid du chantier « Bureau des esclavagistes ». */
export const SLAVERY_UID: string = 'small_slave_#00';

/** Uid du chantier « Brasier Sacrificiel » : construit, la nuit applique deux évolutions. */
export const PYRE_UID: string = 'small_pyre_#00';

/** Uid du chantier « Plan d'urbanisme » : construit, les agrandissements de maison prennent leur coût Urbanisme. */
export const URBANISM_UID: string = 'small_urban_#00';

/** Niveau maximal de l'atelier. */
const WORKSHOP_MAX_LEVEL: number = 5;

/** Chantier du référentiel, avec le coût retenu pour la ville (état synchronisé ou palier 0 du référentiel). */
export interface BuildingRef {
    id: number;
    uid: string;
    label: string;
    pa: number;
    defence: number;
    maxLife: number;
    temporary: boolean;
    breakable: boolean;
    parentId: number | null;
    resources: ResourceCount[];
}

/** Citoyen vivant pris en compte dans le budget. */
export interface CitizenRef {
    userId: number;
    name: string;
    banned: boolean;
    technician: boolean;
    homeLevel: number | null;
    /** Niveau de chaque amélioration de maison par clé `HomeEnum` (absente = 0) ; nul sans données de maison. */
    upgradeLevels: ReadonlyMap<string, number> | null;
}

/** Niveau de maison du référentiel, ressources résolues en identifiants d'objets. */
export interface HomeLevelRef {
    level: number;
    label: string;
    def: number;
    ap: number;
    apUrbanism: number;
    resources: ResourceCount[];
    resourcesUrbanism: ResourceCount[];
}

/** Tout ce qu'il faut pour évaluer une journée de plan. */
export interface DayInput {
    content: BuildingPlanContentDTO;
    buildings: ReadonlyMap<number, BuildingRef>;
    progress: ReadonlyMap<number, BuildingProgress>;
    workshopLevel: number;
    hasSlavery: boolean;
    citizens: CitizenRef[];
    expeditionPa: ReadonlyMap<number, number>;
    bank: ReadonlyMap<number, number>;
    itemValues: ReadonlyMap<number, number>;
    attack: number | null;
    baseDefense: number;
    temporaryDefense: number;
    homes: ReadonlyMap<number, HomeLevelRef>;
    /** Ressources de chaque niveau des améliorations de maison, par clé `HomeEnum`. */
    homeUpgrades: ReadonlyMap<string, ReadonlyMap<number, ResourceCount[]>>;
    hardMode: boolean;
    /** Composantes de la défense que touchent les chantiers à effet indirect (objets de défense, maisons, morts, échelle). */
    defenseFactors: TownDefenseFactors;
    /** Objets qui comptent comme objets de défense. */
    defenseItemIds: ReadonlySet<number>;
    /** Évolutions des chantiers (valeurs par niveau extraites du jeu). */
    upgrades: BuildingUpgradesDTO;
    /** Niveau d'évolution des chantiers construits, par uid (0 si absent). */
    buildingLevels: ReadonlyMap<string, number>;
}

/** Perte prévue évaluée : défense retirée la nuit même (bonus) ou dès le lendemain (chantier détruit). */
export interface PlannedLoss {
    buildingId: number;
    kind: PlanLossKind;
    defense: number;
}

/** Évolution votée le soir : niveau atteint et défense gagnée pour la nuit. */
export interface EveningVote {
    uid: string;
    level: number;
    defense: number;
}

/** Résultat de l'évaluation d'une journée. */
export interface DayEvaluation {
    workshopLevel: number;
    hasSlavery: boolean;
    results: StepResult[];
    progressAfter: Map<number, BuildingProgress>;
    progressBefore: ReadonlyMap<number, BuildingProgress>;
    nightLoss: ReadonlyMap<number, number>;
    capacities: CitizenCapacity[];
    expeditionPa: ReadonlyMap<number, number>;
    budgets: Record<PlanPool, PoolBudget>;
    completedIds: number[];
    needs: Map<number, number>;
    missing: ResourceCount[];
    /** PA des consignes d'agrandissement et d'amélioration de maison. */
    homeWorkPa: number;
    attack: number | null;
    target: number | null;
    projectedDefense: number;
    defenseGap: number | null;
    freeThresholds: Map<number, number>;
    ranking: RankedCandidate[];
    /** Défense réellement apportée par chaque chantier pas encore construit, s'il était terminé seul aujourd'hui. */
    realDefense: ReadonlyMap<number, number>;
    /** Composantes de la défense au soir. */
    defenseFactorsAfter: TownDefenseFactors;
    /** Évolution votée le soir ; nulle sans vote. */
    vote: EveningVote | null;
    /** Brasier Sacrificiel construit au soir : la nuit applique une seconde évolution. */
    doubleVote: boolean;
    /** Seconde évolution du soir (Brasier Sacrificiel construit, chantier différent du premier) ; nulle sinon. */
    secondVote: EveningVote | null;
    /** Pertes prévues sur des chantiers construits au soir. */
    losses: PlannedLoss[];
}

/** Valeurs qui se reportent d'un jour au suivant. */
type CarriedState = Pick<DayInput, 'progress' | 'workshopLevel' | 'hasSlavery' | 'baseDefense' | 'temporaryDefense' | 'defenseFactors' | 'buildingLevels'>;

/**
 * Évalue une journée de plan : étapes, budget par poche, ressources, défense projetée, seuils gratuits et classement.
 * @param {DayInput} input Contenu du plan et état de la ville au début de la journée.
 * @returns {DayEvaluation} Résultats de la journée.
 */
export function evaluateDay(input: DayInput): DayEvaluation {
    const content: BuildingPlanContentDTO = input.content;
    const night_loss: Map<number, number> = new Map<number, number>();
    const parents: Map<number, number | null> = new Map<number, number | null>();
    input.buildings.forEach((building: BuildingRef, id: number): void => {
        night_loss.set(id, nightLifeLoss(building, input.hardMode));
        parents.set(id, building.parentId);
    });
    const { results, state: progress_after }: { results: StepResult[]; state: Map<number, BuildingProgress> } = evaluateProgram(
        content.programs,
        input.progress,
        { workshopLevel: input.workshopLevel, hasSlavery: input.hasSlavery, nightLoss: night_loss, parents }
    );

    const capacities: CitizenCapacity[] = input.citizens.map((citizen: CitizenRef): CitizenCapacity => {
        const entry: PlanCitizenDTO | undefined = content.citizens.find((candidate: PlanCitizenDTO): boolean => candidate.userId === citizen.userId);
        const tasks: PlanTaskDTO[] = entry?.tasks ?? [];
        return citizenCapacity({
            userId: citizen.userId,
            banned: citizen.banned,
            technician: citizen.technician,
            basePa: entry?.basePaOverride ?? content.basePa,
            expeditionPa: input.expeditionPa.get(citizen.userId) ?? 0,
            taskPa: tasksPa(tasks.filter((task: PlanTaskDTO): boolean => task.kind !== 'home')),
            apOnlyTaskPa: tasksPa(tasks.filter((task: PlanTaskDTO): boolean => task.kind === 'home'))
        });
    });
    const lines: BudgetLine[] = content.townLines.map((line: PlanTownLineDTO): BudgetLine => ({ pool: line.pool, pa: line.pa }));
    const budgets: Record<PlanPool, PoolBudget> = poolBudgets(capacities, lines, {
        banned: costOf(results, 'banned'),
        regular: costOf(results, 'regular')
    });

    const completed_ids: number[] = results
        .filter((result: StepResult): boolean => result.completes && result.step.kind === 'build')
        .map((result: StepResult): number => result.step.buildingId);
    const home_tasks: { citizen: CitizenRef | undefined; level: number }[] = homeTasks(content, input.citizens);
    const gain_context: DefenseGainContext = defenseGainContext(input);
    const needs: Map<number, number> = sumResources([
        ...completed_ids.map((id: number): ResourceCount[] => input.buildings.get(id)?.resources ?? []),
        ...homeWorkResources(content, input, gain_context.builtBefore.has(URBANISM_UID))
    ]);

    const completed_refs: BuildingRef[] = completed_ids
        .map((id: number): BuildingRef | undefined => input.buildings.get(id))
        .filter((building: BuildingRef | undefined): building is BuildingRef => building !== undefined);
    const home_raw_gain: number = homesDefense(home_tasks, input.homes);
    const double_vote: boolean = builtInEvening(progress_after, input.buildings, PYRE_UID);
    const vote_ids: (number | null)[] = eveningVoteIds(content, double_vote);
    const voted_item_step: number = votedItemStep(input, vote_ids);
    const gain: DefenseGainResult = defenseGain(completed_refs, home_raw_gain, gain_context, voted_item_step);
    const homes_gain: number = defenseGain([], home_raw_gain, gain_context).total;
    const planned: PlannedDefense = plannedDefenseGains(completed_refs, pendingBuildings(input, completed_ids), home_raw_gain, gain_context, voted_item_step, input.buildings);
    const [vote, second_vote]: (EveningVote | null)[] = vote_ids.map((vote_id: number | null): EveningVote | null => {
        const item_defense: number = vote_id !== null && input.buildings.get(vote_id)?.uid === DEFENSE_FIXINGS_UID ? planned.vote : 0;
        return eveningVote(input, vote_id, gain.factorsAfter.scale, item_defense);
    });
    const losses: PlannedLoss[] = plannedLosses(input, progress_after, [vote, second_vote], gain.factorsAfter.scale);
    const projected: number = projectedDefense({
        baseDefense: input.baseDefense,
        completedBuildingsDef: gain.total - homes_gain - planned.vote,
        repairsDef: repairsDefense(results, input.progress, progress_after),
        homesDef: homes_gain,
        upgradeDef: (vote?.defense ?? 0) + (second_vote?.defense ?? 0),
        lostDef: lossTotal(losses, 'bonus'),
        sources: content.defenseSources.map((source: { def: number; qty: number }): { def: number; qty: number } => ({ def: source.def, qty: source.qty }))
    });
    const attack: number | null = content.attackOverride ?? input.attack;

    return {
        workshopLevel: input.workshopLevel,
        hasSlavery: input.hasSlavery,
        results,
        progressAfter: progress_after,
        progressBefore: input.progress,
        nightLoss: night_loss,
        capacities,
        expeditionPa: input.expeditionPa,
        budgets,
        completedIds: completed_ids,
        needs,
        missing: missingResources(needs, input.bank),
        attack,
        target: attack === null ? null : attack - content.allowedOverflow,
        projectedDefense: projected,
        defenseGap: attack === null ? null : defenseGap(attack, content.allowedOverflow, projected),
        freeThresholds: freeThresholds(input),
        ranking: rankByDefPerPa(rankCandidates(input, gain_context), input.itemValues),
        realDefense: planned.buildings,
        defenseFactorsAfter: gain.factorsAfter,
        vote,
        doubleVote: double_vote,
        secondVote: second_vote,
        losses,
        homeWorkPa: content.citizens.reduce((sum: number, entry: PlanCitizenDTO): number =>
            sum + tasksPa(entry.tasks.filter((task: PlanTaskDTO): boolean => task.kind === 'home' || task.kind === 'homeUpgrade')), 0)
    };
}

/**
 * Chantier construit au soir.
 * @param {ReadonlyMap<number, BuildingProgress>} progress Avancement au soir.
 * @param {ReadonlyMap<number, BuildingRef>} buildings Chantiers.
 * @param {string} uid Chantier cherché.
 * @returns {boolean} Vrai s'il est construit.
 */
function builtInEvening(progress: ReadonlyMap<number, BuildingProgress>, buildings: ReadonlyMap<number, BuildingRef>, uid: string): boolean {
    return Array.from(progress.values()).some((state: BuildingProgress): boolean => state.built && buildings.get(state.buildingId)?.uid === uid);
}

/**
 * Chantiers qui évolueront cette nuit : le vote du soir, puis le second si le Brasier Sacrificiel est construit, jamais deux fois le
 * même chantier (`NightlyHandler::stage2_building_effects`).
 * @param {BuildingPlanContentDTO} content Contenu du plan.
 * @param {boolean} double_vote Brasier Sacrificiel construit au soir.
 * @returns {(number | null)[]} Premier et second chantier, nul si aucun.
 */
function eveningVoteIds(content: BuildingPlanContentDTO, double_vote: boolean): (number | null)[] {
    const second: number | null = content.eveningSecondVoteBuildingId ?? null;
    return [content.eveningVoteBuildingId, double_vote && second !== content.eveningVoteBuildingId ? second : null];
}

/**
 * Niveau d'évolution d'un chantier au soir : niveau atteint par un vote du soir, sinon niveau connu.
 * @param {DayInput} input Entrée de la journée.
 * @param {string} uid Chantier.
 * @param {readonly (EveningVote | null)[]} votes Évolutions votées.
 * @returns {number} Niveau.
 */
function eveningLevel(input: DayInput, uid: string, votes: readonly (EveningVote | null)[]): number {
    return votes.find((vote: EveningVote | null): boolean => vote?.uid === uid)?.level ?? input.buildingLevels.get(uid) ?? 0;
}

/**
 * Pertes prévues sur les chantiers construits au soir (les chantiers temporaires disparaissent de toute façon) :
 * - bonus perdu (Lance-grenades sans pamplemousses, chantier à eau privé d'eau…) : son bonus d'évolution ne compte pas cette nuit ;
 * - chantier détruit : il compte encore cette nuit, puis perd sa défense et son bonus dès le lendemain.
 * @param {DayInput} input Entrée de la journée.
 * @param {ReadonlyMap<number, BuildingProgress>} progress Avancement au soir.
 * @param {readonly (EveningVote | null)[]} votes Évolutions votées.
 * @param {number} scale Échelle de la défense au soir.
 * @returns {PlannedLoss[]} Pertes évaluées.
 */
function plannedLosses(input: DayInput, progress: ReadonlyMap<number, BuildingProgress>, votes: readonly (EveningVote | null)[], scale: number): PlannedLoss[] {
    return (input.content.losses ?? []).flatMap((loss: PlanLossDTO): PlannedLoss[] => {
        const building: BuildingRef | undefined = input.buildings.get(loss.buildingId);
        const state: BuildingProgress | undefined = progress.get(loss.buildingId);
        if (building === undefined || building.temporary || state?.built !== true) {
            return [];
        }
        const bonus: number = upgradeDefenseBonus(input.upgrades, building.uid, building.defence, eveningLevel(input, building.uid, votes));
        const defense: number = loss.kind === 'bonus' ? bonus : state.def + bonus;
        return [{ buildingId: loss.buildingId, kind: loss.kind, defense: Math.round(defense * scale) }];
    });
}

/**
 * Défense totale d'un type de perte.
 * @param {PlannedLoss[]} losses Pertes évaluées.
 * @param {PlanLossKind} kind Type.
 * @returns {number} Somme.
 */
function lossTotal(losses: PlannedLoss[], kind: PlanLossKind): number {
    return losses.filter((loss: PlannedLoss): boolean => loss.kind === kind).reduce((sum: number, loss: PlannedLoss): number => sum + loss.defense, 0);
}

/**
 * Évolution votée le soir : le chantier passe au niveau suivant avant l'attaque (`onProcessPreAttackUpgrade` du jeu) ; son
 * bonus de défense (multiple de sa défense propre + défense ajoutée) compte donc pour la nuit même.
 * @param {DayInput} input Entrée de la journée.
 * @param {number | null} vote_id Chantier voté.
 * @param {number} scale Échelle de la défense au soir.
 * @param {number} item_defense Défense gagnée par les objets de défense (vote sur les Fixations), échelle comprise.
 * @returns {EveningVote | null} Niveau atteint et défense gagnée, nul sans vote.
 */
function eveningVote(input: DayInput, vote_id: number | null, scale: number, item_defense: number): EveningVote | null {
    const building: BuildingRef | undefined = vote_id === null ? undefined : input.buildings.get(vote_id);
    if (building === undefined) {
        return null;
    }
    const current: number = input.buildingLevels.get(building.uid) ?? 0;
    const max_level: number = input.upgrades[building.uid]?.maxLevel ?? Number.MAX_SAFE_INTEGER;
    const level: number = Math.min(current + 1, max_level);
    const gain: number = upgradeDefenseBonus(input.upgrades, building.uid, building.defence, level)
        - upgradeDefenseBonus(input.upgrades, building.uid, building.defence, current);
    return { uid: building.uid, level, defense: Math.round(gain * scale) + item_defense };
}

/**
 * Hausse du multiplicateur des objets de défense par le vote du soir : chaque niveau des Fixations de défenses vaut 0,5 de plus.
 * @param {DayInput} input Entrée de la journée.
 * @param {readonly (number | null)[]} vote_ids Chantiers votés.
 * @returns {number} Hausse, 0 sans vote sur les Fixations ou à leur niveau maximum.
 */
function votedItemStep(input: DayInput, vote_ids: readonly (number | null)[]): number {
    return vote_ids.some((vote_id: number | null): boolean => {
        const vote: EveningVote | null = eveningVote(input, vote_id, 1, 0);
        return vote?.uid === DEFENSE_FIXINGS_UID && vote.level > (input.buildingLevels.get(vote.uid) ?? 0);
    }) ? DEFENSE_FIXINGS_STEP : 0;
}

/**
 * État de la ville au début de la journée pour le calcul du gain réel de défense.
 * @param {DayInput} input Entrée de la journée.
 * @returns {DefenseGainContext} Contexte.
 */
function defenseGainContext(input: DayInput): DefenseGainContext {
    const built_before: Set<string> = new Set<string>();
    input.progress.forEach((progress: BuildingProgress, id: number): void => {
        const uid: string | undefined = input.buildings.get(id)?.uid;
        if (progress.built && uid !== undefined) {
            built_before.add(uid);
        }
    });
    return { builtBefore: built_before, factors: input.defenseFactors, defenseItemIds: input.defenseItemIds, upgrades: input.upgrades, baseDefense: input.baseDefense };
}

/**
 * Chantiers à construire qui ne sont pas terminés dans la journée.
 * @param {DayInput} input Entrée de la journée.
 * @param {readonly number[]} completed_ids Chantiers terminés dans la journée.
 * @returns {BuildingRef[]} Chantiers.
 */
function pendingBuildings(input: DayInput, completed_ids: readonly number[]): BuildingRef[] {
    const pending: BuildingRef[] = [];
    input.progress.forEach((progress: BuildingProgress, id: number): void => {
        const building: BuildingRef | undefined = input.buildings.get(id);
        if (building !== undefined && !progress.built && !completed_ids.includes(id)) {
            pending.push(building);
        }
    });
    return pending;
}

/**
 * Valeurs à reporter au jour suivant : avancement, niveau d'atelier (vote du soir), BDE et défense de départ.
 * @param {DayEvaluation} evaluation Évaluation du jour qui se termine.
 * @param {DayInput} input Entrée du jour qui se termine.
 * @returns {CarriedState} État de départ du lendemain.
 */
export function advanceDay(evaluation: DayEvaluation, input: DayInput): CarriedState {
    const votes: EveningVote[] = [evaluation.vote, evaluation.secondVote].filter((vote: EveningVote | null): vote is EveningVote => vote !== null);
    const voted_workshop: boolean = votes.some((vote: EveningVote): boolean => vote.uid === WORKSHOP_UID);
    const slavery_built: boolean = builtInEvening(evaluation.progressAfter, input.buildings, SLAVERY_UID);
    const completed_temporary_def: number = evaluation.completedIds.reduce(
        (sum: number, id: number): number => sum + (input.buildings.get(id)?.temporary === true ? (input.buildings.get(id)?.defence ?? 0) : 0),
        0
    );
    const night: { progress: Map<number, BuildingProgress>; defLost: number } = passNight(evaluation.progressAfter, input.buildings);
    const levels: Map<string, number> = new Map<string, number>(input.buildingLevels);
    votes.forEach((vote: EveningVote): void => {
        levels.set(vote.uid, vote.level);
    });
    const destroyed_def: number = destroyBuildings(evaluation.losses, night.progress, levels, input.buildings);
    return {
        progress: night.progress,
        workshopLevel: Math.min(WORKSHOP_MAX_LEVEL, input.workshopLevel + (voted_workshop ? 1 : 0)),
        hasSlavery: input.hasSlavery || slavery_built,
        // Un bonus perdu cette nuit revient le lendemain ; un chantier détruit cette nuit ne compte plus.
        baseDefense: evaluation.projectedDefense - (input.temporaryDefense + completed_temporary_def) - night.defLost
            + lossTotal(evaluation.losses, 'bonus') - destroyed_def,
        temporaryDefense: 0,
        defenseFactors: evaluation.defenseFactorsAfter,
        buildingLevels: levels
    };
}

/**
 * Chantiers détruits pendant l'attaque : redeviennent à construire, perdent leur niveau d'évolution (modifie l'avancement et
 * les niveaux en place). Un chantier que la nuit a déjà fait tomber n'est pas compté deux fois.
 * @param {PlannedLoss[]} losses Pertes évaluées.
 * @param {Map<number, BuildingProgress>} progress Avancement au lever du jour suivant.
 * @param {Map<string, number>} levels Niveaux d'évolution.
 * @param {ReadonlyMap<number, BuildingRef>} buildings Chantiers.
 * @returns {number} Défense retirée.
 */
function destroyBuildings(losses: PlannedLoss[], progress: Map<number, BuildingProgress>, levels: Map<string, number>, buildings: ReadonlyMap<number, BuildingRef>): number {
    let removed: number = 0;
    for (const loss of losses) {
        const current: BuildingProgress | undefined = progress.get(loss.buildingId);
        const uid: string | undefined = buildings.get(loss.buildingId)?.uid;
        if (loss.kind !== 'destroyed' || current?.built !== true) {
            continue;
        }
        removed += loss.defense;
        progress.set(loss.buildingId, { ...current, built: false, invested: 0, life: 0, def: 0 });
        if (uid !== undefined) {
            levels.delete(uid);
        }
    }
    return removed;
}

/**
 * Avancement au lever du jour suivant : les chantiers temporaires ont disparu, le réacteur et les feux d'artifice ont perdu
 * leurs PV propres (pire cas). Les dégâts aléatoires de l'attaque en Pandémonium ne sont pas projetés.
 * @param {ReadonlyMap<number, BuildingProgress>} progress Avancement en fin de journée.
 * @param {ReadonlyMap<number, BuildingRef>} buildings Chantiers.
 * @returns {{ progress: Map<number, BuildingProgress>; defLost: number }} Avancement du lendemain et défense perdue.
 */
function passNight(progress: ReadonlyMap<number, BuildingProgress>, buildings: ReadonlyMap<number, BuildingRef>): { progress: Map<number, BuildingProgress>; defLost: number } {
    const next: Map<number, BuildingProgress> = new Map<number, BuildingProgress>(progress);
    let def_lost: number = 0;
    progress.forEach((current: BuildingProgress, id: number): void => {
        const building: BuildingRef | undefined = buildings.get(id);
        if (building === undefined || !current.built) {
            return;
        }
        if (building.temporary) {
            next.set(id, { ...current, built: false, invested: 0, life: 0, def: 0 });
            return;
        }
        const loss: number = ownNightLoss(building.uid);
        if (loss === 0) {
            return;
        }
        const life: number = Math.max(0, current.life - loss);
        const def: number = life === 0 || current.maxLife <= 0 ? 0 : Math.round((current.defMax * life) / current.maxLife);
        def_lost += current.def - def;
        next.set(id, life === 0 ? { ...current, built: false, invested: 0, life: 0, def: 0 } : { ...current, life, def });
    });
    return { progress: next, defLost: def_lost };
}

/**
 * Évalue des journées consécutives : chaque jour part de l'état laissé par le précédent. Les entrées ne sont pas modifiées.
 * @param {DayInput[]} inputs Journées dans l'ordre ; seules celles du premier jour portent l'état initial.
 * @returns {DayEvaluation[]} Une évaluation par journée.
 */
export function evaluateDays(inputs: DayInput[]): DayEvaluation[] {
    const evaluations: DayEvaluation[] = [];
    let carried: CarriedState | null = null;
    for (const input of inputs) {
        const effective: DayInput = carried === null ? input : { ...input, ...carried, progress: withDayCosts(carried.progress, input.progress) };
        const evaluation: DayEvaluation = evaluateDay(effective);
        evaluations.push(evaluation);
        carried = advanceDay(evaluation, effective);
    }
    return evaluations;
}

/**
 * Avancement reporté, où un chantier non construit et sans PA investis reprend le coût calculé pour le jour (niveau de plan de sa proposition).
 * @param {ReadonlyMap<number, BuildingProgress>} carried Avancement de fin de veille.
 * @param {ReadonlyMap<number, BuildingProgress>} day Avancement calculé pour le jour.
 * @returns {Map<number, BuildingProgress>} Avancement de départ du jour.
 */
function withDayCosts(carried: ReadonlyMap<number, BuildingProgress>, day: ReadonlyMap<number, BuildingProgress>): Map<number, BuildingProgress> {
    const merged: Map<number, BuildingProgress> = new Map<number, BuildingProgress>(carried);
    carried.forEach((progress: BuildingProgress, id: number): void => {
        const own: BuildingProgress | undefined = day.get(id);
        if (own !== undefined && !progress.built && progress.invested === 0) {
            merged.set(id, { ...progress, paCurrent: own.paCurrent });
        }
    });
    return merged;
}

/**
 * Coût en PA des étapes d'une poche.
 * @param {StepResult[]} results Résultats des étapes.
 * @param {PlanPool} pool Poche.
 * @returns {number} Somme des PA dépensés.
 */
function costOf(results: StepResult[], pool: PlanPool): number {
    return results.filter((result: StepResult): boolean => result.pool === pool).reduce((sum: number, result: StepResult): number => sum + result.paCost, 0);
}

/**
 * PA cumulés de tâches.
 * @param {PlanTaskDTO[]} tasks Tâches.
 * @returns {number} Somme des PA.
 */
function tasksPa(tasks: PlanTaskDTO[]): number {
    return tasks.reduce((sum: number, task: PlanTaskDTO): number => sum + task.pa, 0);
}

/**
 * Tâches « maison » du plan avec le citoyen concerné.
 * @param {BuildingPlanContentDTO} content Contenu du plan.
 * @param {CitizenRef[]} citizens Citoyens connus.
 * @returns {{ citizen: CitizenRef | undefined; level: number }[]} Tâches de montée de niveau de maison.
 */
function homeTasks(content: BuildingPlanContentDTO, citizens: CitizenRef[]): { citizen: CitizenRef | undefined; level: number }[] {
    const tasks: { citizen: CitizenRef | undefined; level: number }[] = [];
    for (const entry of content.citizens) {
        for (const task of entry.tasks) {
            if (task.kind === 'home' && task.level !== undefined && task.level !== null) {
                tasks.push({ citizen: citizens.find((candidate: CitizenRef): boolean => candidate.userId === entry.userId), level: task.level });
            }
        }
    }
    return tasks;
}

/**
 * Niveaux de maison au coût de la ville : PA et ressources Urbanisme quand le Plan d'urbanisme est construit.
 * @param {ReadonlyMap<number, HomeLevelRef>} homes Niveaux du référentiel.
 * @param {boolean} urbanism Plan d'urbanisme construit.
 * @returns {ReadonlyMap<number, HomeLevelRef>} Niveaux dont `ap` et `resources` sont ceux à payer.
 */
export function homeCosts(homes: ReadonlyMap<number, HomeLevelRef>, urbanism: boolean): ReadonlyMap<number, HomeLevelRef> {
    if (!urbanism) {
        return homes;
    }
    return new Map<number, HomeLevelRef>(Array.from(homes, ([level, home]: [number, HomeLevelRef]): [number, HomeLevelRef] =>
        [level, { ...home, ap: home.apUrbanism, resources: home.resourcesUrbanism }]));
}

/**
 * Niveau actuel d'un citoyen pour un élément de maison.
 * @param {CitizenRef | undefined} citizen Citoyen.
 * @param {string | null} upgrade_key Clé `HomeEnum` de l'amélioration ; nulle pour le niveau d'habitation.
 * @returns {number | null} Niveau, nul s'il est inconnu.
 */
export function currentHomeLevel(citizen: CitizenRef | undefined, upgrade_key: string | null): number | null {
    if (citizen === undefined) {
        return null;
    }
    if (upgrade_key === null) {
        return citizen.homeLevel;
    }
    return citizen.upgradeLevels === null ? null : citizen.upgradeLevels.get(upgrade_key) ?? 0;
}

/**
 * Ressources des travaux de maison du plan (agrandissements et améliorations), comptées sur la banque comme les chantiers :
 * tous les niveaux entre le niveau actuel du citoyen et le plus haut niveau visé pour chaque élément.
 * @param {BuildingPlanContentDTO} content Contenu du plan.
 * @param {DayInput} input Entrée de la journée.
 * @param {boolean} urbanism Plan d'urbanisme construit en début de journée.
 * @returns {ResourceCount[][]} Ressources de chaque niveau à payer, connu du référentiel.
 */
function homeWorkResources(content: BuildingPlanContentDTO, input: DayInput, urbanism: boolean): ResourceCount[][] {
    const homes: ReadonlyMap<number, HomeLevelRef> = homeCosts(input.homes, urbanism);
    const resources: ResourceCount[][] = [];
    for (const entry of content.citizens) {
        // Plus haut niveau visé par élément : clé nulle = habitation, sinon clé de l'amélioration.
        const targets: Map<string | null, number> = new Map<string | null, number>();
        for (const task of entry.tasks) {
            const key: string | null | undefined = homeWorkKey(task);
            if (key !== undefined && task.level !== undefined && task.level !== null) {
                targets.set(key, Math.max(targets.get(key) ?? 0, task.level));
            }
        }
        const citizen: CitizenRef | undefined = input.citizens.find((candidate: CitizenRef): boolean => candidate.userId === entry.userId);
        targets.forEach((target: number, key: string | null): void => {
            for (const level of cascadeLevels(currentHomeLevel(citizen, key), target)) {
                resources.push((key === null ? homes.get(level)?.resources : input.homeUpgrades.get(key)?.get(level)) ?? []);
            }
        });
    }
    return resources;
}

/**
 * Élément de maison visé par une consigne.
 * @param {PlanTaskDTO} task Consigne.
 * @returns {string | null | undefined} Nul pour un agrandissement, clé de l'amélioration, absent pour une autre consigne.
 */
function homeWorkKey(task: PlanTaskDTO): string | null | undefined {
    if (task.kind === 'home') {
        return null;
    }
    return task.kind === 'homeUpgrade' && typeof task.ref === 'string' ? task.ref : undefined;
}

/**
 * Défense de maison brute gagnée par les montées de niveau (avant le pourcentage compté par la ville) ; 0 quand le niveau actuel
 * du citoyen est inconnu.
 * @param {{ citizen: CitizenRef | undefined; level: number }[]} tasks Tâches de maison.
 * @param {ReadonlyMap<number, HomeLevelRef>} homes Référentiel indexé par niveau.
 * @returns {number} Défense ajoutée.
 */
function homesDefense(tasks: { citizen: CitizenRef | undefined; level: number }[], homes: ReadonlyMap<number, HomeLevelRef>): number {
    let total: number = 0;
    for (const task of tasks) {
        const current_level: number | null = task.citizen?.homeLevel ?? null;
        const target: HomeLevelRef | undefined = homes.get(task.level);
        const current: HomeLevelRef | undefined = current_level === null ? undefined : homes.get(current_level);
        if (target !== undefined && current !== undefined) {
            total += Math.max(0, target.def - current.def);
        }
    }
    return total;
}

/**
 * Défense restaurée par les réparations de la journée.
 * @param {StepResult[]} results Résultats des étapes.
 * @param {ReadonlyMap<number, BuildingProgress>} before Avancement avant la journée.
 * @param {ReadonlyMap<number, BuildingProgress>} after Avancement après la journée.
 * @returns {number} Défense gagnée.
 */
function repairsDefense(results: StepResult[], before: ReadonlyMap<number, BuildingProgress>, after: ReadonlyMap<number, BuildingProgress>): number {
    const repaired: Set<number> = new Set<number>(
        results.filter((result: StepResult): boolean => result.step.kind === 'repair').map((result: StepResult): number => result.step.buildingId)
    );
    let total: number = 0;
    repaired.forEach((id: number): void => {
        total += Math.max(0, (after.get(id)?.def ?? 0) - (before.get(id)?.def ?? 0));
    });
    return total;
}

/**
 * Seuil gratuit des chantiers qui restent à construire.
 * @param {DayInput} input Entrée de la journée.
 * @returns {Map<number, number>} PA à laisser par chantier.
 */
function freeThresholds(input: DayInput): Map<number, number> {
    const thresholds: Map<number, number> = new Map<number, number>();
    input.progress.forEach((progress: BuildingProgress, id: number): void => {
        if (!progress.built && remainingAp(progress, input.workshopLevel) > 0) {
            thresholds.set(id, freeThreshold(progress.paCurrent, input.workshopLevel));
        }
    });
    return thresholds;
}

/**
 * Éléments comparés par le classement déf/PA, à leur défense réelle : chantiers à construire, niveaux de maison (au pourcentage
 * compté par la ville), sources de défense.
 * @param {DayInput} input Entrée de la journée.
 * @param {DefenseGainContext} context État de la ville.
 * @returns {RankCandidate[]} Candidats à défense strictement positive.
 */
function rankCandidates(input: DayInput, context: DefenseGainContext): RankCandidate[] {
    const candidates: RankCandidate[] = [];
    input.progress.forEach((progress: BuildingProgress, id: number): void => {
        const building: BuildingRef | undefined = input.buildings.get(id);
        const gain: number = building === undefined || progress.built ? 0 : buildingDefenseGain(building, context, input.buildings);
        if (building !== undefined && gain > 0) {
            candidates.push({ label: building.label, kind: 'building', def: gain, pa: remainingAp(progress, input.workshopLevel), resources: building.resources });
        }
    });
    const home_factor: number = homeDefenseFactor(context.builtBefore.has(CIRCULAR_QUARTERS_UID)) * input.defenseFactors.scale;
    homeCosts(input.homes, context.builtBefore.has(URBANISM_UID)).forEach((home: HomeLevelRef): void => {
        const gain: number = (home.def - (input.homes.get(home.level - 1)?.def ?? 0)) * home_factor;
        if (home.level >= 1 && gain > 0) {
            candidates.push({ label: home.label, kind: 'home', def: gain, pa: home.ap, resources: home.resources });
        }
    });
    for (const source of input.content.defenseSources) {
        if (source.def * source.qty > 0) {
            candidates.push({ label: source.label, kind: 'source', def: source.def * source.qty, pa: source.pa * source.qty, resources: [] });
        }
    }
    return candidates;
}
