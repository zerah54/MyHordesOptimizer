import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnInit, Signal, signal, untracked, WritableSignal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';

import { ApiService } from '../../_abstract_model/services/api.service';
import { BuiltBuildingsService } from '../../_abstract_model/services/built-buildings.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Imports } from '../../_abstract_model/types/_types';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';
import { Me } from '../../_abstract_model/types/me.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { Town } from '../../_abstract_model/types/town.class';
import { isHouseLevelEditable } from '../../_abstract_model/types/town-details.class';
import { TownContextService } from '../../_core/services/town-context.service';
import { getTown, user } from '../../_core/utilities/localstorage.util';
import { DaySelectorComponent } from '../../_shared/day-selector/day-selector.component';
import { StepResult } from '../buildings/planning/building-progress.util';
import { BuildingPlanContentDTO, PlanCitizenDTO, PlanTaskDTO } from '../buildings/planning/plan.types';
import { CitizenRef, DayEvaluation } from '../buildings/planning/plan-evaluation.util';
import { PlanningStore } from '../buildings/planning/planning.store';
import { stepLabel, taskLabel } from '../buildings/planning/planning-labels.util';
import { MyProgram, myProgram } from '../buildings/planning/program/my-program.util';
import { taskLocked, TaskStatus, taskStatus } from '../buildings/planning/task-status.util';
import { expeditionLabel } from '../expeditions/expedition-orders/order-labels';
import { scoutsLairBuilt } from '../expeditions/expedition-resources.util';
import { isDayEditable } from '../expeditions/expeditions.utils';
import { DayExpeditionsStore } from '../map/map-orders/day-expeditions.store';
import { MyExpedition, myExpeditionsOf, OpenExpedition, openExpeditionsFor } from './my-expeditions.util';
import { ProgramExpeditionComponent } from './program-expedition/program-expedition.component';
import { hiddenKey, isHidden, ProgramBlock, safeStorage, setHidden } from './program-hidden.util';

const angular_common: Imports = [NgTemplateOutlet, RouterLink];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatCheckboxModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule];
const components: Imports = [DaySelectorComponent, ProgramExpeditionComponent];

/** Mes consignes d'expédition du jour, toutes expéditions, et présence d'une expédition en préparation. */
interface ExpeditionTotals {
    readonly done: number;
    readonly total: number;
    readonly draft: boolean;
}

/** Ce qui reste lisible d'un jour passé : consignes du jour et consignes individuelles du joueur. */
interface PastProgram {
    userId: number;
    tasks: PlanTaskDTO[];
    dayInstructions: string | null;
}

/** Page « Mon programme » : expéditions et chantiers du jour du citoyen connecté, chaque bloc masquable pour la journée. */
@Component({
    selector: 'mho-my-program',
    templateUrl: './my-program.component.html',
    styleUrls: ['./my-program.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [PlanningStore],
    imports: [...angular_common, ...material_modules, ...components]
})
export class MyProgramComponent implements OnInit {

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly day_store: DayExpeditionsStore = inject(DayExpeditionsStore);

    /** Carte de la ville, chargée seulement si j'ai une expédition à afficher. */
    protected readonly map: WritableSignal<Town | undefined> = signal(undefined);
    protected readonly ruins: Signal<readonly Ruin[]> = toSignal(
        inject(ApiService).getRuins().pipe(catchError((): Observable<Ruin[]> => of([]))),
        { initialValue: [] }
    );
    private readonly scouts_lair_built: Signal<boolean> = toSignal(
        inject(BuiltBuildingsService).builtUids().pipe(map(scoutsLairBuilt)),
        { initialValue: false }
    );
    private readonly can_contribute: Signal<boolean> = inject(TownContextService).canContribute;
    private readonly town_service: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    /** Ville dont la carte est chargée (ou en cours). */
    private map_town_id: number | null = null;

    protected readonly user_id: Signal<number | null> = computed((): number | null => {
        const me: Me | null = user();
        return me === null ? null : +me.id;
    });

    /** Expéditions du jour affiché où je suis placé. */
    protected readonly my_expeditions: Signal<MyExpedition[]> = computed((): MyExpedition[] => {
        const user_id: number | null = this.user_id();
        return user_id === null ? [] : myExpeditionsOf(this.day_store.expeditions(), user_id);
    });

    /** Expéditions prêtes où je peux prendre une place : expéditions chargées, jour modifiable, et placé sur aucune. */
    protected readonly open_expeditions: Signal<OpenExpedition[]> = computed((): OpenExpedition[] => {
        if (this.day_store.status() !== 'loaded' || !isDayEditable(this.store.selected_day(), this.store.current_day) || this.my_expeditions().length > 0) {
            return [];
        }
        const me: Citizen | undefined = this.store.citizens_full().find((citizen: Citizen): boolean => citizen.id === this.user_id());
        return openExpeditionsFor(this.day_store.expeditions(), me, this.store.selected_day(), this.store.current_day, this.scouts_lair_built());
    });

    protected readonly expedition_totals: Signal<ExpeditionTotals> = computed((): ExpeditionTotals => this.my_expeditions().reduce(
        (totals: ExpeditionTotals, mine: MyExpedition): ExpeditionTotals => ({ done: totals.done + mine.done, total: totals.total + mine.total, draft: totals.draft || !mine.ready }),
        { done: 0, total: 0, draft: false }
    ));

    /** Consignes d'expédition cochables : même règle que la page Expéditions. */
    protected readonly checkable: Signal<boolean> = computed((): boolean =>
        this.can_contribute() && isDayEditable(this.store.selected_day(), this.store.current_day));

    private readonly storage: Storage | null = safeStorage();
    /** Relit le masquage après un clic (le stockage n'est pas réactif). */
    private readonly hidden_revision: WritableSignal<number> = signal(0);

    /** Blocs masqués pour la ville et le jour affichés. */
    protected readonly hidden: Signal<Readonly<Record<ProgramBlock, boolean>>> = computed((): Readonly<Record<ProgramBlock, boolean>> => {
        this.hidden_revision();
        const town_id: number | undefined = getTown()?.town_id;
        const day: number = this.store.selected_day();
        if (town_id === undefined) {
            return { expedition: false, buildings: false };
        }
        return {
            expedition: isHidden(this.storage, hiddenKey(town_id, day, 'expedition')),
            buildings: isHidden(this.storage, hiddenKey(town_id, day, 'buildings'))
        };
    });

    /** Programme du citoyen connecté ; nul s'il n'est pas citoyen vivant de la ville ou sans évaluation. */
    protected readonly program: Signal<MyProgram | null> = computed((): MyProgram | null => {
        const me: Me | null = user();
        const draft: BuildingPlanContentDTO | null = this.store.draft();
        const evaluation: DayEvaluation | null = this.store.evaluation();
        if (me === null || draft === null || evaluation === null) {
            return null;
        }
        return myProgram(+me.id, draft, evaluation, this.store.citizens());
    });

    /** Jour passé (plus évalué) : consignes du jour et consignes individuelles du joueur, en lecture seule. */
    protected readonly past: Signal<PastProgram | null> = computed((): PastProgram | null => {
        const me: Me | null = user();
        const draft: BuildingPlanContentDTO | null = this.store.draft();
        if (me === null || draft === null || this.store.selected_day() >= this.store.current_day
            || !this.store.citizens().some((citizen: CitizenRef): boolean => citizen.userId === +me.id)) {
            return null;
        }
        const instructions: string = (draft.instructions ?? '').trim();
        return {
            userId: +me.id,
            tasks: draft.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === +me.id)?.tasks ?? [],
            dayInstructions: instructions === '' ? null : instructions
        };
    });

    /** États des consignes du joueur, dans l'ordre affiché ; recalculés à chaque coche (citoyen modifié en place). */
    protected readonly task_statuses: Signal<TaskStatus[]> = computed((): TaskStatus[] => {
        const program: MyProgram | null = this.program();
        const past: PastProgram | null = this.past();
        const user_id: number | undefined = program?.citizen.userId ?? past?.userId;
        const me: Citizen | undefined = this.store.citizens_full().find((citizen: Citizen): boolean => citizen.id === user_id);
        return (program?.tasks ?? past?.tasks ?? []).map((task: PlanTaskDTO): TaskStatus =>
            (me === undefined ? { done: false, source: null } : taskStatus(task, me, this.store.selected_day())));
    });

    /** Consignes individuelles faites. */
    protected readonly tasks_done: Signal<number> = computed((): number => this.task_statuses().filter((status: TaskStatus): boolean => status.done).length);

    /** Le jour affiché est le jour courant. */
    protected readonly today: Signal<boolean> = computed((): boolean => this.store.selected_day() === this.store.current_day);

    /** Jour à venir : consignes sans case (rien ne peut encore être fait). */
    protected readonly future: Signal<boolean> = computed((): boolean => this.store.selected_day() > this.store.current_day);

    public constructor() {
        effect((): void => {
            const day: number = this.store.selected_day();
            const town_id: number | undefined = getTown()?.town_id;
            if (town_id !== undefined) {
                // load lit l'état du store : sans untracked, chaque mise à jour du hub relancerait l'effet.
                untracked((): void => this.day_store.load(town_id, day));
            }
        });
        effect((): void => {
            const town_id: number | undefined = getTown()?.town_id;
            if (this.my_expeditions().length === 0 || town_id === undefined || town_id === this.map_town_id) {
                return;
            }
            this.map_town_id = town_id;
            this.map.set(undefined);
            untracked((): void => {
                this.town_service.getMap().pipe(
                    catchError((): Observable<undefined> => of(undefined)),
                    takeUntilDestroyed(this.destroy_ref)
                ).subscribe((town: Town | undefined): void => this.map.set(town));
            });
        });
    }

    /** Relance le chargement des expéditions du jour affiché. */
    protected retryExpeditions(): void {
        const town_id: number | undefined = getTown()?.town_id;
        if (town_id !== undefined) {
            this.day_store.load(town_id, this.store.selected_day());
        }
    }

    /** Nom d'une expédition du jour, son numéro s'il est vide. */
    protected expeditionName(expedition: Expedition): string {
        return expeditionLabel(expedition, Math.max(0, this.day_store.expeditions().indexOf(expedition)));
    }

    /** Masque ou réaffiche un bloc pour la ville et le jour affichés. */
    protected setBlockHidden(block: ProgramBlock, hidden: boolean): void {
        const town_id: number | undefined = getTown()?.town_id;
        if (town_id === undefined) {
            return;
        }
        setHidden(this.storage, hiddenKey(town_id, this.store.selected_day(), block), hidden);
        this.hidden_revision.update((revision: number): number => revision + 1);
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

    public ngOnInit(): void {
        this.store.load();
    }

    /**
     * Texte d'une étape du programme.
     * @param {StepResult} result Étape évaluée.
     * @returns {string} Action à réaliser sur le chantier.
     */
    protected stepText(result: StepResult): string {
        const label: string = this.store.buildings().get(result.step.buildingId)?.label ?? `#${result.step.buildingId}`;
        return stepLabel(label, result, this.store.buildings().get(result.step.buildingId)?.maxLife ?? 0);
    }

    /**
     * Libellé d'un chantier, son identifiant s'il est inconnu.
     * @param {number} building_id Chantier.
     * @returns {string} Libellé.
     */
    protected buildingName(building_id: number): string {
        return this.store.buildings().get(building_id)?.label ?? `#${building_id}`;
    }

    /**
     * Libellés des chantiers à voter ce soir (le second seulement avec le Brasier Sacrificiel).
     * @param {MyProgram} program Programme du citoyen.
     * @returns {string[]} Libellés, vide sans vote.
     */
    protected voteNames(program: MyProgram): string[] {
        return [program.voteBuildingId, program.secondVoteBuildingId]
            .filter((building_id: number | null): building_id is number => building_id !== null)
            .map((building_id: number): string => this.buildingName(building_id));
    }

    /**
     * Clic sur une case : elle reprend aussitôt l'état réel, qui ne change qu'une fois l'écriture acceptée.
     * @param {MatCheckboxChange} event Changement de la case.
     * @param {number} user_id Joueur.
     * @param {PlanTaskDTO} task Consigne.
     * @param {TaskStatus} status État actuel.
     */
    protected onToggle(event: MatCheckboxChange, user_id: number, task: PlanTaskDTO, status: TaskStatus): void {
        event.source.checked = status.done;
        this.store.setTaskDone(user_id, task, event.checked);
    }

    /**
     * Texte d'une tâche personnelle.
     * @param {PlanTaskDTO} task Tâche du citoyen.
     * @returns {string} Libellé de la tâche.
     */
    protected taskText(task: PlanTaskDTO): string {
        return taskLabel(task, this.store.homes());
    }
}
