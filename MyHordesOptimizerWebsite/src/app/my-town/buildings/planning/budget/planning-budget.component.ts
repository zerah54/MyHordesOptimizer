import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { dailyActionAp, DailyActionEnum } from '../../../../_abstract_model/enum/daily-action.enum';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenChipComponent } from '../../../../_shared/citizen-chip/citizen-chip.component';
import { CitizenCapacity } from '../budget.util';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { PlanningCitizenFiltersComponent } from '../citizen-filters/planning-citizen-filters.component';
import { HomeUpgradeRef } from '../home-upgrades.util';
import { BuildingPlanContentDTO, PlanCitizenDTO, PlanPool, PlanTaskDTO, PlanTaskKind, PlanTownLineDTO } from '../plan.types';
import { CitizenRef, HomeLevelRef } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { toInt, toNonNegativeInt } from '../planning-input.util';
import { newTaskId } from '../task-id.util';
import { homeLevelOf } from '../task-status.util';

const angular_common: Imports = [FormsModule];
const material_modules: Imports = [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatTooltipModule];

/**
 * Entrée d'un citoyen dans le contenu, créée à la demande.
 * @param {BuildingPlanContentDTO} content Contenu du plan.
 * @param {number} user_id Identifiant du citoyen.
 * @returns {PlanCitizenDTO} Entrée du citoyen.
 */
function entryFor(content: BuildingPlanContentDTO, user_id: number): PlanCitizenDTO {
    let entry: PlanCitizenDTO | undefined = content.citizens.find((candidate: PlanCitizenDTO): boolean => candidate.userId === user_id);
    if (entry === undefined) {
        entry = { userId: user_id, tasks: [] };
        content.citizens.push(entry);
    }
    return entry;
}

/**
 * PA d'un niveau d'amélioration du référentiel.
 * @param {HomeUpgradeRef} upgrade Amélioration.
 * @param {number} level Niveau visé.
 * @returns {number} PA (0 si le niveau est inconnu).
 */
function upgradeAp(upgrade: HomeUpgradeRef, level: number): number {
    return upgrade.levels.find((candidate: { level: number; ap: number }): boolean => candidate.level === level)?.ap ?? 0;
}

/** Onglet « Budget » : capacité de chaque citoyen, consignes individuelles, lignes ville et reste par poche. */
@Component({
    selector: 'mho-planning-budget',
    templateUrl: './planning-budget.component.html',
    styleUrls: ['./planning-budget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules, CitizenChipComponent, PlanningCitizenFiltersComponent]
})
export class PlanningBudgetComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly filters: CitizenFiltersStore = inject(CitizenFiltersStore);

    /** Citoyens retenus par les filtres partagés avec le Suivi. */
    protected readonly shown_citizens: Signal<CitizenRef[]> = computed((): CitizenRef[] => {
        const shown: ReadonlySet<number> = this.filters.shown_user_ids();
        return this.store.citizens().filter((citizen: CitizenRef): boolean => shown.has(citizen.userId));
    });



    /** Niveaux de maison proposés pour une tâche « maison », triés. */
    protected homeLevels(): HomeLevelRef[] {
        return Array.from(this.store.homes().values()).filter((home: HomeLevelRef): boolean => home.level >= 1).sort((a: HomeLevelRef, b: HomeLevelRef): number => a.level - b.level);
    }

    /**
     * Capacité calculée d'un citoyen.
     * @param {number} user_id Identifiant du citoyen.
     * @returns {CitizenCapacity | undefined} Capacité, absente si le plan n'est pas évalué.
     */
    protected capacity(user_id: number): CitizenCapacity | undefined {
        return this.store.evaluation()?.capacities.find((candidate: CitizenCapacity): boolean => candidate.userId === user_id);
    }

    /**
     * PA d'expédition d'un citoyen.
     * @param {number} user_id Identifiant du citoyen.
     * @returns {number} PA (0 sans expédition).
     */
    protected expeditionPa(user_id: number): number {
        return this.store.evaluation()?.expeditionPa.get(user_id) ?? 0;
    }

    /**
     * Saisie d'un citoyen dans le plan.
     * @param {CitizenRef} citizen Citoyen.
     * @returns {PlanCitizenDTO | undefined} Saisie, absente si le citoyen n'a rien de saisi.
     */
    protected entry(citizen: CitizenRef): PlanCitizenDTO | undefined {
        return this.store.draft()?.citizens.find((candidate: PlanCitizenDTO): boolean => candidate.userId === citizen.userId);
    }

    /**
     * PA de base effectifs d'un citoyen (valeur propre ou par défaut du plan).
     * @param {CitizenRef} citizen Citoyen.
     * @returns {number} PA de base.
     */
    protected basePa(citizen: CitizenRef): number {
        return this.entry(citizen)?.basePaOverride ?? this.store.draft()?.basePa ?? 0;
    }

    /**
     * Applique les PA de base par défaut après un court délai.
     * @param {unknown} value Valeur saisie.
     */
    protected onDefaultPa(value: unknown): void {
        const pa: number = toNonNegativeInt(value);
        this.store.deferEdit('default-pa', (content: BuildingPlanContentDTO): void => {
            content.basePa = pa;
        });
    }

    /**
     * Applique les PA de base propres à un citoyen après un court délai.
     * @param {number} user_id Identifiant du citoyen.
     * @param {unknown} value Valeur saisie.
     */
    protected onBasePa(user_id: number, value: unknown): void {
        const pa: number = toNonNegativeInt(value);
        this.store.deferEdit(`base-pa:${user_id}`, (content: BuildingPlanContentDTO): void => {
            entryFor(content, user_id).basePaOverride = pa;
        });
    }

    /**
     * Citoyen complet (métier, maison) correspondant à une ligne.
     * @param {number} user_id Identifiant du citoyen.
     * @returns {Citizen | undefined} Citoyen, absent s'il n'est plus connu.
     */
    protected fullCitizen(user_id: number): Citizen | undefined {
        return this.store.citizens_full().find((citizen: Citizen): boolean => citizen.id === user_id);
    }

    /**
     * Actions de chantier proposables pour une consigne : celles des chantiers construits ce jour, plus l'action déjà choisie.
     * @param {PlanTaskDTO} task Consigne.
     * @returns {DailyActionEnum[]} Actions, dans l'ordre du référentiel.
     */
    protected actionOptions(task: PlanTaskDTO): DailyActionEnum[] {
        const available: Set<string> = new Set<string>(this.store.displayable_actions().map((action: DailyActionEnum): string => action.key));
        return DailyActionEnum.getAllValues<DailyActionEnum>()
            .filter((action: DailyActionEnum): boolean => action.value.building !== undefined && (available.has(action.key) || action.key === task.ref));
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
     * Ajoute une consigne libre à un citoyen.
     * @param {number} user_id Identifiant du citoyen.
     */
    protected addTask(user_id: number): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            entryFor(content, user_id).tasks.push({ id: newTaskId(), kind: 'free', label: '', pa: 0 });
        });
    }

    /**
     * Choisit l'action de chantier d'une consigne ; PA selon le métier du citoyen.
     * @param {number} user_id Identifiant du citoyen.
     * @param {number} index Rang de la consigne.
     * @param {string} key Clé de l'action.
     */
    protected setTaskAction(user_id: number, index: number, key: string): void {
        const action: DailyActionEnum | undefined = DailyActionEnum.getByKey<DailyActionEnum>(key);
        const pa: number = action === undefined ? 0 : dailyActionAp(action, this.fullCitizen(user_id)?.job?.key ?? null);
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            const task: PlanTaskDTO = entryFor(content, user_id).tasks[index];
            task.ref = key;
            task.pa = pa;
        });
    }

    /**
     * Choisit l'amélioration d'une consigne : niveau suivant celui du citoyen, PA de ce niveau.
     * @param {number} user_id Identifiant du citoyen.
     * @param {number} index Rang de la consigne.
     * @param {string} key Clé `HomeEnum` de l'amélioration.
     */
    protected setTaskUpgrade(user_id: number, index: number, key: string): void {
        const upgrade: HomeUpgradeRef | undefined = this.store.home_upgrades().find((candidate: HomeUpgradeRef): boolean => candidate.key === key);
        if (upgrade === undefined) {
            return;
        }
        const citizen: Citizen | undefined = this.fullCitizen(user_id);
        const current: number = citizen === undefined ? 0 : homeLevelOf(citizen, key);
        const level: number = Math.min(current + 1, upgrade.max_level);
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            const task: PlanTaskDTO = entryFor(content, user_id).tasks[index];
            task.ref = key;
            task.level = level;
            task.pa = upgradeAp(upgrade, level);
            delete task.label;
        });
    }

    /**
     * Choisit le niveau visé d'une amélioration ; PA de ce niveau.
     * @param {number} user_id Identifiant du citoyen.
     * @param {number} index Rang de la consigne.
     * @param {number} level Niveau visé.
     */
    protected setTaskUpgradeLevel(user_id: number, index: number, level: number): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            const task: PlanTaskDTO = entryFor(content, user_id).tasks[index];
            const upgrade: HomeUpgradeRef | undefined = this.upgradeOf(task);
            task.level = level;
            if (upgrade !== undefined) {
                task.pa = upgradeAp(upgrade, level);
            }
        });
    }

    /**
     * Supprime une tâche d'un citoyen.
     * @param {number} user_id Identifiant du citoyen.
     * @param {number} index Rang de la tâche.
     */
    protected removeTask(user_id: number, index: number): void {
        this.store.flushEdits();
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            entryFor(content, user_id).tasks.splice(index, 1);
        });
    }

    /**
     * Change la nature d'une tâche ; le niveau n'a de sens que pour une tâche « maison ».
     * @param {number} user_id Identifiant du citoyen.
     * @param {number} index Rang de la tâche.
     * @param {PlanTaskKind} kind Nouvelle nature.
     */
    protected setTaskKind(user_id: number, index: number, kind: PlanTaskKind): void {
        const current: PlanTaskDTO | undefined = this.store.draft()?.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === user_id)?.tasks[index];
        if (kind === 'action' && (current === undefined || this.actionOptions(current).length === 0)) {
            return;
        }
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            const task: PlanTaskDTO = entryFor(content, user_id).tasks[index];
            task.kind = kind;
            delete task.level;
            delete task.ref;
            if (kind === 'action') {
                delete task.label;
            }
        });
        const task: PlanTaskDTO | undefined = this.store.draft()?.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === user_id)?.tasks[index];
        if (kind === 'action' && task !== undefined) {
            const first: DailyActionEnum | undefined = this.actionOptions(task)[0];
            if (first !== undefined) {
                this.setTaskAction(user_id, index, first.key);
            }
        } else if (kind === 'homeUpgrade') {
            const first: HomeUpgradeRef | undefined = this.store.home_upgrades()[0];
            if (first !== undefined) {
                this.setTaskUpgrade(user_id, index, first.key);
            }
        }
    }

    /**
     * Choisit le niveau de maison visé ; le coût proposé est celui du référentiel.
     * @param {number} user_id Identifiant du citoyen.
     * @param {number} index Rang de la tâche.
     * @param {number} level Niveau de maison.
     */
    protected setTaskLevel(user_id: number, index: number, level: number): void {
        const home: HomeLevelRef | undefined = this.store.homes().get(level);
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            const task: PlanTaskDTO = entryFor(content, user_id).tasks[index];
            task.level = level;
            if (home !== undefined) {
                task.pa = home.ap;
            }
        });
    }

    /**
     * Applique le libellé d'une tâche après un court délai.
     * @param {number} user_id Identifiant du citoyen.
     * @param {number} index Rang de la tâche.
     * @param {string} value Libellé saisi.
     */
    protected onTaskLabel(user_id: number, index: number, value: string): void {
        this.store.deferEdit(`task-label:${user_id}:${index}`, (content: BuildingPlanContentDTO): void => {
            const task: PlanTaskDTO | undefined = entryFor(content, user_id).tasks[index];
            if (task !== undefined) {
                task.label = value;
            }
        });
    }

    /**
     * Applique le coût d'une tâche après un court délai.
     * @param {number} user_id Identifiant du citoyen.
     * @param {number} index Rang de la tâche.
     * @param {unknown} value Valeur saisie.
     */
    protected onTaskPa(user_id: number, index: number, value: unknown): void {
        const pa: number = toNonNegativeInt(value);
        this.store.deferEdit(`task-pa:${user_id}:${index}`, (content: BuildingPlanContentDTO): void => {
            const task: PlanTaskDTO | undefined = entryFor(content, user_id).tasks[index];
            if (task !== undefined) {
                task.pa = pa;
            }
        });
    }

    /** Ajoute une ligne ville vide, côté non-bannis. */
    protected addLine(): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.townLines.push({ label: '', pool: 'regular', pa: 0 });
        });
    }

    /**
     * Supprime une ligne ville.
     * @param {number} index Rang de la ligne.
     */
    protected removeLine(index: number): void {
        this.store.flushEdits();
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.townLines.splice(index, 1);
        });
    }

    /**
     * Change la poche d'une ligne ville.
     * @param {number} index Rang de la ligne.
     * @param {PlanPool} pool Poche.
     */
    protected setLinePool(index: number, pool: PlanPool): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            content.townLines[index].pool = pool;
        });
    }

    /**
     * Applique le libellé d'une ligne ville après un court délai.
     * @param {number} index Rang de la ligne.
     * @param {string} value Libellé saisi.
     */
    protected onLineLabel(index: number, value: string): void {
        this.store.deferEdit(`line-label:${index}`, (content: BuildingPlanContentDTO): void => {
            const line: PlanTownLineDTO | undefined = content.townLines[index];
            if (line !== undefined) {
                line.label = value;
            }
        });
    }

    /**
     * Applique les PA d'une ligne ville (négatifs permis) après un court délai.
     * @param {number} index Rang de la ligne.
     * @param {unknown} value Valeur saisie.
     */
    protected onLinePa(index: number, value: unknown): void {
        const pa: number = toInt(value);
        this.store.deferEdit(`line-pa:${index}`, (content: BuildingPlanContentDTO): void => {
            const line: PlanTownLineDTO | undefined = content.townLines[index];
            if (line !== undefined) {
                line.pa = pa;
            }
        });
    }
}
