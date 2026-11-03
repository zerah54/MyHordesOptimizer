import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, InputSignal, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { catchError, forkJoin, map, Observable, of, take } from 'rxjs';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { BuildingPlanService } from '../../../_abstract_model/services/building-plan.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { Building } from '../../../_abstract_model/types/building.class';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { TypedCellDefDirective } from '../../../_core/directives/typed-cell-def.directive';
import { availabilityIn, buildBuildingTree, buildingName, flattenBuildingTree } from '../../../_core/utilities/building-tree.util';
import { getTown } from '../../../_core/utilities/localstorage.util';
import { BuildingUpgradesDTO, upgradeLevelText } from '../../../my-town/buildings/planning/building-upgrades.types';
import { TownBuildingStateDTO } from '../../../my-town/buildings/planning/plan.types';
import { buildingLevelsOf } from '../../../my-town/buildings/planning/planning-data.util';

const directives: Imports = [TypedCellDefDirective];
const material_modules: Imports = [MatButtonToggleModule, MatTableModule, MatTooltipModule];

/** Évolutions des chantiers : une ligne par chantier, le texte suit le niveau consulté. */
@Component({
    selector: 'mho-wiki-building-upgrades',
    templateUrl: './building-upgrades.component.html',
    styleUrls: ['./building-upgrades.component.scss'],
    imports: [...directives, ...material_modules],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuildingUpgradesComponent implements OnInit {

    /** Vrai pour ne garder que les chantiers construits dans la ville. */
    public readonly townOnly: InputSignal<boolean> = input.required<boolean>();

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly locale: string = moment.locale();
    protected readonly displayed_columns: string[] = ['label', 'level', 'text'];

    private readonly town: TownDetails | null = getTown();
    private readonly roots: WritableSignal<Building[]> = signal([]);
    private readonly upgrades: WritableSignal<BuildingUpgradesDTO> = signal({});
    /** Niveau des chantiers construits dans la ville, par uid. */
    private readonly current_levels: WritableSignal<ReadonlyMap<string, number>> = signal(new Map<string, number>());
    /** Niveau choisi dans le sélecteur, par uid ; absent tant que la ligne n'a pas été touchée. */
    private readonly consulted_levels: WritableSignal<ReadonlyMap<string, number>> = signal(new Map<string, number>());

    protected readonly rows: Signal<Building[]> = computed((): Building[] => flattenBuildingTree(this.roots(), {
        collapsed: new Set<number>(),
        filter: '',
        locale: this.locale,
        isShown: (building: Building): boolean => this.isShown(building)
    }));

    private readonly api: ApiService = inject(ApiService);
    private readonly plan_service: BuildingPlanService = inject(BuildingPlanService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    /**
     * Charge le catalogue, les évolutions et, dans une ville, l'état de ses chantiers.
     * @returns {void}
     */
    public ngOnInit(): void {
        forkJoin({
            buildings: this.api.getBuildings().pipe(take(1)),
            upgrades: this.plan_service.getBuildingUpgrades().pipe(take(1)),
            states: this.loadStates()
        })
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe(({ buildings, upgrades, states }: { buildings: Building[]; upgrades: BuildingUpgradesDTO; states: TownBuildingStateDTO[] }): void => {
                this.upgrades.set(upgrades);
                this.current_levels.set(buildingLevelsOf(buildings, states));
                this.roots.set(buildBuildingTree(buildings, this.locale).roots);
            });
    }

    /**
     * Niveaux du sélecteur d'un chantier.
     * @param {Building} building Chantier.
     * @returns {number[]} Niveaux, de 0 au maximum.
     */
    protected levelsOf(building: Building): number[] {
        return Array.from({ length: (this.upgrades()[building.uid]?.maxLevel ?? 0) + 1 }, (_: unknown, level: number): number => level);
    }

    /**
     * Niveau du chantier dans la ville.
     * @param {Building} building Chantier.
     * @returns {number | null} Niveau, nul si le chantier n'y est pas construit.
     */
    protected currentLevelOf(building: Building): number | null {
        return this.current_levels().get(building.uid) ?? null;
    }

    /**
     * Niveau affiché : celui choisi, sinon le niveau de la ville, sinon 0.
     * @param {Building} building Chantier.
     * @returns {number} Niveau.
     */
    protected displayedLevelOf(building: Building): number {
        return this.consulted_levels().get(building.uid) ?? this.currentLevelOf(building) ?? 0;
    }

    /**
     * Texte du niveau affiché.
     * @param {Building} building Chantier.
     * @returns {string} Texte, vide s'il est inconnu.
     */
    protected textOf(building: Building): string {
        return upgradeLevelText(this.upgrades(), building.uid, this.displayedLevelOf(building), this.locale) ?? '';
    }

    /**
     * Nom du chantier.
     * @param {Building} building Chantier.
     * @returns {string} Nom.
     */
    protected nameOf(building: Building): string {
        return buildingName(building, this.locale);
    }

    /**
     * Retient le niveau choisi dans le sélecteur d'un chantier.
     * @param {Building} building Chantier.
     * @param {MatButtonToggleChange} change Choix.
     * @returns {void}
     */
    protected consult(building: Building, change: MatButtonToggleChange): void {
        this.consulted_levels.update((levels: ReadonlyMap<string, number>): ReadonlyMap<string, number> => new Map(levels).set(building.uid, change.value as number));
    }

    /**
     * Lit l'état des chantiers de la ville ; sans ville ou en cas d'échec, aucun chantier n'est considéré construit.
     * @returns {Observable<TownBuildingStateDTO[]>} États.
     */
    private loadStates(): Observable<TownBuildingStateDTO[]> {
        if (this.town === null) {
            return of([]);
        }
        return this.plan_service.getState(true).pipe(
            take(1),
            map(({ buildings }: { buildings: TownBuildingStateDTO[] }): TownBuildingStateDTO[] => buildings),
            catchError((): Observable<TownBuildingStateDTO[]> => of([]))
        );
    }

    /**
     * Un chantier a sa ligne s'il a des évolutions, existe dans le type de la ville et passe le filtre de la ville.
     * @param {Building} building Chantier.
     * @returns {boolean} Vrai pour l'afficher.
     */
    private isShown(building: Building): boolean {
        return this.upgrades()[building.uid] !== undefined
            && availabilityIn(building, this.town?.town_type ?? null) !== 'Disabled'
            && (!this.townOnly() || this.current_levels().has(building.uid));
    }
}
