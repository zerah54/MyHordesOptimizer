import { saveHomeField } from '../api/building-plans';
import { getCitizens } from '../api/citizens';
import { saveDailyAction } from '../api/daily-actions';
import { DAILY_ACTION_LABELS } from '../data/daily-action-labels';
import { HOME_UPGRADES, HOUSE_LEVEL_KEY } from '../data/home-labels';
import type { ApiCitizen } from '../types';
import type { ApiBuildingPlan, ApiBuildingRef, PlanStep, PlanTask, TownBuildingState } from '../types/building-plan';
import { getI18N } from '../utils/i18n';
import {
    homeLevelOf,
    type ProgramItem,
    programItems,
    programText,
    stepDone,
    stepLabel,
    taskCheckKey,
    taskLocked,
    type TaskStatus,
    taskStatus,
    taskText,
    taskUpgrade
} from '../utils/my-program';
import { addError } from '../utils/notifications';

/** Données de l'onglet « Chantiers » de la fenêtre « Mon programme ». */
export interface BuildingsTabData {
    access_citizen: boolean;
    plan: ApiBuildingPlan | null;
    me: ApiCitizen | undefined;
    states: ReadonlyMap<number, TownBuildingState>;
    refs: ReadonlyMap<number, ApiBuildingRef>;
    day: number;
    house_editable: boolean;
    slavery_built: boolean;
}

/** Paragraphe de texte brut (le plan est saisi par les citoyens : jamais de HTML). */
function paragraph(text: string): HTMLParagraphElement {
    const p: HTMLParagraphElement = document.createElement('p');
    p.textContent = text;
    return p;
}

/** Section précédée de son titre. */
function section(title: string, content: HTMLElement): HTMLElement {
    const container: HTMLElement = document.createElement('section');
    const heading: HTMLHeadingElement = document.createElement('h3');
    heading.textContent = title;
    container.append(heading, content);
    return container;
}

/** Libellé d'un chantier, `#<id>` s'il est inconnu. */
function buildingName(refs: ReadonlyMap<number, ApiBuildingRef>, building_id: number): string {
    return getI18N(refs.get(building_id)?.label) ?? `#${building_id}`;
}

/** Mes consignes individuelles du plan, vides sans citoyen, sans plan ou absent du plan. */
function myTasks(data: BuildingsTabData): PlanTask[] {
    const me: ApiCitizen | undefined = data.me;
    if (!data.access_citizen || me === undefined || data.plan === null) return [];
    return data.plan.content.citizens.find((citizen: { userId: number; tasks: PlanTask[] }): boolean => citizen.userId === me.id)?.tasks ?? [];
}

/** Relit mon citoyen puis écrit le seul niveau visé, comme `TaskCheckService.writeUpgrade` du site (jamais une donnée périmée). */
async function writeHomeLevel(me: ApiCitizen, key: string, level: number, done: boolean, as_boolean: boolean): Promise<void> {
    const response: { citizens: ApiCitizen[] } = await getCitizens(true);
    const fresh: ApiCitizen | undefined = response.citizens.find((citizen: ApiCitizen): boolean => citizen.id === me.id);
    if (fresh === undefined) throw new Error(`Citoyen ${me.id} absent de la relecture`);
    const current: number = homeLevelOf(fresh, key);
    const target: number = done ? Math.max(current, level) : Math.min(current, level - 1);
    if (target === current) return;
    try {
        await saveHomeField(key, as_boolean ? target >= 1 : target);
    } catch (error) {
        addError(error);
        throw error;
    }
}

/** Écrit l'état d'une consigne là où le site le lit ; rejette en cas d'échec (erreurs réseau déjà notifiées). */
export async function toggleTask(task: PlanTask, me: ApiCitizen, done: boolean, house_editable: boolean): Promise<void> {
    if (task.kind === 'action') {
        // La clé finit dans l'URL : seule une action connue est écrite, comme sur le site.
        if (typeof task.ref !== 'string' || !Object.hasOwn(DAILY_ACTION_LABELS, task.ref)) throw new Error(`Action inconnue : ${task.ref}`);
        return saveDailyAction(task.ref, done);
    }
    const upgrade: string | undefined = taskUpgrade(task);
    if (upgrade !== undefined) {
        return writeHomeLevel(me, upgrade, task.level ?? 1, done, HOME_UPGRADES[upgrade].max_lvl === 1);
    }
    if (task.kind === 'home' && typeof task.level === 'number' && house_editable) {
        return writeHomeLevel(me, HOUSE_LEVEL_KEY, task.level, done, false);
    }
    const check: string | null = taskCheckKey(task);
    if (check === null) throw new Error('Consigne sans identifiant');
    return saveDailyAction(check, done);
}

/** Ligne d'une consigne individuelle : case à cocher, libellé, repère « relevé en jeu ». */
function createTaskItem(task: PlanTask, me: ApiCitizen, data: BuildingsTabData, on_changed: () => void): HTMLLIElement {
    const status: TaskStatus = taskStatus(task, me, data.day);
    const item: HTMLLIElement = document.createElement('li');
    item.classList.toggle('done', status.done);
    const box: HTMLInputElement = document.createElement('input');
    box.type = 'checkbox';
    box.checked = status.done;
    box.disabled = taskLocked(task, status, data.house_editable) || (taskCheckKey(task) === null && status.source !== 'data');
    box.addEventListener('change', (): void => {
        const done: boolean = box.checked;
        box.disabled = true;
        toggleTask(task, me, done, data.house_editable).then((): void => {
            box.disabled = false;
            on_changed();
        }, (): void => {
            box.checked = !done;
            box.disabled = false;
        });
    });
    const label: HTMLLabelElement = document.createElement('label');
    label.append(box, taskText(task));
    item.appendChild(label);
    if (status.source === 'data') {
        const detected: HTMLSpanElement = document.createElement('span');
        detected.classList.add('mho-program-buildings-detected');
        detected.textContent = programText('detected');
        item.append(' ', detected);
    }
    return item;
}

/** Ligne du programme : étape (barrée et marquée si faite d'après l'état en base) ou consigne texte. */
function createProgramItem(program_item: ProgramItem, data: BuildingsTabData): HTMLLIElement {
    const item: HTMLLIElement = document.createElement('li');
    if (program_item.kind === 'instruction') {
        item.classList.add('instruction');
        item.textContent = program_item.text;
        return item;
    }
    const step: PlanStep = program_item.step;
    item.textContent = stepLabel(step, buildingName(data.refs, step.buildingId), data.refs.get(step.buildingId)?.maxLife ?? 0);
    const note: string = step.note?.trim() ?? '';
    if (note !== '') {
        const note_element: HTMLSpanElement = document.createElement('span');
        note_element.classList.add('note');
        note_element.textContent = ` — ${note}`;
        item.appendChild(note_element);
    }
    if (stepDone(step, data.states.get(step.buildingId)) === true) {
        item.classList.add('done');
        const mark: HTMLSpanElement = document.createElement('span');
        mark.classList.add('mho-program-buildings-check');
        mark.textContent = ' ✔';
        item.appendChild(mark);
    }
    return item;
}

/** Onglet Chantiers : consignes du jour, vote du soir, mes consignes individuelles cochables, programme des chantiers. */
export function createBuildingsTab(data: BuildingsTabData, on_changed: () => void): HTMLElement {
    const root: HTMLDivElement = document.createElement('div');
    root.classList.add('mho-program-buildings');
    const me: ApiCitizen | undefined = data.me;
    if (!data.access_citizen || me === undefined) {
        root.appendChild(paragraph(programText('not_citizen')));
        return root;
    }
    if (data.plan === null) {
        root.appendChild(paragraph(programText('no_plan')));
        return root;
    }
    const content: ApiBuildingPlan['content'] = data.plan.content;

    const instructions: string = content.instructions?.trim() ?? '';
    if (instructions !== '') {
        const text: HTMLParagraphElement = paragraph(instructions);
        text.style.whiteSpace = 'pre-line';
        root.appendChild(section(programText('day_instructions'), text));
    }

    const votes: number[] = [content.eveningVoteBuildingId, content.eveningSecondVoteBuildingId]
        .filter((building_id: number | null | undefined): building_id is number => typeof building_id === 'number');
    if (votes.length > 0) {
        const names: string = votes.map((building_id: number): string => buildingName(data.refs, building_id)).join(', ');
        root.appendChild(paragraph(`${programText(votes.length > 1 ? 'evening_votes' : 'evening_vote')} : ${names}`));
    }

    const tasks: PlanTask[] = myTasks(data);
    if (tasks.length > 0) {
        const list: HTMLUListElement = document.createElement('ul');
        tasks.forEach((task: PlanTask): void => {
            list.appendChild(createTaskItem(task, me, data, on_changed));
        });
        root.appendChild(section(programText('my_tasks'), list));
    }

    const items: ProgramItem[] = programItems(content, me.isShunned === true, data.slavery_built);
    if (items.length > 0) {
        const list: HTMLOListElement = document.createElement('ol');
        items.forEach((program_item: ProgramItem): void => {
            list.appendChild(createProgramItem(program_item, data));
        });
        root.appendChild(section(programText('program_steps'), list));
    }

    if (tasks.length === 0 && items.length === 0) {
        root.appendChild(paragraph(programText('nothing')));
    }
    return root;
}

/** « faites/total » de mes consignes individuelles, nul sans consigne (libellé de l'onglet). */
export function buildingsTabCount(data: BuildingsTabData): string | null {
    const tasks: PlanTask[] = myTasks(data);
    if (tasks.length === 0) return null;
    const done: number = tasks.filter((task: PlanTask): boolean => taskStatus(task, data.me, data.day).done).length;
    return `${done}/${tasks.length}`;
}
