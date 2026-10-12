import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    inject,
    input,
    InputSignal,
    InputSignalWithTransform,
    linkedSignal,
    Signal,
    signal,
    WritableSignal
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs';

import { BURIED_RUIN_ID, HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import {
    CampImprovementDTO,
    CampImprovementUpdateDTO,
    CampingGroupCamperDTO,
    CampingGroupParametersDTO
} from '../../../../_abstract_model/dto/camping-group.dto';
import { JobEnum } from '../../../../_abstract_model/enum/job.enum';
import { CampingService } from '../../../../_abstract_model/services/camping.service';
import { TownService } from '../../../../_abstract_model/services/town.service';
import { Imports } from '../../../../_abstract_model/types/_types';
import { CampingGroupResult } from '../../../../_abstract_model/types/camping-group-result.class';
import { CampingOdds } from '../../../../_abstract_model/types/camping-odds.class';
import { Cell } from '../../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { HeroSkillLevels, MAX_HERO_SKILL_LEVEL } from '../../../../_abstract_model/types/hero-skill-levels';
import { Ruin } from '../../../../_abstract_model/types/ruin.class';
import { Town } from '../../../../_abstract_model/types/town.class';
import { getTown } from '../../../../_core/utilities/localstorage.util';
import { CompactStepperComponent } from '../../../../_shared/compact-stepper/compact-stepper.component';
import { CompactToggleComponent } from '../../../../_shared/compact-toggle/compact-toggle.component';
import { Camper, CamperSettings, CampersStore, MAX_CAMPERS } from './campers.store';

const angular_common: Imports = [DecimalPipe, NgOptimizedImage];
const components: Imports = [CompactStepperComponent, CompactToggleComponent];
const material_modules: Imports = [DragDropModule, MatButtonModule, MatCheckboxModule, MatIconModule, MatMenuModule, MatTooltipModule];

/** Délai de regroupement des calculs : une rafale de réglages n'en déclenche qu'un. */
export const CAMPING_CALCULATION_DELAY: number = 250;

function chanceClass(odds: CampingOdds | undefined): string {
    if (!odds) return '';
    if (odds.bounded_probability >= 80) return 'good';
    if (odds.bounded_probability >= 50) return 'medium';
    return 'bad';
}

/** Aménagement connu de la zone. */
interface CampImprovement {
    readonly level: number | null;
    readonly day: number | null;
}

/** Bâtiment de la zone, tel que le calcul l'attend. */
interface CampingBuilding {
    readonly bonus: number | null;
    readonly capacity: number;
    readonly bury_count: number;
}

/** Demande de calcul et sa clé de comparaison. */
interface CalculationRequest {
    readonly request: CampingGroupParametersDTO | null;
    readonly key: string | null;
}

/** Résultat d'un calcul, rattaché à la demande qui l'a produit ; `result` null si le calcul a échoué. */
interface Calculation {
    readonly key: string;
    readonly result: CampingGroupResult | null;
}

interface CamperRow {
    readonly camper: Camper;
    readonly odds: CampingOdds | undefined;
    /** Classe de la pastille de chance : good, medium, bad, ou vide en attendant le calcul. */
    readonly chance_class: string;
}

/**
 * Chances de camping sur une case, pour un groupe de campeurs dans l'ordre où ils se cachent : chacun subit la
 * foule de ceux cachés avant lui, et seuls les premiers tiennent dans le bâtiment. L'ordre se règle aux flèches ou
 * en glissant les lignes, et l'API propose l'ordre qui maximise les survivants attendus. L'aménagement de la zone
 * (améliorations, objets de défense) est enregistré pour la ville et baisse de 15 chaque nuit.
 */
@Component({
    selector: 'mho-map-cell-camping',
    templateUrl: './map-cell-camping.component.html',
    styleUrls: ['./map-cell-camping.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules]
})
export class MapCellCampingComponent {
    public readonly cell: InputSignal<Cell> = input.required<Cell>();
    public readonly map: InputSignal<Town | undefined> = input<Town | undefined>(undefined);
    public readonly allRuins: InputSignal<Ruin[]> = input.required<Ruin[]>();
    public readonly allCitizens: InputSignal<Citizen[]> = input.required<Citizen[]>();
    /** L'aménagement de la zone n'est saisissable que dans une ville modifiable. */
    public readonly canUpdate: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    protected readonly store: CampersStore = inject(CampersStore);

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly MAX_CAMPERS: number = MAX_CAMPERS;
    protected readonly MAX_HERO_SKILL_LEVEL: number = MAX_HERO_SKILL_LEVEL;
    protected readonly JOB_SCOUT: JobEnum = JobEnum.SCOUT;
    protected readonly locale: string = moment.locale();
    protected readonly jobs: JobEnum[] = JobEnum.getAllValues<JobEnum>();

    protected readonly campings_label: string = $localize`Nombre de campings déjà effectués`;
    protected readonly pro_camper_label: string = $localize`Campeur professionnel`;
    protected readonly objects_label: string = $localize`Nombre de pelures de peau et de toiles de tentes dans le sac`;
    protected readonly tomb_label: string = $localize`Tombe`;
    protected readonly vest_label: string = $localize`Tenue de camouflage`;
    protected readonly hidden_campers_label: string = $localize`Nombre de campeurs déjà cachés sur la case`;
    protected readonly zombies_label: string = $localize`Nombre de zombies sur la case`;
    protected readonly recluse_label: string = $localize`Capacité Repos (0 : aucun niveau, 1 à 4) : Campeur pro et plafond en découlent. « ? » : à cocher à la main`;
    protected readonly r4_label: string = $localize`Plafond de 99 % (Repos niveau 4)`;

    /** Aménagement de la zone : repart de la case à chaque changement de case, puis suit les saisies. */
    protected readonly improvement: WritableSignal<CampImprovement> = linkedSignal((): CampImprovement => ({
        level: this.cell().camp_improvement_level,
        day: this.cell().camp_improvement_day
    }));
    protected readonly zombies: WritableSignal<number> = linkedSignal((): number => Math.max(0, this.cell().nb_zombie || 0));
    protected readonly hidden_campers: WritableSignal<number> = linkedSignal((): number => {
        this.cell();
        return 0;
    });
    protected readonly editing_level: WritableSignal<boolean> = linkedSignal((): boolean => {
        this.cell();
        return false;
    });
    protected readonly saving: WritableSignal<boolean> = signal(false);

    /** Citoyens vivants de la ville qui ne sont pas encore dans le groupe. */
    protected readonly available_citizens: Signal<Citizen[]> = computed((): Citizen[] => {
        const in_group: Set<number | null> = new Set(this.store.campers().map((camper: Camper): number | null => camper.citizen_id));
        return this.allCitizens()
            .filter((citizen: Citizen): boolean => !citizen.is_dead && !in_group.has(citizen.id))
            .sort((citizen_a: Citizen, citizen_b: Citizen): number => citizen_a.name.localeCompare(citizen_b.name));
    });

    private readonly building: Signal<CampingBuilding> = computed((): CampingBuilding => {
        const cell: Cell = this.cell();
        if (cell.ruin_id === BURIED_RUIN_ID) {
            // Tas inconnus : compté comme un bâtiment où personne ne tient encore, le cas le moins favorable
            return { bonus: null, capacity: -1, bury_count: Math.max(1, cell.nb_ruin_dig || 0) };
        }
        const ruin: Ruin | undefined = this.allRuins().find((candidate: Ruin): boolean => candidate.id === cell.ruin_id);
        if (!ruin || ruin.id < 0) {
            return { bonus: null, capacity: -1, bury_count: 0 };
        }
        return { bonus: ruin.camping ?? 0, capacity: ruin.capacity ?? -1, bury_count: 0 };
    });

    /** Demande de calcul ; `null` tant que la section est repliée ou le groupe vide. */
    private readonly request: Signal<CampingGroupParametersDTO | null> = computed((): CampingGroupParametersDTO | null => {
        const campers: readonly Camper[] = this.store.campers();
        if (!this.store.expanded() || campers.length === 0) return null;
        const building: CampingBuilding = this.building();
        return {
            townType: getTown()?.town_type ?? 'RE',
            distance: this.cell().nb_km || 0,
            zombies: this.zombies(),
            night: this.store.night(),
            devastated: this.map()?.is_devasted ?? getTown()?.is_devaste ?? false,
            phare: this.store.phare(),
            improvementLevel: this.improvement().level ?? 0,
            ruinBonus: building.bonus,
            ruinCapacity: building.capacity,
            ruinBuryCount: building.bury_count,
            hiddenCampers: this.hidden_campers(),
            campers: campers.map((camper: Camper): CampingGroupCamperDTO => ({
                job: camper.job.value.id,
                campings: camper.campings,
                proCamper: camper.pro_camper,
                objects: camper.objects,
                vest: camper.job === JobEnum.SCOUT && camper.vest,
                tomb: camper.tomb,
                r4: camper.r4,
                recluseLevel: camper.recluse_level
            }))
        };
    });
    private readonly request_key: Signal<string | null> = computed((): string | null => {
        const request: CampingGroupParametersDTO | null = this.request();
        return request ? JSON.stringify(request) : null;
    });

    private readonly camping_service: CampingService = inject(CampingService);
    private readonly town_service: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    /** Dernier calcul reçu : une rafale de réglages n'en lance qu'un, et une nouvelle demande annule la précédente. */
    private readonly calculation: Signal<Calculation | null> = toSignal(
        toObservable(this.request).pipe(
            debounceTime(CAMPING_CALCULATION_DELAY),
            map((request: CampingGroupParametersDTO | null): CalculationRequest => ({ request, key: request ? JSON.stringify(request) : null })),
            distinctUntilChanged((previous: CalculationRequest, current: CalculationRequest): boolean => previous.key === current.key),
            switchMap(({ request, key }: CalculationRequest): Observable<Calculation | null> =>
                request && key
                    ? this.camping_service.calculateGroup(request).pipe(
                        map((result: CampingGroupResult): Calculation => ({ key, result })),
                        catchError((): Observable<Calculation> => of({ key, result: null })))
                    : of(null))
        ),
        { initialValue: null }
    );

    /** Résultat du calcul des réglages affichés ; `undefined` en attendant, `null` en cas d'échec. */
    protected readonly result: Signal<CampingGroupResult | null | undefined> = computed((): CampingGroupResult | null | undefined => {
        const calculation: Calculation | null = this.calculation();
        return calculation && calculation.key === this.request_key() ? calculation.result : undefined;
    });

    protected readonly rows: Signal<CamperRow[]> = computed((): CamperRow[] => {
        const odds: CampingOdds[] = this.result()?.odds ?? [];
        return this.store.campers().map((camper: Camper, index: number): CamperRow => ({
            camper,
            odds: odds[index],
            chance_class: chanceClass(odds[index])
        }));
    });

    /** Campeurs dans l'ordre conseillé, s'il fait mieux que l'ordre actuel. */
    protected readonly suggested_order: Signal<Camper[] | null> = computed((): Camper[] | null => {
        const result: CampingGroupResult | null | undefined = this.result();
        if (!result?.can_improve_order) return null;
        const campers: readonly Camper[] = this.store.campers();
        return result.best_order.map((index: number): Camper => campers[index]);
    });

    public constructor() {
        this.store.useTown(getTown()?.town_id ?? null);
    }

    protected toggleExpanded(): void {
        this.store.expanded.update((expanded: boolean): boolean => !expanded);
    }

    /**
     * Réglage d'un campeur. Pour un citoyen de la ville, les campings et le niveau de Repos sont aussi ceux de la liste
     * des citoyens : ils y sont enregistrés (ville modifiable seulement).
     */
    protected updateCamper(camper: Camper, changes: Partial<CamperSettings>): void {
        this.store.update(camper.key, changes);
        const citizen: Citizen | undefined = camper.citizen_id === null || !this.canUpdate()
            ? undefined
            : this.allCitizens().find((candidate: Citizen): boolean => candidate.id === camper.citizen_id);
        if (!citizen) return;
        if (changes.campings !== undefined) {
            this.saveCampingCount(citizen, changes.campings);
        }
        if (changes.recluse_level !== undefined) {
            this.saveRecluseLevel(citizen, changes.recluse_level);
        }
    }

    /** Stepper du niveau de Repos : -1 = inconnu. */
    protected updateRecluseLevel(camper: Camper, value: number): void {
        this.updateCamper(camper, { recluse_level: value < 0 ? null : value });
    }

    protected drop(event: CdkDragDrop<readonly Camper[]>): void {
        this.store.move(event.previousIndex, event.currentIndex);
    }

    protected applySuggestedOrder(): void {
        const result: CampingGroupResult | null | undefined = this.result();
        if (result?.can_improve_order) {
            this.store.applyOrder(result.best_order);
        }
    }

    protected addImprovement(improvements: number, defense_objects: number): void {
        this.saveImprovement(improvements, defense_objects, null);
    }

    protected setLevel(value: string): void {
        const level: number = Math.floor(Number(value));
        if (!Number.isFinite(level) || level < 0) return;
        this.saveImprovement(0, 0, level);
    }

    private saveCampingCount(citizen: Citizen, campings: number): void {
        const previous: number = citizen.camping_count;
        citizen.camping_count = campings;
        this.town_service.updateCampingCount(citizen.id, campings)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                error: (): void => {
                    citizen.camping_count = previous;
                }
            });
    }

    private saveRecluseLevel(citizen: Citizen, recluse_level: number | null): void {
        const previous: HeroSkillLevels = citizen.hero_skills;
        citizen.hero_skills = { ...previous, r: recluse_level };
        this.town_service.updateHeroSkills(citizen.id, citizen.hero_skills)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                error: (): void => {
                    citizen.hero_skills = previous;
                }
            });
    }

    private saveImprovement(improvements: number, defense_objects: number, level: number | null): void {
        const cell: Cell = this.cell();
        const update: CampImprovementUpdateDTO = { x: cell.x, y: cell.y, improvements, defenseObjects: defense_objects, level };
        this.saving.set(true);
        this.town_service.saveCampImprovement(update)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (saved: CampImprovementDTO): void => {
                    // La case reste en mémoire avec la carte : rouvrir son détail doit montrer la saisie
                    cell.camp_improvement_level = saved.level;
                    cell.camp_improvement_day = saved.day;
                    if (this.cell() === cell) {
                        this.improvement.set({ level: saved.level, day: saved.day });
                        this.editing_level.set(false);
                    }
                    this.saving.set(false);
                },
                error: (): void => {
                    this.saving.set(false);
                }
            });
    }
}
