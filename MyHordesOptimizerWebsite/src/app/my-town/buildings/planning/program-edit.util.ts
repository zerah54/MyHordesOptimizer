import { BuildingProgress } from './building-progress.util';
import { BuildingPlanContentDTO, isBuildingStep, PlanCitizenDTO, PlanItemDTO, PlanLossDTO, PlanPool, PlanStepDTO, PlanStepMode, PlanTaskDTO } from './plan.types';

/** Ce qu'il faut savoir des chantiers pour cocher dans l'arbre : parents, avancement au début du jour, pertes de PV la nuit. */
export interface ToggleContext {
    parents: ReadonlyMap<number, number | null>;
    progress: ReadonlyMap<number, BuildingProgress>;
    nightLoss: ReadonlyMap<number, number>;
}

/**
 * Vrai si une étape de la liste porte sur ce chantier.
 * @param {readonly PlanItemDTO[]} items Éléments d'un programme.
 * @param {number} building_id Chantier.
 * @returns {boolean} Vrai si le chantier est planifié.
 */
export function hasBuilding(items: readonly PlanItemDTO[], building_id: number): boolean {
    return items.some((item: PlanItemDTO): boolean => isBuildingStep(item) && item.buildingId === building_id);
}

/**
 * Étape ajoutée en cochant un chantier : terminer s'il n'est pas construit ; sinon réparer pour passer la nuit
 * s'il peut perdre des PV, entièrement sinon.
 * @param {number} building_id Chantier.
 * @param {ToggleContext} context Avancement et pertes de la nuit.
 * @returns {PlanStepDTO} Étape par défaut.
 */
export function defaultStep(building_id: number, context: ToggleContext): PlanStepDTO {
    if (context.progress.get(building_id)?.built !== true) {
        return { buildingId: building_id, kind: 'build', mode: 'finish', targetRemaining: 0 };
    }
    const mode: PlanStepMode = (context.nightLoss.get(building_id) ?? 0) > 0 ? 'survive' : 'finish';
    return { buildingId: building_id, kind: 'repair', mode, targetRemaining: 0 };
}

/**
 * Un chantier se coche s'il reste à construire ou s'il a des dégâts à réparer ; un chantier déjà au programme se décoche toujours.
 * @param {BuildingPlanContentDTO} content Copie de travail.
 * @param {PlanPool} pool Section.
 * @param {number} building_id Chantier.
 * @param {ToggleContext} context Avancement au début du jour.
 * @returns {boolean} Vrai si la case est utilisable.
 */
export function canToggleBuilding(content: BuildingPlanContentDTO, pool: PlanPool, building_id: number, context: ToggleContext): boolean {
    if (hasBuilding(content.programs[pool], building_id)) {
        return true;
    }
    const progress: BuildingProgress | undefined = context.progress.get(building_id);
    return progress?.built !== true || progress.life < progress.maxLife;
}

/**
 * Coche ou décoche un chantier dans une section. Cocher l'ajoute en fin de section, précédé de ses ancêtres non construits
 * et absents des deux sections ; décocher retire toutes ses étapes de la section.
 * @param {BuildingPlanContentDTO} content Copie de travail (modifiée).
 * @param {PlanPool} pool Section.
 * @param {number} building_id Chantier.
 * @param {ToggleContext} context Parents, avancement et pertes de la nuit.
 */
export function toggleBuilding(content: BuildingPlanContentDTO, pool: PlanPool, building_id: number, context: ToggleContext): void {
    const items: PlanItemDTO[] = content.programs[pool];
    if (hasBuilding(items, building_id)) {
        content.programs[pool] = items.filter((item: PlanItemDTO): boolean => !isBuildingStep(item) || item.buildingId !== building_id);
        return;
    }
    if (!canToggleBuilding(content, pool, building_id, context)) {
        return;
    }
    const added: number[] = [...missingAncestors(content, building_id, context), building_id];
    items.push(...added.map((id: number): PlanStepDTO => defaultStep(id, context)));
}

/**
 * Ancêtres à ajouter avant un chantier : non construits et absents des deux sections, racine d'abord.
 * @param {BuildingPlanContentDTO} content Copie de travail.
 * @param {number} building_id Chantier.
 * @param {ToggleContext} context Parents et avancement.
 * @returns {number[]} Identifiants, du plus ancien au parent direct.
 */
function missingAncestors(content: BuildingPlanContentDTO, building_id: number, context: ToggleContext): number[] {
    const chain: number[] = [];
    const visited: Set<number> = new Set<number>([building_id]);
    let parent_id: number | null = context.parents.get(building_id) ?? null;
    while (parent_id !== null && !visited.has(parent_id)) {
        visited.add(parent_id);
        const built: boolean = context.progress.get(parent_id)?.built === true;
        const planned: boolean = hasBuilding(content.programs.banned, parent_id) || hasBuilding(content.programs.regular, parent_id);
        if (!built && !planned) {
            chain.unshift(parent_id);
        }
        parent_id = context.parents.get(parent_id) ?? null;
    }
    return chain;
}

/** Position d'un élément dans les programmes. */
export interface ItemPosition {
    pool: PlanPool;
    index: number;
}

/**
 * Étape de chantier à une position, ou rien.
 * @param {BuildingPlanContentDTO} content Copie de travail.
 * @param {ItemPosition} position Position.
 * @returns {PlanStepDTO | undefined} Étape.
 */
function stepAt(content: BuildingPlanContentDTO, position: ItemPosition): PlanStepDTO | undefined {
    const item: PlanItemDTO | undefined = content.programs[position.pool][position.index];
    return item !== undefined && isBuildingStep(item) ? item : undefined;
}

/**
 * Change le mode d'une étape ; seule « laisser à N » garde une cible (entier ≥ 0).
 * @param {BuildingPlanContentDTO} content Copie de travail (modifiée).
 * @param {ItemPosition} position Étape.
 * @param {PlanStepMode} mode Nouveau mode.
 * @param {number} target Cible du mode `leave`.
 */
export function setStepMode(content: BuildingPlanContentDTO, position: ItemPosition, mode: PlanStepMode, target: number = 0): void {
    const step: PlanStepDTO | undefined = stepAt(content, position);
    if (step === undefined) {
        return;
    }
    step.mode = mode;
    step.targetRemaining = mode === 'leave' ? Math.max(0, Math.floor(target)) : 0;
}

/**
 * Note d'une étape ; vide = pas de note.
 * @param {BuildingPlanContentDTO} content Copie de travail (modifiée).
 * @param {ItemPosition} position Étape.
 * @param {string} note Texte saisi.
 */
export function setStepNote(content: BuildingPlanContentDTO, position: ItemPosition, note: string): void {
    const step: PlanStepDTO | undefined = stepAt(content, position);
    if (step !== undefined) {
        step.note = note.trim() === '' ? null : note;
    }
}

/**
 * Ajoute une consigne en fin de section ; un texte vide est ignoré.
 * @param {BuildingPlanContentDTO} content Copie de travail (modifiée).
 * @param {PlanPool} pool Section.
 * @param {string} text Texte de la consigne.
 */
export function addInstruction(content: BuildingPlanContentDTO, pool: PlanPool, text: string): void {
    const trimmed: string = text.trim();
    if (trimmed !== '') {
        content.programs[pool].push({ kind: 'instruction', text: trimmed });
    }
}

/**
 * Modifie le texte d'une consigne (les étapes de chantier sont ignorées).
 * @param {BuildingPlanContentDTO} content Copie de travail (modifiée).
 * @param {ItemPosition} position Consigne.
 * @param {string} text Texte saisi.
 */
export function setInstructionText(content: BuildingPlanContentDTO, position: ItemPosition, text: string): void {
    const item: PlanItemDTO | undefined = content.programs[position.pool][position.index];
    if (item !== undefined && !isBuildingStep(item)) {
        item.text = text;
    }
}

/**
 * Retire un élément.
 * @param {BuildingPlanContentDTO} content Copie de travail (modifiée).
 * @param {ItemPosition} position Élément.
 */
export function removeItem(content: BuildingPlanContentDTO, position: ItemPosition): void {
    content.programs[position.pool].splice(position.index, 1);
}

/**
 * Déplace un élément, dans sa section ou vers l'autre (rang cible borné à la longueur de la liste).
 * @param {BuildingPlanContentDTO} content Copie de travail (modifiée).
 * @param {ItemPosition} from Position actuelle.
 * @param {ItemPosition} to Position voulue.
 */
export function moveItem(content: BuildingPlanContentDTO, from: ItemPosition, to: ItemPosition): void {
    const [item]: PlanItemDTO[] = content.programs[from.pool].splice(from.index, 1);
    if (item === undefined) {
        return;
    }
    const target: PlanItemDTO[] = content.programs[to.pool];
    target.splice(Math.min(Math.max(0, to.index), target.length), 0, item);
}

/**
 * Niveau de plan estimé d'un chantier ; 0 retire l'entrée.
 * @param {BuildingPlanContentDTO} content Copie de travail (modifiée).
 * @param {number} building_id Chantier.
 * @param {0 | 1 | 2} tier Niveau.
 */
export function setPlanTier(content: BuildingPlanContentDTO, building_id: number, tier: 0 | 1 | 2): void {
    const tiers: Record<string, number> = { ...content.planTiers };
    if (tier === 0) {
        delete tiers[String(building_id)];
    } else {
        tiers[String(building_id)] = tier;
    }
    content.planTiers = tiers;
}

/**
 * Consignes du jour ; vide = aucune.
 * @param {BuildingPlanContentDTO} content Copie de travail (modifiée).
 * @param {string} text Texte saisi.
 */
export function setInstructions(content: BuildingPlanContentDTO, text: string): void {
    content.instructions = text.trim() === '' ? null : text;
}

/**
 * Élément prêt à l'envoi : consigne rognée (nulle si vide), note rognée (nulle si vide).
 * @param {PlanItemDTO} item Élément.
 * @returns {PlanItemDTO | null} Élément nettoyé, nul pour une consigne vide.
 */
function sanitizeItem(item: PlanItemDTO): PlanItemDTO | null {
    if (!isBuildingStep(item)) {
        const text: string = item.text.trim();
        return text === '' ? null : { kind: 'instruction', text };
    }
    if (item.note === undefined) {
        return { ...item };
    }
    const note: string = (item.note ?? '').trim();
    return { ...item, note: note === '' ? null : note };
}

/**
 * Copie prête à l'envoi : consignes vides retirées (l'API les refuse), textes et notes rognés, vides → null.
 * @param {BuildingPlanContentDTO} content Copie de travail.
 * @returns {BuildingPlanContentDTO} Nouvelle copie nettoyée.
 */
export function sanitizeContent(content: BuildingPlanContentDTO): BuildingPlanContentDTO {
    const clean = (items: PlanItemDTO[]): PlanItemDTO[] => items
        .map(sanitizeItem)
        .filter((item: PlanItemDTO | null): item is PlanItemDTO => item !== null);
    const instructions: string = (content.instructions ?? '').trim();
    // L'API refuse deux pertes identiques (même chantier, même type) : on garde la première.
    const loss_keys: Set<string> = new Set<string>();
    const losses: PlanLossDTO[] = (content.losses ?? []).filter((loss: PlanLossDTO): boolean => {
        const key: string = `${loss.buildingId}|${loss.kind}`;
        if (loss_keys.has(key)) {
            return false;
        }
        loss_keys.add(key);
        return true;
    });
    return {
        ...content,
        citizens: content.citizens.map((citizen: PlanCitizenDTO): PlanCitizenDTO => ({
            ...citizen,
            tasks: citizen.tasks.filter((task: PlanTaskDTO): boolean => task.kind !== 'action' || (typeof task.ref === 'string' && task.ref !== ''))
        })),
        instructions: instructions === '' ? null : instructions,
        losses,
        programs: { banned: clean(content.programs.banned), regular: clean(content.programs.regular) }
    };
}
