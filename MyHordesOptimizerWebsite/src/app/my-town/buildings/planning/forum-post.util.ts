import { bannedPoolShown, CitizenCapacity } from './budget.util';
import { StepResult } from './building-progress.util';
import { BuildingPlanContentDTO, isBuildingStep, PlanCitizenDTO, PlanItemDTO, PlanPool, PlanTaskDTO } from './plan.types';
import { BuildingRef, CitizenRef, DayEvaluation, HomeLevelRef, PlannedLoss } from './plan-evaluation.util';
import { ratioLabel, stepLabel, taskLabel } from './planning-labels.util';

/** Taille maximale d'un message généré : sous la limite du jeu (16 384 caractères) pour garder de la marge. */
export const FORUM_POST_LIMIT: number = 16000;

/** Place réservée au préfixe « (i/n) » d'un message découpé. */
const PREFIX_RESERVE: number = 16;

/** Nombre de lignes du classement déf/PA reprises dans le post budget. */
const RANKING_LINES: number = 5;

/** Tout ce qu'il faut pour rédiger les posts d'un jour. */
export interface PostContext {
    day: number;
    plan_name: string;
    content: BuildingPlanContentDTO;
    evaluation: DayEvaluation;
    buildings: ReadonlyMap<number, BuildingRef>;
    citizens: CitizenRef[];
    homes: ReadonlyMap<number, HomeLevelRef>;
    item_label: (item_id: number) => string;
    website_url: string;
    /** Emote du métier de chaque joueur (`:scav:`…), placée devant chacun de ses pseudos ; un joueur absent n'en a pas. */
    job_emotes: ReadonlyMap<number, string>;
}

/**
 * Mention d'un joueur ; le nom est nettoyé des caractères hors lettres, chiffres, tiret et souligné.
 * @param {string} name Nom du citoyen.
 * @param {number} user_id Identifiant du joueur.
 * @returns {string} Mention `@nom:id`.
 */
export function mention(name: string, user_id: number): string {
    const clean: string = name.replace(/[^\p{L}\d_-]/gu, '');
    return `@${clean === '' ? 'joueur' : clean}:${user_id}`;
}

/**
 * Découpe des blocs de texte en messages qui respectent la limite du forum. Un bloc trop long est coupé aux sauts de
 * ligne ; un `[collapse]` coupé est refermé puis rouvert dans chaque message. Plusieurs messages sont numérotés `(i/n)`.
 * @param {string[]} blocks Blocs dans l'ordre ; les blocs vides sont ignorés.
 * @param {number} limit Taille maximale d'un message.
 * @returns {string[]} Messages à publier.
 */
export function splitForum(blocks: string[], limit: number = FORUM_POST_LIMIT): string[] {
    const room: number = limit - PREFIX_RESERVE;
    const pieces: string[] = blocks.filter((block: string): boolean => block.trim() !== '').flatMap((block: string): string[] => fitBlock(block, room));
    const messages: string[] = [];
    let current: string = '';
    for (const piece of pieces) {
        if (current === '') {
            current = piece;
        } else if (current.length + 2 + piece.length <= room) {
            current += `\n\n${piece}`;
        } else {
            messages.push(current);
            current = piece;
        }
    }
    if (current !== '') {
        messages.push(current);
    }
    return messages.length <= 1 ? messages : messages.map((message: string, index: number): string => `(${index + 1}/${messages.length})\n${message}`);
}

/**
 * Post « budget » : détail du budget, du plan, de la défense et des ressources, pour en discuter.
 * @param {PostContext} context Données du jour.
 * @returns {string[]} Messages à publier.
 */
export function budgetPost(context: PostContext): string[] {
    const blocks: string[] = [
        $localize`[big][b][i]Budget J${context.day}:day: — ${context.plan_name}:name:[/i][/b][/big]`,
        collapse($localize`Budget`, budgetLines(context)),
        collapse($localize`Plan`, planLines(context)),
        collapse($localize`Défense`, defenseLines(context)),
        collapse($localize`Ressources`, resourceLines(context)),
        footer($localize`Vous pouvez retrouver ce plan en suivant`, `${context.website_url}my-town/buildings`)
    ];
    return splitForum(blocks);
}

/**
 * Post « programme » : consignes personnelles regroupées par ensemble identique, puis chantiers dans l'ordre.
 * @param {PostContext} context Données du jour.
 * @param {boolean} [ping] Vrai : les citoyens sont mentionnés (notifiés) ; faux : pseudos simples, pour une relecture entre leads.
 * @returns {string[]} Messages à publier.
 */
export function programPost(context: PostContext, ping: boolean = true): string[] {
    const blocks: string[] = [
        $localize`[big][b]Programme chantiers · J${context.day}:day:[/b][/big]`,
        dayInstructions(context),
        collapse($localize`Consignes individuelles`, [instructionGroups(context, ping)]),
        `[b]${$localize`Programme chantiers dans l'ordre`}[/b]\n${orderedProgram(context)}`,
        defenseSummary(context),
        lossBlock(context),
        voteLine(context, true),
        footer($localize`Votre programme du jour et vos consignes individuelles à cocher sont consultables en suivant`, `${context.website_url}my-town/program`)
    ];
    return splitForum(blocks);
}

/**
 * Entoure des lignes d'un `[collapse]`.
 * @param {string} title Titre du bloc replié.
 * @param {string[]} lines Lignes du bloc.
 * @returns {string} Bloc complet.
 */
function collapse(title: string, lines: string[]): string {
    return `[collapse=${title}]\n${lines.join('\n')}\n[/collapse]`;
}

/**
 * Pied de message avec un lien vers le site.
 * @param {string} sentence Début de phrase qui introduit le lien.
 * @param {string} url Adresse du lien.
 * @returns {string} Bloc `[aparte]`.
 */
function footer(sentence: string, url: string): string {
    return `[aparte]${$localize`Ce message a été généré à partir du site MyHordes Optimizer.`} ${sentence} [link=${url}]${$localize`ce lien`}[/link][/aparte]`;
}

/**
 * Découpe un bloc plus long que la place disponible.
 * @param {string} block Bloc à découper.
 * @param {number} room Taille maximale d'un morceau.
 * @returns {string[]} Morceaux qui tiennent dans la place disponible.
 */
function fitBlock(block: string, room: number): string[] {
    if (block.length <= room) {
        return [block];
    }
    const folded: RegExpExecArray | null = /^\[collapse=([^\]]*)\]\n([\s\S]*)\n\[\/collapse\]$/.exec(block);
    if (folded === null) {
        return chunkLines(block, room);
    }
    const open: string = `[collapse=${folded[1]}]`;
    const overhead: number = open.length + '\n\n[/collapse]'.length;
    return chunkLines(folded[2], room - overhead).map((chunk: string): string => `${open}\n${chunk}\n[/collapse]`);
}

/**
 * Regroupe des lignes en morceaux de taille limitée ; une ligne trop longue est coupée.
 * @param {string} text Texte à découper.
 * @param {number} size Taille maximale d'un morceau.
 * @returns {string[]} Morceaux.
 */
function chunkLines(text: string, size: number): string[] {
    const lines: string[] = text.split('\n').flatMap((line: string): string[] => {
        const slices: string[] = [];
        for (let start: number = 0; start < line.length; start += size) {
            slices.push(line.slice(start, start + size));
        }
        return slices.length === 0 ? [''] : slices;
    });
    const chunks: string[] = [];
    let current: string = '';
    for (const line of lines) {
        if (current === '') {
            current = line;
        } else if (current.length + 1 + line.length <= size) {
            current += `\n${line}`;
        } else {
            chunks.push(current);
            current = line;
        }
    }
    chunks.push(current);
    return chunks;
}

/**
 * Pseudo (ou mention) précédé de l'emote du métier du joueur, quand elle est connue.
 * @param {PostContext} context Contexte du post.
 * @param {number} user_id Joueur.
 * @param {string} text Pseudo ou mention.
 * @returns {string} Texte précédé de l'emote.
 */
function withJobEmote(context: PostContext, user_id: number, text: string): string {
    const job_emote: string | undefined = context.job_emotes.get(user_id);
    return job_emote === undefined ? text : `${job_emote} ${text}`;
}

/** Libellé d'un chantier ; `#id` s'il est introuvable. */
function buildingLabel(context: PostContext, building_id: number): string {
    return context.buildings.get(building_id)?.label ?? `#${building_id}`;
}

/** Nombre signé : `+40`, `-2`, `0`. */
function signed(value: number): string {
    return value > 0 ? `+${value}` : `${value}`;
}

/** Libellé d'une poche. */
function poolLabel(pool: PlanPool): string {
    return pool === 'regular' ? $localize`Non-bannis` : $localize`Bannis`;
}

/** Vrai si le post distingue les poches : poche des bannis affichée sur la proposition. */
function showsPools(context: PostContext): boolean {
    return bannedPoolShown(context.content, context.citizens, context.evaluation.hasSlavery);
}

/** Poches à rédiger, dans l'ordre d'exécution. */
function postPools(context: PostContext): PlanPool[] {
    return showsPools(context) ? ['banned', 'regular'] : ['regular'];
}

/** Lignes du bloc « Budget » : capacité des citoyens, lignes ville, total par poche et alertes. */
function budgetLines(context: PostContext): string[] {
    const lines: string[] = [];
    for (const pool of postPools(context)) {
        const budget: DayEvaluation['budgets'][PlanPool] = context.evaluation.budgets[pool];
        if (showsPools(context)) {
            lines.push(`[b]${poolLabel(pool)}[/b]`);
        }
        lines.push(`:middot: ${$localize`Citoyens`} : ${budget.citizenCapacity} :ap:`);
        for (const line of context.content.townLines.filter((candidate: { pool: PlanPool }): boolean => candidate.pool === pool)) {
            lines.push(`:middot: ${line.label === '' ? '—' : line.label} : ${signed(line.pa)} :ap:`);
        }
        const warning: string = budget.remaining < 0 ? ' :warning:' : '';
        lines.push(`${$localize`Budget`} : ${budget.budget} :ap: · ${$localize`Coût`} : ${budget.cost} :ap: · ${$localize`Reste`} : ${budget.remaining} :ap:${warning}`);
    }
    for (const capacity of context.evaluation.capacities.filter((candidate: CitizenCapacity): boolean => candidate.overCommitted)) {
        const name: string = context.citizens.find((citizen: CitizenRef): boolean => citizen.userId === capacity.userId)?.name ?? `#${capacity.userId}`;
        lines.push(`:warning: ${withJobEmote(context, capacity.userId, name)} : ${$localize`tâches et expédition au-delà des PA de base`}`);
    }
    return lines;
}

/**
 * Texte d'une étape selon son mode, suivi de sa note éventuelle.
 * @param {PostContext} context Contexte du post.
 * @param {StepResult} result Étape évaluée.
 * @returns {string} Texte de l'étape.
 */
function stepAction(context: PostContext, result: StepResult): string {
    const text: string = stepLabel(buildingLabel(context, result.step.buildingId), result, context.buildings.get(result.step.buildingId)?.maxLife ?? 0);
    const note: string = (result.step.note ?? '').trim();
    return note === '' ? text : `${text} — [i]${note}[/i]`;
}

/**
 * Défense projetée par le plan et défense visée (attaque moins débordement autorisé).
 * @param {PostContext} context Contexte du post.
 * @returns {string} Ligne.
 */
function defenseSummary(context: PostContext): string {
    const target: string = context.evaluation.target === null ? '?' : String(context.evaluation.target);
    return `[b]${$localize`Défense`}[/b] : ${context.evaluation.projectedDefense} / ${target} (${$localize`projetée / visée`})`;
}

/**
 * Ligne d'une perte prévue cette nuit.
 * @param {PostContext} context Contexte du post.
 * @param {PlannedLoss} loss Perte comptée par l'évaluation.
 * @returns {string} Ligne.
 */
function lossLine(context: PostContext, loss: PlannedLoss): string {
    const label: string = buildingLabel(context, loss.buildingId);
    return loss.kind === 'destroyed'
        ? `:middot: ${label} : ${$localize`laissé détruire, ne pas réparer`} (−${loss.defense} ${$localize`dès demain`})`
        : `:middot: ${label} : ${$localize`bonus d'évolution perdu`} (−${loss.defense} ${$localize`cette nuit`})`;
}

/**
 * Bloc des pertes prévues cette nuit (post programme), vide sans perte.
 * @param {PostContext} context Contexte du post.
 * @returns {string} Bloc, ou chaîne vide.
 */
function lossBlock(context: PostContext): string {
    if (context.evaluation.losses.length === 0) {
        return '';
    }
    return [`:warning: [b]${$localize`Pertes prévues cette nuit`}[/b]`, ...context.evaluation.losses.map((loss: PlannedLoss): string => lossLine(context, loss))].join('\n');
}

/**
 * Ligne du chantier à voter ce soir, vide sans vote.
 * @param {PostContext} context Contexte du post.
 * @param {boolean} bold Titre en gras (post programme) ou simple (bloc Plan).
 * @returns {string} Ligne, ou chaîne vide.
 */
function voteLine(context: PostContext, bold: boolean): string {
    const vote: number | null = context.content.eveningVoteBuildingId;
    if (vote === null) {
        return '';
    }
    const title: string = $localize`Évolution votée ce soir`;
    return `:fortify: ${bold ? `[b]${title}[/b]` : title} : ${buildingLabel(context, vote)}`;
}

/** Lignes du bloc « Plan » : vote du soir, puis étapes de chaque poche avec leur coût. */
function planLines(context: PostContext): string[] {
    const vote: string = voteLine(context, false);
    if (context.evaluation.results.length === 0) {
        return vote === '' ? [$localize`Aucune étape.`] : [$localize`Aucune étape.`, vote];
    }
    const lines: string[] = [];
    if (vote !== '') {
        lines.push(vote);
    }
    for (const pool of postPools(context)) {
        const results: StepResult[] = context.evaluation.results.filter((result: StepResult): boolean => result.pool === pool);
        if (results.length === 0) {
            continue;
        }
        if (showsPools(context)) {
            lines.push(`[b]${poolLabel(pool)}[/b]`);
        }
        for (const result of results) {
            const warning: string = result.issues.length > 0 ? ' :warning:' : '';
            lines.push(`:middot: ${stepAction(context, result)} → ${result.paCost} :ap:${warning}`);
        }
    }
    return lines;
}

/** Lignes du bloc « Défense » : objectif, projection, écart et meilleurs rapports déf/coût. */
function defenseLines(context: PostContext): string[] {
    const evaluation: DayEvaluation = context.evaluation;
    const unknown: string = $localize`inconnue`;
    const lines: string[] = [
        `:middot: ${$localize`Attaque`} : ${evaluation.attack ?? unknown}`,
        `:middot: ${$localize`Débordement autorisé`} : ${context.content.allowedOverflow}`,
        `:middot: ${$localize`Cible`} : ${evaluation.target ?? unknown}`,
        `:middot: ${$localize`Défense projetée`} : ${evaluation.projectedDefense}`
    ];
    if (evaluation.defenseGap !== null) {
        lines.push(evaluation.defenseGap > 0
            ? `:middot: ${$localize`Reste à couvrir`} : ${evaluation.defenseGap}`
            : `:middot: ${$localize`Surplus`} : ${Math.abs(evaluation.defenseGap)}`);
    }
    if (evaluation.losses.length > 0) {
        lines.push(`[b]${$localize`Pertes prévues cette nuit`}[/b]`, ...evaluation.losses.map((loss: PlannedLoss): string => lossLine(context, loss)));
    }
    if (evaluation.ranking.length > 0) {
        lines.push(`[b]${$localize`Meilleurs rapports défense / coût`}[/b]`);
        for (const candidate of evaluation.ranking.slice(0, RANKING_LINES)) {
            lines.push(`:middot: ${candidate.label} : ${ratioLabel(candidate.ratio)}`);
        }
    }
    return lines;
}

/** Lignes du bloc « Ressources » : besoin des chantiers terminés et des maisons, et manques. */
function resourceLines(context: PostContext): string[] {
    const evaluation: DayEvaluation = context.evaluation;
    if (evaluation.needs.size === 0) {
        return [$localize`Aucune ressource nécessaire.`];
    }
    const gaps: Map<number, number> = new Map<number, number>(evaluation.missing.map((resource: { itemId: number; count: number }): [number, number] => [resource.itemId, resource.count]));
    const lines: string[] = Array.from(evaluation.needs.entries())
        .map(([item_id, need]: [number, number]): { label: string; need: number; gap: number } => ({ label: context.item_label(item_id), need, gap: gaps.get(item_id) ?? 0 }))
        .sort((a: { label: string }, b: { label: string }): number => a.label.localeCompare(b.label))
        .map((row: { label: string; need: number; gap: number }): string =>
            `:middot: ${row.label} × ${row.need}${row.gap > 0 ? ` — ${$localize`manque`} ${row.gap} :warning:` : ''}`);
    if (evaluation.missing.length === 0) {
        lines.push($localize`La banque couvre tout.`);
    }
    return lines;
}

/** Libellé d'une tâche personnelle, avec son coût quand il n'est pas nul. */
function taskLine(context: PostContext, task: PlanTaskDTO): string {
    const cost: string = task.pa > 0 ? ` (${task.pa} :ap:)` : '';
    const icon: string = task.kind === 'home' || task.kind === 'homeUpgrade' ? ':home:' : ':middot:';
    return `${icon} ${taskLabel(task, context.homes)}${cost}`;
}

/**
 * Consignes individuelles : une ligne de citoyens par ensemble de tâches identique, suivie de ces tâches.
 * @param {PostContext} context Contexte du post.
 * @param {boolean} ping Vrai : mentions `@pseudo:id` séparées par une espace ; faux : pseudos simples séparés par une virgule.
 * @returns {string} Bloc des consignes.
 */
function instructionGroups(context: PostContext, ping: boolean): string {
    const groups: Map<string, { tasks: PlanTaskDTO[]; mentions: string[] }> = new Map<string, { tasks: PlanTaskDTO[]; mentions: string[] }>();
    for (const entry of context.content.citizens.filter((candidate: PlanCitizenDTO): boolean => candidate.tasks.length > 0)) {
        const citizen: CitizenRef | undefined = context.citizens.find((candidate: CitizenRef): boolean => candidate.userId === entry.userId);
        if (citizen === undefined) {
            continue;
        }
        const key: string = JSON.stringify(entry.tasks.map((task: PlanTaskDTO): unknown[] => [task.kind, task.ref ?? null, task.level ?? null, task.count ?? null, task.label ?? '', task.pa]));
        const group: { tasks: PlanTaskDTO[]; mentions: string[] } = groups.get(key) ?? { tasks: entry.tasks, mentions: [] };
        group.mentions.push(withJobEmote(context, citizen.userId, ping ? mention(citizen.name, citizen.userId) : citizen.name));
        groups.set(key, group);
    }
    if (groups.size === 0) {
        return $localize`Aucune consigne individuelle.`;
    }
    return Array.from(groups.values())
        .map((group: { tasks: PlanTaskDTO[]; mentions: string[] }): string =>
            [group.mentions.join(ping ? ' ' : ', '), ...group.tasks.map((task: PlanTaskDTO): string => taskLine(context, task))].join('\n'))
        .join('\n\n');
}

/** Bloc « Consignes du jour », vide (donc omis) sans consigne. */
function dayInstructions(context: PostContext): string {
    const text: string = (context.content.instructions ?? '').trim();
    return text === '' ? '' : `[b]${$localize`Consignes du jour`}[/b]\n${text}`;
}

/** Programme des chantiers dans l'ordre d'exécution (bannis puis non-bannis), consignes intercalées. */
function orderedProgram(context: PostContext): string {
    const lines: string[] = [];
    for (const pool of postPools(context)) {
        const items: PlanItemDTO[] = context.content.programs[pool];
        if (items.length === 0) {
            continue;
        }
        if (showsPools(context)) {
            lines.push(`:arrowright: [b]${poolLabel(pool)}[/b]`);
        }
        if (pool === 'banned' && context.evaluation.hasSlavery) {
            lines.push($localize`Investissez vos PA par paires de PA pour ne rien perdre.`);
        }
        items.forEach((item: PlanItemDTO, index: number): void => {
            if (!isBuildingStep(item)) {
                if (item.text.trim() !== '') {
                    lines.push(`» [i]${item.text.trim()}[/i]`);
                }
                return;
            }
            const result: StepResult | undefined = context.evaluation.results.find((candidate: StepResult): boolean => candidate.pool === pool && candidate.index === index);
            if (result !== undefined) {
                lines.push(`:middot: ${stepAction(context, result)}`);
            }
        });
    }
    return lines.length === 0 ? $localize`Aucune étape.` : lines.join('\n');
}

