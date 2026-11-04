import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Building, BuildingResource } from '../../../../_abstract_model/types/building.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { buildingCost } from '../../../../_core/utilities/building-cost.util';
import {
    buildBuildingTree,
    buildingName,
    flattenBuildingTree,
    hasReachablePlanLevel,
    planStepperIcon,
    usefulPlanReadings
} from '../../../../_core/utilities/building-tree.util';
import { getTown } from '../../../../_core/utilities/localstorage.util';
import { normalizeString } from '../../../../_core/utilities/string.utils';
import { CompactStepperComponent } from '../../../../_shared/compact-stepper/compact-stepper.component';
import { IconApComponent } from '../../../../_shared/icon-ap/icon-ap.component';
import { BuildingProgress, remainingAp } from '../building-progress.util';
import { rankByDefPerPa } from '../defense.util';
import { PlanningKpisComponent } from '../kpis/planning-kpis.component';
import { BuildingPlanContentDTO, isBuildingStep, PlanItemDTO, PlanPool, stepMode } from '../plan.types';
import { BuildingRef } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { PlanTier, planTierMap } from '../planning-data.util';
import { itemLabel, ratioLabel } from '../planning-labels.util';
import { canToggleBuilding, hasBuilding, setPlanTier, toggleBuilding, ToggleContext } from '../program-edit.util';
import { ResourceCount } from '../resources.util';
import { workshopCap } from '../workshop.util';

const components: Imports = [CompactStepperComponent, IconApComponent, PlanningKpisComponent];
const material_modules: Imports = [
    MatButtonModule, MatButtonToggleModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatSlideToggleModule, MatTooltipModule
];

/** Paramètre du tiroir : la section dans laquelle on coche. */
export interface PlanningTreeDrawerData {
    pool: PlanPool;
}

/** État d'un chantier dans la ville au début du jour. */
type TownState = 'built' | 'in-progress' | 'unlocked' | 'locked';

/** Ressource affichée sur une ligne. */
interface ResourceView {
    itemId: number;
    count: number;
    img: string;
    label: string;
    missing: boolean;
}

/** Ligne du tiroir. */
interface TreeRow {
    building: Building;
    id: number;
    name: string;
    parentName: string;
    icon: string;
    state: TownState;
    life: number;
    maxLife: number;
    remaining: number | null;
    pa: number | null;
    /** Défense réellement gagnée par la ville (celle du programme) ; défense propre sans évaluation ou une fois construit. */
    defence: number;
    ratio: number | null;
    tier: { value: number; max: number; icon: string } | null;
    resources: ResourceView[];
    checked: boolean;
    /** Case utilisable : reste à construire, dégâts à réparer, ou déjà au programme (pour le retirer). */
    togglable: boolean;
    tags: { text: string; title: string }[];
}

/** Tiroir « Choisir des chantiers » : l'arbre des chantiers façon wiki, une case par chantier pour la section ouverte. */
@Component({
    selector: 'mho-planning-tree-drawer',
    templateUrl: './planning-tree-drawer.component.html',
    styleUrls: ['./planning-tree-drawer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...components, ...material_modules]
})
export class PlanningTreeDrawerComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly data: PlanningTreeDrawerData = inject<PlanningTreeDrawerData>(MAT_DIALOG_DATA);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly ratioLabel: (ratio: number | null) => string = ratioLabel;
    protected readonly hard_mode: boolean = getTown()?.town_type === 'PANDE';
    protected readonly defenceTooltip: string = $localize`Défense réellement gagnée par la ville une fois terminé (objets de défense consommés, effets sur les maisons, cercueils…). Défense propre :`;

    protected readonly search: WritableSignal<string> = signal('');
    /** Débloqués seulement par défaut, sauf en Pandémonium où l'on règle le niveau de plan des chantiers non débloqués. */
    protected readonly unlocked_only: WritableSignal<boolean> = signal(!this.hard_mode);
    protected readonly hide_built: WritableSignal<boolean> = signal(false);
    protected readonly sort: WritableSignal<'tree' | 'ratio'> = signal<'tree' | 'ratio'>('tree');
    protected readonly collapsed: WritableSignal<ReadonlySet<number>> = signal<ReadonlySet<number>>(new Set<number>());

    private readonly locale: string = moment.locale();
    private readonly dialog_ref: MatDialogRef<PlanningTreeDrawerComponent> = inject(MatDialogRef);

    /** Arbre du référentiel (racines et index). */
    private readonly tree: Signal<{ roots: Building[]; by_id: Map<number, Building> }> = computed((): { roots: Building[]; by_id: Map<number, Building> } =>
        buildBuildingTree([...this.store.catalog()], this.locale));

    /** Vue de chaque chantier du référentiel. */
    private readonly views: Signal<ReadonlyMap<number, TreeRow>> = computed((): ReadonlyMap<number, TreeRow> => {
        const views: Map<number, TreeRow> = new Map<number, TreeRow>();
        this.tree().by_id.forEach((building: Building, id: number): void => {
            views.set(id, this.view(building));
        });
        return views;
    });

    /** Lignes affichées, filtres et tri appliqués. */
    protected readonly rows: Signal<TreeRow[]> = computed((): TreeRow[] => {
        const views: ReadonlyMap<number, TreeRow> = this.views();
        const shown: (building: Building) => boolean = (building: Building): boolean => this.isShown(views.get(building.id));
        if (this.sort() === 'tree') {
            return flattenBuildingTree(this.tree().roots, { collapsed: this.collapsed(), filter: this.search(), locale: this.locale, isShown: shown })
                .map((building: Building): TreeRow => views.get(building.id) as TreeRow);
        }
        const needle: string = normalizeString(this.search()).trim();
        return Array.from(views.values())
            .filter((row: TreeRow): boolean => shown(row.building) && normalizeString(row.name).includes(needle))
            .sort((a: TreeRow, b: TreeRow): number => (b.ratio ?? Number.NEGATIVE_INFINITY) - (a.ratio ?? Number.NEGATIVE_INFINITY) || a.name.localeCompare(b.name));
    });

    /** Titre de la section ouverte. */
    protected poolLabel(): string {
        return this.data.pool === 'regular' ? $localize`Non-bannis` : $localize`Bannis`;
    }

    /**
     * Coche ou décoche un chantier dans la section ouverte.
     * @param {TreeRow} row Ligne.
     */
    protected toggle(row: TreeRow): void {
        const context: ToggleContext | null = this.store.toggle_context();
        if (context === null) {
            return;
        }
        this.store.flushEdits();
        this.store.updateDraft((content: BuildingPlanContentDTO): void => toggleBuilding(content, this.data.pool, row.id, context));
    }

    /**
     * Niveau de plan estimé d'un chantier.
     * @param {TreeRow} row Ligne.
     * @param {number} tier Niveau choisi.
     */
    protected setTier(row: TreeRow, tier: number): void {
        this.store.updateDraft((content: BuildingPlanContentDTO): void => setPlanTier(content, row.id, Math.max(0, Math.min(2, tier)) as PlanTier));
    }

    /**
     * Replie ou déplie une branche.
     * @param {TreeRow} row Ligne.
     */
    protected toggleBranch(row: TreeRow): void {
        const next: Set<number> = new Set<number>(this.collapsed());
        if (next.has(row.id)) {
            next.delete(row.id);
        } else {
            next.add(row.id);
        }
        this.collapsed.set(next);
    }

    /**
     * Un trait par niveau d'ancêtre (arbre seulement).
     * @param {TreeRow} row Ligne.
     * @returns {number[]} Un élément par niveau.
     */
    protected depthLevels(row: TreeRow): number[] {
        return this.sort() === 'tree' ? Array.from({ length: row.building.depth }, (_: unknown, index: number): number => index) : [];
    }

    /** Ferme le tiroir. */
    protected close(): void {
        this.dialog_ref.close();
    }

    /**
     * Ligne affichée selon les filtres : chantier disponible pour la ville, débloqué si demandé, non construit si demandé.
     * @param {TreeRow | undefined} row Vue du chantier.
     * @returns {boolean} Vrai si affichée.
     */
    private isShown(row: TreeRow | undefined): boolean {
        if (row === undefined || !this.plannable().has(row.id)) {
            return false;
        }
        if (this.unlocked_only() && row.state === 'locked') {
            return false;
        }
        return !(this.hide_built() && row.state === 'built');
    }

    /** Chantiers que la ville peut planifier. */
    private plannable(): ReadonlySet<number> {
        return new Set<number>(this.store.plannable_buildings().map((building: BuildingRef): number => building.id));
    }

    /**
     * Vue d'un chantier : état dans la ville, coût restant ou au niveau de plan estimé, ressources, ratio, cases et rappels du programme.
     * @param {Building} building Chantier du référentiel.
     * @returns {TreeRow} Ligne.
     */
    private view(building: Building): TreeRow {
        const id: number = building.id;
        const context: ToggleContext | null = this.store.toggle_context();
        const progress: BuildingProgress | undefined = context?.progress.get(id);
        const synced: boolean = this.store.synced_ids().has(id);
        const ref: BuildingRef | undefined = this.store.buildings().get(id);
        const draft: BuildingPlanContentDTO | null = this.store.draft();
        const tier: PlanTier = planTierMap(draft?.planTiers ?? {}).get(id) ?? 0;
        const workshop: number = this.store.evaluation()?.workshopLevel ?? 0;

        const built: boolean = progress?.built === true;
        const state: TownState = built ? 'built' : synced ? ((progress?.invested ?? 0) > 0 ? 'in-progress' : 'unlocked') : 'locked';
        const remaining: number | null = progress !== undefined && !built ? remainingAp(progress, workshop) : null;
        const cost: { ap: number | null; resources: BuildingResource[] } = buildingCost(building, this.hard_mode, tier);
        const pa: number | null = built ? null : synced ? remaining : (cost.ap === null ? null : workshopCap(cost.ap, workshop));
        const resources: ResourceCount[] = synced && ref !== undefined
            ? ref.resources
            : cost.resources.map((resource: BuildingResource): ResourceCount => ({ itemId: resource.item_id, count: resource.count }));
        const defence: number = (built ? undefined : this.store.evaluation()?.realDefense.get(id)) ?? building.defence;
        const ratio: number | null = built || defence <= 0
            ? null
            : rankByDefPerPa([{ label: '', kind: 'building', def: defence, pa: pa ?? 0, resources }], this.store.item_values())[0].ratio;
        const useful: 0 | 1 | 2 = usefulPlanReadings(building);
        const parent: Building | undefined = building.parent_id === null ? undefined : this.tree().by_id.get(building.parent_id);

        return {
            building,
            id,
            name: buildingName(building, this.locale),
            parentName: parent === undefined ? '' : buildingName(parent, this.locale),
            icon: building.img ? HORDES_IMG_REPO + building.img : '',
            state,
            life: progress?.life ?? 0,
            maxLife: progress?.maxLife ?? building.max_life,
            remaining,
            pa,
            defence,
            ratio,
            tier: this.hard_mode && !synced && useful > 0 && hasReachablePlanLevel(building)
                ? { value: tier, max: useful, icon: planStepperIcon(building) }
                : null,
            resources: resources.map((resource: ResourceCount): ResourceView => this.resourceView(resource)),
            checked: draft !== null && hasBuilding(draft.programs[this.data.pool], id),
            togglable: draft !== null && context !== null && canToggleBuilding(draft, this.data.pool, id, context),
            tags: draft === null ? [] : this.tags(draft, id)
        };
    }

    /**
     * Ressource d'une ligne, signalée quand la banque ne la couvre pas.
     * @param {ResourceCount} resource Ressource requise.
     * @returns {ResourceView} Vue.
     */
    private resourceView(resource: ResourceCount): ResourceView {
        const item: Item | undefined = this.store.items().find((candidate: Item): boolean => candidate.id === resource.itemId);
        return {
            itemId: resource.itemId,
            count: resource.count,
            img: item?.img ? HORDES_IMG_REPO + item.img : '',
            label: itemLabel(this.store.items(), resource.itemId, this.locale),
            missing: (this.store.bank().get(resource.itemId) ?? 0) < resource.count
        };
    }

    /**
     * Rappels du programme : rang et action du chantier dans chaque section.
     * @param {BuildingPlanContentDTO} draft Copie de travail.
     * @param {number} building_id Chantier.
     * @returns {{ text: string; title: string }[]} Rappels.
     */
    private tags(draft: BuildingPlanContentDTO, building_id: number): { text: string; title: string }[] {
        const tags: { text: string; title: string }[] = [];
        const pools: PlanPool[] = ['banned', 'regular'];
        for (const pool of pools) {
            let rank: number = 0;
            draft.programs[pool].forEach((item: PlanItemDTO): void => {
                if (!isBuildingStep(item)) {
                    return;
                }
                rank++;
                if (item.buildingId === building_id) {
                    const shown: boolean = this.store.banned_pool_shown();
                    const prefix: string = !shown ? '' : pool === 'regular' ? $localize`NB` : $localize`B`;
                    const action: string = actionShort(item.kind, stepMode(item), item.targetRemaining);
                    tags.push({ text: `${prefix}#${rank} · ${action}`, title: !shown ? '' : pool === 'regular' ? $localize`Non-bannis` : $localize`Bannis` });
                }
            });
        }
        return tags;
    }
}

/**
 * Action d'une étape en quelques mots.
 * @param {string} kind Nature.
 * @param {string} mode Mode.
 * @param {number} target Cible du mode `leave`.
 * @returns {string} Texte court.
 */
function actionShort(kind: string, mode: string, target: number): string {
    if (kind === 'build') {
        return mode === 'leave' ? $localize`laisser à ${target}:target: PA` : $localize`terminer`;
    }
    if (mode === 'survive') {
        return $localize`passer la nuit`;
    }
    return mode === 'leave' ? $localize`réparer (−${target}:target: PV)` : $localize`réparer`;
}
