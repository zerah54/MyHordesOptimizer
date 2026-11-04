import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { HomeEnum } from '../../../../_abstract_model/enum/home.enum';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { HomeWithValue } from '../../../../_abstract_model/types/home.class';
import { isHouseLevelEditable } from '../../../../_abstract_model/types/town-details.class';
import { getHomeIcon } from '../../../../_core/utilities/citizen.util';
import { getTown } from '../../../../_core/utilities/localstorage.util';
import { CitizenChipComponent } from '../../../../_shared/citizen-chip/citizen-chip.component';
import { IconApComponent } from '../../../../_shared/icon-ap/icon-ap.component';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { PlanningCitizenFiltersComponent } from '../citizen-filters/planning-citizen-filters.component';
import { PlanTaskDTO } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { taskLocked, TaskStatus } from '../task-status.util';
import { rowState, taskFilterKey, TrackingRow, TrackingState, TrackingTask } from '../tracking.util';

const material_modules: Imports = [MatCheckboxModule, MatIconModule, MatTooltipModule];

/** Colonnes de la maison : habitation, puis améliorations masquées sur petit écran. */
const HOME_COLUMNS: readonly HomeEnum[] = [
    HomeEnum.HOUSE_LEVEL, HomeEnum.KITCHEN_LEVEL, HomeEnum.LAB_LEVEL, HomeEnum.REST_LEVEL, HomeEnum.HOUSE_DEFENSE, HomeEnum.HAS_FENCE
];

/** Colonnes fixes du tableau : citoyen, consignes, état. */
const FIXED_COLUMNS: number = 3;

/** Panneau « Suivi des consignes individuelles » : qui a fait (ou non) ses consignes, cases à cocher ; filtres partagés avec le Budget. */
@Component({
    selector: 'mho-planning-tracking',
    templateUrl: './planning-tracking.component.html',
    styleUrls: ['./planning-tracking.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules, CitizenChipComponent, IconApComponent, PlanningCitizenFiltersComponent]
})
export class PlanningTrackingComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly filters: CitizenFiltersStore = inject(CitizenFiltersStore);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly home_columns: readonly HomeEnum[] = HOME_COLUMNS;

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
        return citizen.home?.content?.find((entry: HomeWithValue): boolean => entry.element.key === home.key);
    }

    /**
     * Élément de maison à afficher : habitation de niveau connu (négatif = non défini), amélioration de niveau 1 ou plus.
     * @param {HomeWithValue | undefined} entry Valeur de l'élément.
     * @returns {boolean} Vrai s'il est à afficher.
     */
    protected homeDone(entry: HomeWithValue | undefined): boolean {
        if (entry === undefined) {
            return false;
        }
        if (entry.element.key === HomeEnum.HOUSE_LEVEL.key) {
            return typeof entry.value === 'number' && entry.value >= 0;
        }
        return entry.value === true || (typeof entry.value === 'number' && entry.value > 0);
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
     * Icône d'en-tête d'une colonne de maison (habitation : niveau 0).
     * @param {HomeEnum} home Élément.
     * @returns {string} Chemin de l'image.
     */
    protected headerIcon(home: HomeEnum): string {
        return home.value.img !== '' ? home.value.img : 'home/home_lv0.gif';
    }

    /**
     * Détail de la maison sur une ligne : nom de l'habitation puis améliorations faites avec leur niveau.
     * @param {Citizen} citizen Citoyen.
     * @returns {string} Détail, vide sans données de maison.
     */
    protected homeSummary(citizen: Citizen): string {
        const parts: string[] = [];
        const house: HomeWithValue | undefined = this.homeOf(citizen, HomeEnum.HOUSE_LEVEL);
        const house_label: string | undefined = typeof house?.value === 'number' ? this.store.homes().get(house.value)?.label : undefined;
        if (house_label !== undefined) {
            parts.push(house_label);
        }
        for (const home of HOME_COLUMNS.slice(1)) {
            const entry: HomeWithValue | undefined = this.homeOf(citizen, home);
            if (this.homeDone(entry)) {
                parts.push(entry?.value === true ? home.getLabel() : `${home.getLabel()} ${entry?.value}`);
            }
        }
        return parts.join(' · ');
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
}
