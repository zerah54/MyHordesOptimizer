import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { DailyActionEnum } from '../../../../_abstract_model/enum/daily-action.enum';
import { HomeEnum } from '../../../../_abstract_model/enum/home.enum';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { HomeWithValue } from '../../../../_abstract_model/types/home.class';
import { isHouseLevelEditable } from '../../../../_abstract_model/types/town-details.class';
import { getHomeIcon } from '../../../../_core/utilities/citizen.util';
import { getTown } from '../../../../_core/utilities/localstorage.util';
import { CitizenChipComponent } from '../../../../_shared/citizen-chip/citizen-chip.component';
import { IconApComponent } from '../../../../_shared/icon-ap/icon-ap.component';
import { CitizenCapacity } from '../budget.util';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { PlanningCitizenFiltersComponent } from '../citizen-filters/planning-citizen-filters.component';
import { HOME_COLUMNS, homeDone, homeHeaderIcon, homeOf, homeSummary } from '../home-columns.util';
import { cascadeAp, homeTaskIndex, HomeUpgradeRef, nextHomeTarget, upgradesAllowed } from '../home-upgrades.util';
import { BuildingPlanContentDTO, PlanCitizenDTO, PlanTaskDTO, PlanTaskKind } from '../plan.types';
import { CitizenRef, currentHomeLevel, HomeLevelRef } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { toNonNegativeInt } from '../planning-input.util';
import { actionDefaults, entryFor, plannableActions, upgradeAp, upgradeDefaults } from '../task-edit.util';
import { PlanningTaskEditorComponent } from '../task-editor/planning-task-editor.component';
import { newTaskId } from '../task-id.util';
import { taskLocked, TaskStatus } from '../task-status.util';
import { rowState, taskFilterKey, TrackingRow, TrackingState, TrackingTask } from '../tracking.util';

const angular_common: Imports = [FormsModule];
const material_modules: Imports = [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatTooltipModule];

/** Colonnes fixes du tableau : citoyen, PA de base, rab d'expé, consignes, capacité, état. */
const FIXED_COLUMNS: number = 6;

/**
 * Clé d'un élément de maison pour les consignes : nulle pour l'habitation, clé de l'amélioration sinon.
 * @param {HomeEnum} home Élément.
 * @returns {string | null} Clé.
 */
function homeKey(home: HomeEnum): string | null {
    return home.key === HomeEnum.HOUSE_LEVEL.key ? null : home.key;
}

/** Carte « Consignes » : PA de base, rab d'expé, saisie et suivi des consignes individuelles ; filtres partagés avec le Budget. */
@Component({
    selector: 'mho-planning-tracking',
    templateUrl: './planning-tracking.component.html',
    styleUrls: ['./planning-tracking.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules, CitizenChipComponent, IconApComponent, PlanningCitizenFiltersComponent, PlanningTaskEditorComponent]
})
export class PlanningTrackingComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly filters: CitizenFiltersStore = inject(CitizenFiltersStore);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly home_columns: readonly HomeEnum[] = HOME_COLUMNS;
    protected readonly expeditionTooltip: string = $localize`PA d'expédition :`;

    /** Nombre de colonnes du tableau, case de sélection comprise. */
    protected readonly column_count: Signal<number> = computed((): number => (this.store.can_edit() ? 1 : 0) + FIXED_COLUMNS + HOME_COLUMNS.length);

    /** Jour à venir : consignes sans statut (rien ne peut encore être fait). */
    protected readonly future: Signal<boolean> = computed((): boolean => this.store.selected_day() > this.store.current_day);

    /**
     * État affiché d'une ligne : celui de la consigne choisie, sinon celui du programme ; aucun sur un jour à venir.
     * @param {TrackingRow} row Ligne.
     * @returns {TrackingState} État.
     */
    protected shownState(row: TrackingRow): TrackingState {
        return this.future() ? 'none' : rowState(row, this.filters.task());
    }

    /**
     * La consigne correspond à la consigne choisie dans le filtre.
     * @param {TrackingTask} entry Consigne suivie.
     * @returns {boolean} Vrai si elle est mise en avant.
     */
    protected isFocused(entry: TrackingTask): boolean {
        return this.filters.task() !== null && taskFilterKey(entry.task) === this.filters.task();
    }

    /**
     * Élément de maison d'un citoyen.
     * @param {Citizen} citizen Citoyen.
     * @param {HomeEnum} home Élément.
     * @returns {HomeWithValue | undefined} Valeur, absente sans données de maison.
     */
    protected homeOf(citizen: Citizen, home: HomeEnum): HomeWithValue | undefined {
        return homeOf(citizen, home);
    }

    /**
     * Élément de maison à afficher.
     * @param {HomeWithValue | undefined} entry Valeur de l'élément.
     * @returns {boolean} Vrai s'il est à afficher.
     */
    protected homeDone(entry: HomeWithValue | undefined): boolean {
        return homeDone(entry);
    }

    /**
     * Icône d'un élément de maison (habitation selon son niveau).
     * @param {HomeWithValue} entry Valeur de l'élément.
     * @returns {string} Chemin de l'image.
     */
    protected homeIcon(entry: HomeWithValue): string {
        return getHomeIcon(entry);
    }

    /**
     * Icône d'en-tête d'une colonne de maison.
     * @param {HomeEnum} home Élément.
     * @returns {string} Chemin de l'image.
     */
    protected headerIcon(home: HomeEnum): string {
        return homeHeaderIcon(home);
    }

    /**
     * Détail de la maison sur une ligne.
     * @param {Citizen} citizen Citoyen.
     * @returns {string} Détail, vide sans données de maison.
     */
    protected homeSummary(citizen: Citizen): string {
        return homeSummary(citizen, this.store.homes());
    }

    /**
     * Case verrouillée (niveau de maison relevé depuis MyHordes).
     * @param {PlanTaskDTO} task Consigne.
     * @param {TaskStatus} status État.
     * @returns {boolean} Vrai si non modifiable.
     */
    protected locked(task: PlanTaskDTO, status: TaskStatus): boolean {
        return taskLocked(task, status, isHouseLevelEditable(getTown()));
    }

    /**
     * Clic sur une case : elle reprend aussitôt l'état réel, qui ne change qu'une fois l'écriture acceptée.
     * @param {MatCheckboxChange} event Changement de la case.
     * @param {number} user_id Citoyen.
     * @param {TrackingTask} entry Consigne suivie.
     */
    protected onToggle(event: MatCheckboxChange, user_id: number, entry: TrackingTask): void {
        event.source.checked = entry.status.done;
        this.store.setTaskDone(user_id, entry.task, event.checked);
    }

    /**
     * Consigne modifiable : droit d'écriture, et pas encore faite (on la décoche d'abord pour la corriger).
     * @param {TrackingTask} entry Consigne suivie.
     * @returns {boolean} Vrai si son menu de modification s'ouvre.
     */
    protected canEditTask(entry: TrackingTask): boolean {
        return this.store.can_edit() && !entry.status.done;
    }

    /**
     * Citoyen retenu dans le budget.
     * @param {number} user_id Identifiant du citoyen.
     * @returns {CitizenRef | undefined} Citoyen, absent s'il est inconnu.
     */
    protected citizenRef(user_id: number): CitizenRef | undefined {
        return this.store.citizens().find((citizen: CitizenRef): boolean => citizen.userId === user_id);
    }

    /**
     * PA de base effectifs d'un citoyen (valeur propre ou par défaut du plan).
     * @param {number} user_id Identifiant du citoyen.
     * @returns {number} PA de base.
     */
    protected basePa(user_id: number): number {
        const draft: BuildingPlanContentDTO | null = this.store.draft();
        return draft?.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === user_id)?.basePaOverride ?? draft?.basePa ?? 0;
    }

    /**
     * Rab d'expé : PA de base moins les PA de l'expédition (PE de départ déduits).
     * @param {number} user_id Identifiant du citoyen.
     * @returns {number} PA restants, négatifs si l'expédition dépasse les PA de base.
     */
    protected expeditionRab(user_id: number): number {
        return this.basePa(user_id) - this.expeditionPa(user_id);
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
     * Capacité calculée d'un citoyen.
     * @param {number} user_id Identifiant du citoyen.
     * @returns {CitizenCapacity | undefined} Capacité, absente si le plan n'est pas évalué.
     */
    protected capacity(user_id: number): CitizenCapacity | undefined {
        return this.store.evaluation()?.capacities.find((candidate: CitizenCapacity): boolean => candidate.userId === user_id);
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
     * Le type « Action de chantier » est applicable : au moins une action proposée ce jour.
     * @returns {boolean} Vrai si une action peut être choisie.
     */
    protected hasActions(): boolean {
        return plannableActions(this.store.displayable_actions()).length > 0;
    }

    /**
     * Ajoute une consigne d'un type, avec ses valeurs par défaut (première action proposée, première amélioration au niveau suivant).
     * @param {number} user_id Identifiant du citoyen.
     * @param {PlanTaskKind} kind Type de consigne.
     */
    protected addTask(user_id: number, kind: PlanTaskKind): void {
        const task: PlanTaskDTO | null = this.newTask(user_id, kind);
        if (task === null) {
            return;
        }
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            entryFor(content, user_id).tasks.push(task);
        });
    }

    /**
     * Niveau que vise le « + » d'un élément de maison.
     * @param {number} user_id Identifiant du citoyen.
     * @param {HomeEnum} home Élément.
     * @returns {number | null} Niveau visé, nul s'il n'y a rien à ajouter (niveau inconnu ou maximal, agrandissement déjà demandé,
     * consigne déjà faite, amélioration sur une habitation sous le niveau 1).
     */
    protected homeTarget(user_id: number, home: HomeEnum): number | null {
        const key: string | null = homeKey(home);
        const max: number | null = this.homeMax(key);
        if (max === null) {
            return null;
        }
        if (key !== null && !this.canAddUpgrade(user_id)) {
            return null;
        }
        const tasks: PlanTaskDTO[] = this.draftTasks(user_id);
        const existing: TrackingTask | undefined = this.trackingTask(user_id, tasks[homeTaskIndex(tasks, key)]);
        if (existing?.status.done === true) {
            return null;
        }
        return nextHomeTarget(tasks, key, currentHomeLevel(this.citizenRef(user_id), key), max, this.store.unlimited_home_levels());
    }

    /**
     * Consigne d'amélioration possible : habitation au niveau 1 ou plus, actuelle ou visée par l'agrandissement du jour.
     * @param {number} user_id Identifiant du citoyen.
     * @returns {boolean} Vrai si permise.
     */
    protected canAddUpgrade(user_id: number): boolean {
        return upgradesAllowed(this.draftTasks(user_id), currentHomeLevel(this.citizenRef(user_id), null));
    }

    /**
     * Libellé du « + » d'un élément de maison.
     * @param {HomeEnum} home Élément.
     * @param {number} level Niveau visé.
     * @returns {string} Libellé.
     */
    protected homeAddLabel(home: HomeEnum, level: number): string {
        if (homeKey(home) === null) {
            const house: string = this.store.homes().get(level)?.label ?? `${level}`;
            return $localize`Consigne : ${house}:house:`;
        }
        const upgrade: string = home.getLabel();
        return $localize`Consigne : ${upgrade}:upgrade: niv. ${level}:level:`;
    }

    /**
     * Enregistre la consigne du « + » : nouvelle consigne au niveau suivant, ou un niveau de plus sur la consigne existante ;
     * PA des niveaux manquants.
     * @param {number} user_id Identifiant du citoyen.
     * @param {HomeEnum} home Élément.
     */
    protected addHomeLevel(user_id: number, home: HomeEnum): void {
        const level: number | null = this.homeTarget(user_id, home);
        if (level === null) {
            return;
        }
        const key: string | null = homeKey(home);
        const upgrade: HomeUpgradeRef | undefined = key === null ? undefined : this.upgradeByKey(key);
        const homes: ReadonlyMap<number, HomeLevelRef> = this.store.homes();
        const ap_of: (value: number) => number = (value: number): number => (upgrade === undefined ? homes.get(value)?.ap ?? 0 : upgradeAp(upgrade, value));
        const pa: number = cascadeAp(ap_of, currentHomeLevel(this.citizenRef(user_id), key), level);
        this.store.updateDraft((content: BuildingPlanContentDTO): void => {
            const tasks: PlanTaskDTO[] = entryFor(content, user_id).tasks;
            const index: number = homeTaskIndex(tasks, key);
            if (index === -1) {
                tasks.push(key === null ? { id: newTaskId(), kind: 'home', level, pa } : { id: newTaskId(), kind: 'homeUpgrade', ref: key, level, pa });
            } else {
                tasks[index].level = level;
                tasks[index].pa = pa;
            }
        });
    }

    /**
     * Nouvelle consigne d'un type avec ses valeurs par défaut.
     * @param {number} user_id Identifiant du citoyen.
     * @param {PlanTaskKind} kind Type.
     * @returns {PlanTaskDTO | null} Consigne, nulle si le type n'est pas applicable (aucune action, aucune amélioration).
     */
    private newTask(user_id: number, kind: PlanTaskKind): PlanTaskDTO | null {
        const id: string = newTaskId();
        if (kind === 'action') {
            const action: DailyActionEnum | undefined = plannableActions(this.store.displayable_actions())[0];
            const citizen: Citizen | undefined = this.store.citizens_full().find((candidate: Citizen): boolean => candidate.id === user_id);
            return action === undefined ? null : { id, kind, ...actionDefaults(action, citizen?.job?.key ?? null, citizen?.hero_skills ?? null) };
        }
        if (kind === 'homeUpgrade') {
            const upgrade: HomeUpgradeRef | undefined = this.store.home_upgrades()[0];
            return upgrade === undefined || !this.canAddUpgrade(user_id) ? null : { id, kind, ...upgradeDefaults(upgrade, currentHomeLevel(this.citizenRef(user_id), upgrade.key)) };
        }
        return kind === 'home' ? { id, kind, pa: 0 } : { id, kind, label: '', pa: 0 };
    }

    /**
     * Consignes d'un citoyen dans la copie de travail.
     * @param {number} user_id Identifiant du citoyen.
     * @returns {PlanTaskDTO[]} Consignes, vides sans entrée.
     */
    private draftTasks(user_id: number): PlanTaskDTO[] {
        return this.store.draft()?.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === user_id)?.tasks ?? [];
    }

    /**
     * Consigne suivie correspondant à une consigne du plan.
     * @param {number} user_id Identifiant du citoyen.
     * @param {PlanTaskDTO | undefined} task Consigne.
     * @returns {TrackingTask | undefined} Consigne suivie, absente si inconnue.
     */
    private trackingTask(user_id: number, task: PlanTaskDTO | undefined): TrackingTask | undefined {
        if (task === undefined) {
            return undefined;
        }
        return this.filters.shown_rows().find((row: TrackingRow): boolean => row.citizen.id === user_id)?.tasks
            .find((entry: TrackingTask): boolean => entry.task === task);
    }

    /**
     * Niveau maximal d'un élément de maison.
     * @param {string | null} key Clé de l'amélioration, nulle pour l'habitation.
     * @returns {number | null} Niveau maximal, nul si le référentiel ne le connaît pas.
     */
    private homeMax(key: string | null): number | null {
        if (key !== null) {
            return this.upgradeByKey(key)?.max_level ?? null;
        }
        const levels: number[] = Array.from(this.store.homes().keys());
        return levels.length === 0 ? null : Math.max(...levels);
    }

    /**
     * Amélioration du référentiel par clé.
     * @param {string} key Clé `HomeEnum`.
     * @returns {HomeUpgradeRef | undefined} Amélioration, absente si inconnue.
     */
    private upgradeByKey(key: string): HomeUpgradeRef | undefined {
        return this.store.home_upgrades().find((upgrade: HomeUpgradeRef): boolean => upgrade.key === key);
    }
}
