import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { dailyActionAp, DailyActionEnum, dailyActionMaxUses } from '../../../../_abstract_model/enum/daily-action.enum';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { HeroSkillLevels } from '../../../../_abstract_model/types/hero-skill-levels';
import { cascadeAp, HomeUpgradeRef, reachableHomeLevels } from '../home-upgrades.util';
import { BuildingPlanContentDTO, PlanCitizenDTO, PlanTaskDTO, PlanTaskKind } from '../plan.types';
import { CitizenRef, currentHomeLevel, HomeLevelRef } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { toNonNegativeInt } from '../planning-input.util';
import { actionDefaults, entryFor, plannableActions, upgradeAp, upgradeDefaults } from '../task-edit.util';

const angular_common: Imports = [FormsModule];
const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatTooltipModule];

/**
 * Range le nombre d'utilisations d'une consigne d'action : seulement s'il dépasse 1 (absent = une utilisation).
 * @param {PlanTaskDTO} task Consigne modifiée en place.
 * @param {number} count Utilisations prévues.
 */
function setTaskCountField(task: PlanTaskDTO, count: number): void {
    if (count > 1) {
        task.count = count;
    } else {
        delete task.count;
    }
}

/** Réglages d'une consigne individuelle : type, niveau, amélioration, action, nombre, PA ; suppression. */
@Component({
    selector: 'mho-planning-task-editor',
    templateUrl: './planning-task-editor.component.html',
    styleUrls: ['./planning-task-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules]
})
export class PlanningTaskEditorComponent {

    /** Citoyen de la consigne. */
    public readonly userId: InputSignal<number> = input.required<number>();
    /** Rang de la consigne dans celles du citoyen, quand elle n'a pas d'identifiant. */
    public readonly index: InputSignal<number> = input.required<number>();
    /** Identifiant de la consigne : la retrouve même si d'autres consignes sont ajoutées ou retirées entre-temps. */
    public readonly taskId: InputSignal<string | null> = input<string | null>(null);

    protected readonly store: PlanningStore = inject(PlanningStore);

    /** Consigne éditée, absente si elle n'existe plus. */
    protected readonly task: Signal<PlanTaskDTO | undefined> = computed((): PlanTaskDTO | undefined => {
        const tasks: PlanTaskDTO[] = this.store.draft()?.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === this.userId())?.tasks ?? [];
        return tasks[this.position(tasks)];
    });

    /**
     * Clic dans l'éditeur : retenu pour que le menu qui le contient reste ouvert, sauf « Supprimer » qui le referme.
     * @param {MouseEvent} event Clic.
     */
    protected onClick(event: MouseEvent): void {
        if ((event.target as Element | null)?.closest('[data-action="remove-task"]') === null) {
            event.stopPropagation();
        }
    }

    /**
     * Touche dans l'éditeur : retenue pour que le menu ne la prenne pas pour sa navigation, sauf Échap et Tab qui le referment.
     * @param {KeyboardEvent} event Touche.
     */
    protected onKeydown(event: KeyboardEvent): void {
        if (event.key !== 'Escape' && event.key !== 'Tab') {
            event.stopPropagation();
        }
    }

    /**
     * Niveaux de maison proposés pour une tâche « maison » : ceux que le citoyen peut atteindre, plus celui déjà choisi ; triés.
     * @param {PlanTaskDTO} task Consigne.
     * @returns {HomeLevelRef[]} Niveaux.
     */
    protected homeLevels(task: PlanTaskDTO): HomeLevelRef[] {
        const homes: HomeLevelRef[] = Array.from(this.store.homes().values())
            .filter((home: HomeLevelRef): boolean => home.level >= 1)
            .sort((a: HomeLevelRef, b: HomeLevelRef): number => a.level - b.level);
        const reachable: Set<number> = new Set<number>(reachableHomeLevels(
            homes.map((home: HomeLevelRef): number => home.level), currentHomeLevel(this.citizenRef(), null), this.store.unlimited_home_levels()
        ));
        return homes.filter((home: HomeLevelRef): boolean => reachable.has(home.level) || home.level === task.level);
    }

    /**
     * Actions proposables pour une consigne : celles de l'outil Chantiers disponibles ce jour, plus l'action déjà choisie.
     * @param {PlanTaskDTO} task Consigne.
     * @returns {DailyActionEnum[]} Actions, dans l'ordre du référentiel.
     */
    protected actionOptions(task: PlanTaskDTO): DailyActionEnum[] {
        return plannableActions(this.store.displayable_actions(), task.ref ?? null);
    }

    /**
     * Amélioration choisie d'une consigne.
     * @param {PlanTaskDTO} task Consigne.
     * @returns {HomeUpgradeRef | undefined} Amélioration, absente au format libre.
     */
    protected upgradeOf(task: PlanTaskDTO): HomeUpgradeRef | undefined {
        return this.store.home_upgrades().find((upgrade: HomeUpgradeRef): boolean => upgrade.key === task.ref);
    }

    /**
     * Utilisations possibles dans la journée de l'action d'une consigne, pour le métier et les compétences du citoyen.
     * @param {PlanTaskDTO} task Consigne d'action.
     * @returns {number} Utilisations possibles (1 pour une action unique ou inconnue).
     */
    protected actionMaxUses(task: PlanTaskDTO): number {
        const action: DailyActionEnum | undefined = DailyActionEnum.getByKey<DailyActionEnum>(task.ref ?? '');
        return action === undefined ? 1 : dailyActionMaxUses(action, this.jobKey(), this.heroSkills());
    }

    /**
     * Choix proposés pour le nombre d'utilisations d'une action.
     * @param {number} max_uses Utilisations possibles.
     * @returns {number[]} De 1 au maximum.
     */
    protected useOptions(max_uses: number): number[] {
        return Array.from({ length: max_uses }, (_: unknown, index: number): number => index + 1);
    }

    /**
     * Change la nature de la consigne ; valeurs par défaut de la nouvelle nature (première action, première amélioration).
     * @param {PlanTaskKind} kind Nouvelle nature.
     */
    protected setTaskKind(kind: PlanTaskKind): void {
        const current: PlanTaskDTO | undefined = this.task();
        if (kind === 'action' && (current === undefined || this.actionOptions(current).length === 0)) {
            return;
        }
        this.edit((task: PlanTaskDTO): void => {
            task.kind = kind;
            delete task.level;
            delete task.ref;
            delete task.count;
            if (kind === 'action') {
                delete task.label;
            }
        });
        const task: PlanTaskDTO | undefined = this.task();
        if (kind === 'action' && task !== undefined) {
            const first: DailyActionEnum | undefined = this.actionOptions(task)[0];
            if (first !== undefined) {
                this.setTaskAction(first.key);
            }
        } else if (kind === 'homeUpgrade') {
            const first: HomeUpgradeRef | undefined = this.store.home_upgrades()[0];
            if (first !== undefined) {
                this.setTaskUpgrade(first.key);
            }
        }
    }

    /**
     * Choisit l'action de la consigne ; utilisations proposées pour le citoyen, PA en conséquence.
     * @param {string} key Clé de l'action.
     */
    protected setTaskAction(key: string): void {
        const action: DailyActionEnum | undefined = DailyActionEnum.getByKey<DailyActionEnum>(key);
        const values: Pick<PlanTaskDTO, 'ref' | 'pa' | 'count'> = action === undefined ? { ref: key, pa: 0 } : actionDefaults(action, this.jobKey(), this.heroSkills());
        this.edit((task: PlanTaskDTO): void => {
            task.ref = values.ref;
            task.pa = values.pa;
            setTaskCountField(task, values.count ?? 1);
        });
    }

    /**
     * Choisit le nombre d'utilisations de l'action ; PA recalculés.
     * @param {number} count Utilisations prévues.
     */
    protected setTaskCount(count: number): void {
        const job_key: string | null = this.jobKey();
        const hero_skills: HeroSkillLevels | null = this.heroSkills();
        this.edit((task: PlanTaskDTO): void => {
            const action: DailyActionEnum | undefined = DailyActionEnum.getByKey<DailyActionEnum>(task.ref ?? '');
            if (action === undefined) {
                return;
            }
            const uses: number = Math.min(dailyActionMaxUses(action, job_key, hero_skills), Math.max(1, count));
            task.pa = dailyActionAp(action, job_key, uses, hero_skills);
            setTaskCountField(task, uses);
        });
    }

    /**
     * Choisit l'amélioration de la consigne : niveau suivant celui du citoyen, PA des niveaux manquants.
     * @param {string} key Clé `HomeEnum` de l'amélioration.
     */
    protected setTaskUpgrade(key: string): void {
        const upgrade: HomeUpgradeRef | undefined = this.store.home_upgrades().find((candidate: HomeUpgradeRef): boolean => candidate.key === key);
        if (upgrade === undefined) {
            return;
        }
        const values: Pick<PlanTaskDTO, 'ref' | 'level' | 'pa'> = upgradeDefaults(upgrade, currentHomeLevel(this.citizenRef(), key));
        this.edit((task: PlanTaskDTO): void => {
            Object.assign(task, values);
            delete task.label;
        });
    }

    /**
     * Choisit le niveau visé de l'amélioration ; PA des niveaux manquants.
     * @param {number} level Niveau visé.
     */
    protected setTaskUpgradeLevel(level: number): void {
        const current: PlanTaskDTO | undefined = this.task();
        const upgrade: HomeUpgradeRef | undefined = current === undefined ? undefined : this.upgradeOf(current);
        const from: number | null = upgrade === undefined ? null : currentHomeLevel(this.citizenRef(), upgrade.key);
        this.edit((task: PlanTaskDTO): void => {
            task.level = level;
            if (upgrade !== undefined) {
                task.pa = cascadeAp((value: number): number => upgradeAp(upgrade, value), from, level);
            }
        });
    }

    /**
     * Choisit le niveau de maison visé ; le coût proposé est celui des niveaux manquants au référentiel.
     * @param {number} level Niveau de maison.
     */
    protected setTaskLevel(level: number): void {
        const homes: ReadonlyMap<number, HomeLevelRef> = this.store.homes();
        const pa: number = cascadeAp((value: number): number => homes.get(value)?.ap ?? 0, currentHomeLevel(this.citizenRef(), null), level);
        this.edit((task: PlanTaskDTO): void => {
            task.level = level;
            if (homes.has(level)) {
                task.pa = pa;
            }
        });
    }

    /**
     * Applique le libellé après un court délai.
     * @param {string} value Libellé saisi.
     */
    protected onTaskLabel(value: string): void {
        this.store.deferEdit(`task-label:${this.editKey()}`, this.mutation((task: PlanTaskDTO): void => {
            task.label = value;
        }));
    }

    /**
     * Applique le coût après un court délai.
     * @param {unknown} value Valeur saisie.
     */
    protected onTaskPa(value: unknown): void {
        const pa: number = toNonNegativeInt(value);
        this.store.deferEdit(`task-pa:${this.editKey()}`, this.mutation((task: PlanTaskDTO): void => {
            task.pa = pa;
        }));
    }

    /** Supprime la consigne. */
    protected removeTask(): void {
        const user_id: number = this.userId();
        this.store.flushEdits();
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            const tasks: PlanTaskDTO[] = entryFor(content, user_id).tasks;
            const position: number = this.position(tasks);
            if (position !== -1) {
                tasks.splice(position, 1);
            }
        });
    }

    /**
     * Modifie la consigne dans la copie de travail.
     * @param {(task: PlanTaskDTO) => void} mutate Modification.
     */
    private edit(mutate: (task: PlanTaskDTO) => void): void {
        this.store.updateDraft(this.mutation(mutate));
    }

    /**
     * Modification du contenu qui retrouve la consigne au moment où elle s'applique.
     * @param {(task: PlanTaskDTO) => void} mutate Modification de la consigne.
     * @returns {(content: BuildingPlanContentDTO) => void} Modification du contenu.
     */
    private mutation(mutate: (task: PlanTaskDTO) => void): (content: BuildingPlanContentDTO) => void {
        const user_id: number = this.userId();
        return (content: BuildingPlanContentDTO): void => {
            const tasks: PlanTaskDTO[] = entryFor(content, user_id).tasks;
            const task: PlanTaskDTO | undefined = tasks[this.position(tasks)];
            if (task !== undefined) {
                mutate(task);
            }
        };
    }

    /**
     * Rang de la consigne parmi celles du citoyen : par son identifiant s'il existe, sinon par son rang.
     * @param {readonly PlanTaskDTO[]} tasks Consignes du citoyen.
     * @returns {number} Rang, -1 si elle n'existe plus.
     */
    private position(tasks: readonly PlanTaskDTO[]): number {
        const id: string | null = this.taskId();
        if (id !== null) {
            return tasks.findIndex((task: PlanTaskDTO): boolean => task.id === id);
        }
        return this.index() < tasks.length ? this.index() : -1;
    }

    /**
     * Clé des modifications différées de la consigne.
     * @returns {string} Citoyen et identifiant (ou rang) de la consigne.
     */
    private editKey(): string {
        return `${this.userId()}:${this.taskId() ?? this.index()}`;
    }

    /**
     * Citoyen complet (métier, compétences).
     * @returns {Citizen | undefined} Citoyen, absent s'il n'est plus connu.
     */
    private fullCitizen(): Citizen | undefined {
        return this.store.citizens_full().find((citizen: Citizen): boolean => citizen.id === this.userId());
    }

    /**
     * Clé du métier du citoyen.
     * @returns {string | null} Clé `JobEnum`, nulle si inconnue.
     */
    private jobKey(): string | null {
        return this.fullCitizen()?.job?.key ?? null;
    }

    /**
     * Compétences héroïques du citoyen.
     * @returns {HeroSkillLevels | null} Niveaux, nuls si le citoyen est inconnu.
     */
    private heroSkills(): HeroSkillLevels | null {
        return this.fullCitizen()?.hero_skills ?? null;
    }

    /**
     * Citoyen retenu dans le budget.
     * @returns {CitizenRef | undefined} Citoyen, absent s'il est inconnu.
     */
    private citizenRef(): CitizenRef | undefined {
        return this.store.citizens().find((citizen: CitizenRef): boolean => citizen.userId === this.userId());
    }
}
