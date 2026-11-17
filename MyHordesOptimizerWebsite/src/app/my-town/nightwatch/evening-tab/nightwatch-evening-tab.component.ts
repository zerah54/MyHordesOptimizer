import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import moment from 'moment';

import { Imports } from '../../../_abstract_model/types/_types';
import { NightwatchStore, PLAN_ONLY_STATUSES, STALE_CHEST_HOURS } from '../nightwatch.store';
import { NightwatchCitizenStateDTO, NightwatchPlanDTO, NightwatchWatcherDTO } from '../nightwatch.types';
import { WatcherGap } from '../nightwatch-compare.util';
import { injectItemLabeler } from '../nightwatch-item-labels';
import { statusLabel } from '../nightwatch-status-labels';
import { tierLabel } from '../nightwatch-tier-labels';

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
    imports: [...material_modules]
})
export class NightwatchEveningTabComponent {

    protected readonly store: NightwatchStore = inject(NightwatchStore);
    protected readonly columns: readonly string[] = ['name', 'defense', 'risk', 'phrase', 'missing_items', 'extra_items', 'missing_statuses', 'to_contact'];

    private readonly itemLabel: (item_id: number) => string = injectItemLabeler();

    /** La proposition affichée est la proposition effective du jour. */
    protected readonly is_effective: Signal<boolean> = computed((): boolean => this.store.selected_plan()?.isEffective === true);

    /** Le jour compte une proposition effective, différente de celle affichée. */
    protected readonly effective_elsewhere: Signal<boolean> = computed((): boolean =>
        this.store.plans_of_day().some((plan: NightwatchPlanDTO): boolean => plan.isEffective));

    /** Lignes du tableau, une par veilleur prévu. */
    protected readonly rows: Signal<EveningRow[]> = computed((): EveningRow[] =>
        this.store.gaps().map((gap: WatcherGap): EveningRow => ({
            gap,
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
}
