import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { JobEnum } from '../../../../_abstract_model/enum/job.enum';
import { Imports, ListForAddRemove } from '../../../../_abstract_model/types/_types';
import { Item } from '../../../../_abstract_model/types/item.class';
import { SnackbarService } from '../../../../_core/services/snackbar.service';
import { BAG_SPACE_UIDS, bagOverflow, displayedBagCapacity } from '../../../../_shared/bag/bag-capacity.util';
import { ListElementAddRemoveComponent } from '../../../../_shared/list-elements-add-remove/list-element-add-remove.component';
import { NightwatchStore, NightwatchWatcherRow } from '../../nightwatch.store';
import { NightwatchItemDefDTO, NightwatchPlanContentDTO, NightwatchWatcherDTO } from '../../nightwatch.types';
import { bagItems, bagItemUids, bagUsed, DISCOURSE_UID } from '../../nightwatch-bag.util';
import { HEAVY_TOLERANCE, heavySlotsLeft, isHeavy } from '../../nightwatch-heavy.util';
import { WatcherAlert } from '../../nightwatch-model.util';
import { NightwatchStatusesComponent } from '../../statuses/nightwatch-statuses.component';

const material_modules: Imports = [MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule];

/** Veilleur d'une proposition : statuts, sac, veilles passées, Discours rassurant, note et valeurs calculées. */
@Component({
    selector: 'mho-nightwatch-watcher',
    templateUrl: './nightwatch-watcher.component.html',
    styleUrls: ['./nightwatch-watcher.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ListElementAddRemoveComponent, NightwatchStatusesComponent, ...material_modules]
})
export class NightwatchWatcherComponent {

    public readonly row: InputSignal<NightwatchWatcherRow> = input.required<NightwatchWatcherRow>();
    /** Objets du référentiel du jeu, pour les libellés et le choix. */
    public readonly items: InputSignal<readonly Item[]> = input.required<readonly Item[]>();

    protected readonly store: NightwatchStore = inject(NightwatchStore);
    private readonly snackbar: SnackbarService = inject(SnackbarService);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    private readonly locale: string = moment.locale();

    /** Veilleur du brouillon. */
    protected readonly watcher: Signal<NightwatchWatcherDTO | null> = computed((): NightwatchWatcherDTO | null =>
        this.store.draft()?.watchers.find((candidate: NightwatchWatcherDTO): boolean => candidate.userId === this.row().user_id) ?? null);

    /** Métier du citoyen, nul s'il est inconnu. */
    protected readonly job: Signal<JobEnum | null> = computed((): JobEnum | null => {
        const job_uid: string | null | undefined = this.store.citizenState(this.row().user_id)?.jobUid;
        return job_uid === null || job_uid === undefined ? null : (JobEnum.getByKey<JobEnum>(job_uid) ?? null);
    });

    /** Emplacements d'encombrants encore libres (négatif = dépassement). */
    protected readonly heavy_left: Signal<number> = computed((): number =>
        heavySlotsLeft(this.watcher()?.items ?? {}, this.items(), this.job() === JobEnum.GUARDIAN));

    /** Objets essentiels du référentiel de veille (ils ne prennent pas de place). */
    private readonly essential_ids: Signal<ReadonlySet<number>> = computed((): ReadonlySet<number> => new Set<number>(
        Object.entries(this.store.referential()?.items ?? {})
            .filter(([, def]: [string, NightwatchItemDefDTO]): boolean => def.isEssential)
            .map(([item_id]: [string, NightwatchItemDefDTO]): number => Number(item_id))));

    /** Contenu du sac prévu pour le composant de sac (Discours compris). */
    protected readonly bag_items: Signal<Item[]> = computed((): Item[] =>
        bagItems(this.watcher()?.items ?? {}, this.items(), this.watcher()?.hasDiscourse === true));

    /** Places occupées par le stuff prévu. */
    protected readonly bag_used: Signal<number> = computed((): number =>
        bagUsed(this.watcher()?.items ?? {}, this.essential_ids(), this.watcher()?.hasDiscourse === true));

    /** Capacité du sac prévu ; minimum d'un habitant si le niveau Endurant est inconnu. */
    protected readonly bag_capacity: Signal<number> = computed((): number =>
        displayedBagCapacity(this.store.enduranceLevel(this.row().user_id), bagItemUids(this.watcher()?.items ?? {}, this.items())));

    /** Le niveau Endurant du veilleur est connu (capacité exacte). */
    protected readonly bag_known: Signal<boolean> = computed((): boolean => this.store.enduranceLevel(this.row().user_id) !== null);

    /** Le stuff prévu ne tient pas dans le sac. */
    protected readonly bag_overflow: Signal<boolean> = computed((): boolean =>
        bagOverflow(this.store.enduranceLevel(this.row().user_id), bagItemUids(this.watcher()?.items ?? {}, this.items()), this.bag_used()));

    /** Alertes du veilleur, sans « objet absent du référentiel » pour les extensions de sac (sans défense, c'est attendu). */
    protected readonly alerts: Signal<WatcherAlert[]> = computed((): WatcherAlert[] => {
        const space_ids: ReadonlySet<number> = new Set<number>(this.items()
            .filter((item: Item): boolean => BAG_SPACE_UIDS.includes(item.uid))
            .map((item: Item): number => item.id));
        return this.row().alerts.filter((alert: WatcherAlert): boolean => alert.kind !== 'unknown_item' || !space_ids.has(alert.item_id ?? -1));
    });

    /** Objets attribuables : ceux du référentiel de veille et les extensions de sac, sans les encombrants quand le sac n'en accepte plus, tolérance comprise. */
    private readonly assignable: Signal<Item[]> = computed((): Item[] => {
        const known: Record<number, unknown> = this.store.referential()?.items ?? {};
        const heavy_allowed: boolean = this.heavy_left() + HEAVY_TOLERANCE > 0;
        return this.items()
            .filter((item: Item): boolean => (known[item.id] !== undefined || BAG_SPACE_UIDS.includes(item.uid)) && (heavy_allowed || !item.is_heaver))
            .sort((a: Item, b: Item): number => this.itemLabel(a.id).localeCompare(this.itemLabel(b.id)));
    });

    /** Onglets du menu d'ajout au sac : objets de veille (même absents de la banque), banque et tous, avec la quantité en banque. */
    protected readonly bag_lists: Signal<ListForAddRemove[]> = computed((): ListForAddRemove[] => {
        const bank: Record<number, number> = this.store.state()?.bank ?? {};
        const counts: ReadonlyMap<number, number> = new Map<number, number>(Object.entries(bank).map(([item_id, count]: [string, number]): [number, number] => [Number(item_id), count]));
        return [
            { label: $localize`Objets de veille`, list: this.assignable(), counts },
            { label: $localize`Banque`, list: this.items().filter((item: Item): boolean => (bank[item.id] ?? 0) > 0), counts },
            { label: $localize`Tous`, list: [...this.items()] }
        ];
    });

    /**
     * Libellé d'un objet, `#id` s'il est inconnu.
     * @param {number} item_id Objet.
     * @returns {string} Libellé.
     */
    protected itemLabel(item_id: number): string {
        const item: Item | undefined = this.items().find((candidate: Item): boolean => candidate.id === item_id);
        return item === undefined ? `#${item_id}` : (item.label?.[this.locale] ?? item.uid);
    }



    /**
     * Risque en pourcentage, à deux décimales.
     * @param {number} risk Risque (fraction).
     * @returns {number} Pourcentage.
     */
    protected percent(risk: number): number {
        return Math.round(risk * 10000) / 100;
    }

    /** Colle le stuff copié ; avertit s'il dépasse les encombrants que le sac accepte normalement. */
    protected pasteItems(): void {
        const copied: Record<number, number> | null = this.store.copied_items();
        if (copied === null) {
            return;
        }
        this.store.pasteItems(this.row().user_id);
        if (heavySlotsLeft(copied, this.items(), this.job() === JobEnum.GUARDIAN) < 0) {
            this.snackbar.warningSnackbar($localize`Anomalie dans l'équipement : Trop d'encombrants`);
        }
    }

    /**
     * Ajoute un exemplaire au sac ; refusé, avec avertissement, au-delà des encombrants tolérés.
     * @param {number} item_id Objet.
     */
    protected addToBag(item_id: number): void {
        const current: number = this.watcher()?.items[item_id] ?? 0;
        const allowed: number = this.allowedQuantity(item_id, current + 1);
        if (allowed > current) {
            this.store.setItem(this.row().user_id, item_id, allowed);
        } else {
            this.snackbar.warningSnackbar($localize`Anomalie dans l'équipement : Trop d'encombrants`);
        }
    }

    /**
     * Retire un exemplaire du sac ; le Discours rassurant retiré est décoché.
     * @param {number} item_id Objet.
     */
    protected removeFromBag(item_id: number): void {
        if (this.items().find((item: Item): boolean => item.id === item_id)?.uid === DISCOURSE_UID && this.watcher()?.items[item_id] === undefined) {
            this.store.setDiscourse(this.row().user_id, false);
            return;
        }
        this.store.setItem(this.row().user_id, item_id, Math.max(0, (this.watcher()?.items[item_id] ?? 0) - 1));
    }

    /** Vide le sac prévu (objets attribués ; le Discours reste une case à cocher). */
    protected emptyBag(): void {
        Object.keys(this.watcher()?.items ?? {}).forEach((item_id: string): void => this.store.setItem(this.row().user_id, Number(item_id), 0));
    }

    /**
     * Quantité ramenée à la limite d'encombrants du sac, tolérance comprise (un objet non encombrant n'est pas limité).
     * @param {number} item_id Objet.
     * @param {number} quantity Quantité voulue.
     * @returns {number} Quantité autorisée.
     */
    private allowedQuantity(item_id: number, quantity: number): number {
        if (!isHeavy(this.items(), item_id)) {
            return quantity;
        }
        const current: number = this.watcher()?.items[item_id] ?? 0;
        return Math.min(quantity, Math.max(0, this.heavy_left() + HEAVY_TOLERANCE + current));
    }

    /**
     * Fixe le nombre de veilles passées ; vide = valeur déduite des plans précédents.
     * @param {string} value Saisie.
     */
    protected setPastWatches(value: string): void {
        this.store.setPastWatches(this.row().user_id, value === '' ? null : Math.max(0, Math.floor(Number(value)) || 0));
    }

    /**
     * Fixe la note du veilleur.
     * @param {string} value Saisie ; vide = aucune note.
     */
    protected setNote(value: string): void {
        const user_id: number = this.row().user_id;
        this.store.updateDraft((content: NightwatchPlanContentDTO): void => {
            const watcher: NightwatchWatcherDTO | undefined = content.watchers.find((candidate: NightwatchWatcherDTO): boolean => candidate.userId === user_id);
            if (watcher !== undefined) {
                watcher.note = value.trim() === '' ? null : value;
            }
        });
    }
}
