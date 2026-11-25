import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import moment from 'moment';
import { catchError, Observable, of } from 'rxjs';

import { ApiService } from '../../../_abstract_model/services/api.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { Item } from '../../../_abstract_model/types/item.class';
import { displayedBagCapacity } from '../../../_shared/bag/bag-capacity.util';
import { ListElementAddRemoveComponent } from '../../../_shared/list-elements-add-remove/list-element-add-remove.component';
import { NightwatchStore, PLAN_ONLY_STATUSES, STALE_CHEST_HOURS } from '../nightwatch.store';
import { NightwatchCitizenStateDTO, NightwatchItemDefDTO, NightwatchPlanDTO, NightwatchWatcherDTO } from '../nightwatch.types';
import { bagItems, bagItemUids, bagUsed } from '../nightwatch-bag.util';
import { WatcherGap } from '../nightwatch-compare.util';
import { injectItemLabeler } from '../nightwatch-item-labels';
import { statusLabel } from '../nightwatch-status-labels';
import { tierLabel } from '../nightwatch-tier-labels';

const angular_common: Imports = [NgTemplateOutlet];
const material_modules: Imports = [MatChipsModule, MatIconModule, MatTableModule];

const MS_PER_HOUR: number = 3600000;

/** Objet quantifié affiché. */
interface ItemQuantity {
    label: string;
    quantity: number;
}

/** Ligne d'un veilleur : écart prévu / réel avec libellés. */
interface EveningRow {
    gap: WatcherGap;
    name: string;
    planned_risk: number;
    real_risk: number;
    planned_phrase: string;
    real_phrase: string;
    missing_items: ItemQuantity[];
    extra_items: ItemQuantity[];
    missing_statuses: string[];
    /** Statuts recopiés du plan dans le réel faute de donnée (chien) : prévus, non vérifiés. */
    unverified_statuses: string[];
    planned_bag: BagView;
    real_bag: BagView;
}

/** Sac affiché : contenu, places occupées et capacité (minimum sûr si le niveau Endurant est inconnu). */
interface BagView {
    items: Item[];
    used: number;
    capacity: number;
    known: boolean;
}

/** Données de sac d'un veilleur : date de mise à jour et état périmé (date inconnue ou trop ancienne). */
interface BagAge {
    name: string;
    updated_at: string | null;
    stale: boolean;
}

/** Onglet Soir de veille : comparaison prévu / réel des veilleurs de la proposition effective. Lit le store de la page. */
@Component({
    selector: 'mho-nightwatch-evening-tab',
    templateUrl: './nightwatch-evening-tab.component.html',
    styleUrls: ['./nightwatch-evening-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ListElementAddRemoveComponent, ...material_modules]
})
export class NightwatchEveningTabComponent {

    protected readonly store: NightwatchStore = inject(NightwatchStore);
    protected readonly columns: readonly string[] = ['name', 'bags', 'defense', 'risk', 'phrase', 'missing_items', 'extra_items', 'missing_statuses', 'to_contact'];
    protected readonly planned_label: string = $localize`Prévu`;
    protected readonly real_label: string = $localize`Réel`;

    private readonly itemLabel: (item_id: number) => string = injectItemLabeler();
    private readonly items: Signal<readonly Item[]> = toSignal(inject(ApiService).getItems().pipe(catchError((): Observable<Item[]> => of([]))), { initialValue: [] as Item[] });

    /** Objets essentiels du référentiel de veille (ils ne prennent pas de place). */
    private readonly essential_ids: Signal<ReadonlySet<number>> = computed((): ReadonlySet<number> => new Set<number>(
        Object.entries(this.store.referential()?.items ?? {})
            .filter(([, def]: [string, NightwatchItemDefDTO]): boolean => def.isEssential)
            .map(([item_id]: [string, NightwatchItemDefDTO]): number => Number(item_id))));

    /** La proposition affichée est la proposition effective du jour. */
    protected readonly is_effective: Signal<boolean> = computed((): boolean => this.store.selected_plan()?.isEffective === true);

    /** Le jour compte une proposition effective, différente de celle affichée. */
    protected readonly effective_elsewhere: Signal<boolean> = computed((): boolean =>
        this.store.plans_of_day().some((plan: NightwatchPlanDTO): boolean => plan.isEffective));

    /** Lignes du tableau, une par veilleur prévu. */
    protected readonly rows: Signal<EveningRow[]> = computed((): EveningRow[] =>
        this.store.gaps().map((gap: WatcherGap): EveningRow => ({
            gap,
            planned_bag: this.bagView(gap.user_id, this.plannedWatcher(gap.user_id)?.items ?? {}, this.plannedWatcher(gap.user_id)?.hasDiscourse === true),
            real_bag: this.bagView(gap.user_id, this.store.citizenState(gap.user_id)?.bag ?? {}, false),
            name: this.citizen(gap.user_id)?.name ?? '?',
            planned_risk: this.percent(gap.planned_risk),
            real_risk: this.percent(gap.real_risk),
            planned_phrase: tierLabel(gap.tier_planned),
            real_phrase: tierLabel(gap.tier_real),
            missing_items: this.quantities(gap.missing_items),
            extra_items: this.quantities(gap.extra_items),
            missing_statuses: gap.missing_statuses.map((key: string): string => statusLabel(key)),
            unverified_statuses: (this.store.draft()?.watchers.find((watcher: NightwatchWatcherDTO): boolean => watcher.userId === gap.user_id)?.statuses ?? [])
                .filter((key: string): boolean => PLAN_ONLY_STATUSES.includes(key))
                .map((key: string): string => statusLabel(key))
        })));

    /** Âge des données de sac des veilleurs ; `stale` au-delà du seuil du bilan, ou si la date est inconnue. */
    protected readonly bag_ages: Signal<BagAge[]> = computed((): BagAge[] => {
        const now: number = Date.now();
        return this.store.gaps().map((gap: WatcherGap): BagAge => {
            const citizen: NightwatchCitizenStateDTO | undefined = this.citizen(gap.user_id);
            const updated_at: string | null = citizen?.bagUpdatedAt ?? null;
            const time: number = updated_at === null ? Number.NaN : new Date(updated_at).getTime();
            return {
                name: citizen?.name ?? '?',
                updated_at,
                stale: Number.isNaN(time) || now - time > STALE_CHEST_HOURS * MS_PER_HOUR
            };
        });
    });

    /** Données de sac périmées ou d'âge inconnu chez au moins un veilleur. */
    protected readonly stale_bags: Signal<BagAge[]> = computed((): BagAge[] =>
        this.bag_ages().filter((age: BagAge): boolean => age.stale));

    /**
     * Identité d'une ligne du tableau : le veilleur.
     * @param {number} _index Position de la ligne.
     * @param {EveningRow} row Ligne.
     * @returns {number} Identifiant du veilleur.
     */
    protected trackRow(_index: number, row: EveningRow): number {
        return row.gap.user_id;
    }

    /**
     * Âge relatif d'une date, dans la langue de l'utilisateur.
     * @param {string | null} updated_at Date ISO, ou `null`.
     * @returns {string} Âge, vide si la date est inconnue.
     */
    protected ageOf(updated_at: string | null): string {
        return updated_at === null ? '' : moment(updated_at).fromNow();
    }

    /**
     * Citoyen de l'état réel.
     * @param {number} user_id Citoyen.
     * @returns {NightwatchCitizenStateDTO | undefined} Citoyen, s'il est connu.
     */
    private citizen(user_id: number): NightwatchCitizenStateDTO | undefined {
        return this.store.state()?.citizens.find((candidate: NightwatchCitizenStateDTO): boolean => candidate.userId === user_id);
    }

    /**
     * Risque en pourcentage, à deux décimales.
     * @param {number} risk Risque (fraction).
     * @returns {number} Pourcentage.
     */
    private percent(risk: number): number {
        return Math.round(risk * 10000) / 100;
    }

    /**
     * Objets quantifiés avec leur libellé.
     * @param {Record<number, number>} quantities Quantités par identifiant d'objet.
     * @returns {ItemQuantity[]} Objets affichables.
     */
    private quantities(quantities: Record<number, number>): ItemQuantity[] {
        return Object.entries(quantities).map(([item_id, quantity]: [string, number]): ItemQuantity => ({
            label: this.itemLabel(Number(item_id)), quantity
        }));
    }

    /**
     * Veilleur prévu dans la copie de travail.
     * @param {number} user_id Citoyen.
     * @returns {NightwatchWatcherDTO | undefined} Veilleur, absent s'il n'est pas prévu.
     */
    private plannedWatcher(user_id: number): NightwatchWatcherDTO | undefined {
        return this.store.draft()?.watchers.find((watcher: NightwatchWatcherDTO): boolean => watcher.userId === user_id);
    }

    /**
     * Sac d'un veilleur à afficher, capacité calculée sur ses propres extensions.
     * @param {number} user_id Citoyen.
     * @param {Record<number, number>} items Contenu du sac.
     * @param {boolean} discourse Porte le Discours rassurant.
     * @returns {BagView} Sac affiché.
     */
    private bagView(user_id: number, items: Record<number, number>, discourse: boolean): BagView {
        return {
            items: bagItems(items, this.items(), discourse),
            used: bagUsed(items, this.essential_ids(), discourse),
            capacity: displayedBagCapacity(this.store.enduranceLevel(user_id), bagItemUids(items, this.items())),
            known: this.store.enduranceLevel(user_id) !== null
        };
    }
}
