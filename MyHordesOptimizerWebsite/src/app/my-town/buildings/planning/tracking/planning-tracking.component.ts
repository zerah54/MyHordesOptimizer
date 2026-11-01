import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Imports } from '../../../../_abstract_model/types/_types';
import { isHouseLevelEditable } from '../../../../_abstract_model/types/town-details.class';
import { getTown } from '../../../../_core/utilities/localstorage.util';
import { CitizenChipComponent } from '../../../../_shared/citizen-chip/citizen-chip.component';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { PlanningCitizenFiltersComponent } from '../citizen-filters/planning-citizen-filters.component';
import { PlanTaskDTO } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { taskLocked, TaskStatus } from '../task-status.util';
import { rowState, taskFilterKey, TrackingRow, TrackingState, TrackingTask } from '../tracking.util';

const material_modules: Imports = [MatCheckboxModule, MatIconModule, MatTooltipModule];

/** Panneau « Suivi des consignes individuelles » : qui a fait (ou non) ses consignes, cases à cocher ; filtres partagés avec le Budget. */
@Component({
    selector: 'mho-planning-tracking',
    templateUrl: './planning-tracking.component.html',
    styleUrls: ['./planning-tracking.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules, CitizenChipComponent, PlanningCitizenFiltersComponent]
})
export class PlanningTrackingComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly filters: CitizenFiltersStore = inject(CitizenFiltersStore);

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
