import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { catchError, Observable, of } from 'rxjs';

import { TownService } from '../../../../_abstract_model/services/town.service';
import { WishlistService } from '../../../../_abstract_model/services/wishlist.service';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Bag } from '../../../../_abstract_model/types/bag.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { Town } from '../../../../_abstract_model/types/town.class';
import { ItemMapComponent } from '../../../../_shared/item-map/item-map.component';
import { ItemSpot, spotsByItem } from '../../../../_shared/item-map/item-spots.util';
import { PlanningStore } from '../planning.store';
import { itemIcon, itemLabel } from '../planning-labels.util';
import { holdersByItem, ItemHolder } from '../resource-locations.util';
import { ResourceCount } from '../resources.util';

const components: Imports = [ItemMapComponent];
const material_modules: Imports = [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule];

/** Quantité rangée dans les sacs ou les coffres, avec un citoyen par ligne pour l'infobulle. */
interface StoredCount {
    total: number;
    tooltip: string;
}

/** Ligne du tableau : besoin, stock de la banque, manque, et objets hors banque d'une ressource. */
interface ResourceRow {
    itemId: number;
    label: string;
    /** Chemin complet de l'icône, vide si l'objet est inconnu. */
    icon: string;
    need: number;
    stock: number;
    gap: number;
    bags: StoredCount;
    chests: StoredCount;
    /** Quantité au sol, cassés compris. */
    ground: number;
}

/**
 * Onglet « Ressources » : besoin des chantiers terminés et des maisons face à la banque, objets en sacs, en coffres et au
 * sol pour information, et envoi des manques à la liste de courses.
 */
@Component({
    selector: 'mho-planning-resources',
    templateUrl: './planning-resources.component.html',
    styleUrls: ['./planning-resources.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...components, ...material_modules]
})
export class PlanningResourcesComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly sending: WritableSignal<boolean> = signal(false);
    /** Carte de la ville ; nulle tant qu'elle n'est pas chargée ou si elle est indisponible. */
    protected readonly map: Signal<Town | null> = toSignal(
        inject(TownService).getMap().pipe(catchError((): Observable<null> => of(null))), { initialValue: null });

    private readonly wishlist_service: WishlistService = inject(WishlistService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly locale: string = moment.locale();

    private readonly bags: Signal<Map<number, ItemHolder[]>> = computed((): Map<number, ItemHolder[]> =>
        holdersByItem(this.store.citizens_full(), (citizen: Citizen): Bag | undefined => citizen.bag));

    private readonly chests: Signal<Map<number, ItemHolder[]>> = computed((): Map<number, ItemHolder[]> =>
        holdersByItem(this.store.citizens_full(), (citizen: Citizen): Bag | undefined => citizen.chest));

    private readonly spots: Signal<Map<number, ItemSpot[]>> = computed((): Map<number, ItemSpot[]> => spotsByItem(this.map()?.cells ?? []));

    /** Lignes du tableau, triées par libellé. */
    protected readonly rows: Signal<ResourceRow[]> = computed((): ResourceRow[] => {
        const needs: ReadonlyMap<number, number> = this.store.evaluation()?.needs ?? new Map<number, number>();
        const items: readonly Item[] = this.store.items();
        const rows: ResourceRow[] = [];
        needs.forEach((need: number, item_id: number): void => {
            const stock: number = this.store.bank().get(item_id) ?? 0;
            rows.push({
                itemId: item_id,
                label: itemLabel(items, item_id, this.locale),
                icon: itemIcon(items, item_id),
                need,
                stock,
                gap: Math.max(0, need - stock),
                bags: stored(this.bags().get(item_id) ?? []),
                chests: stored(this.chests().get(item_id) ?? []),
                ground: (this.spots().get(item_id) ?? []).reduce((total: number, spot: ItemSpot): number => total + spot.count, 0)
            });
        });
        return rows.sort((a: ResourceRow, b: ResourceRow): number => a.label.localeCompare(b.label));
    });

    /** Ressources manquantes de l'évaluation courante. */
    protected missing(): ResourceCount[] {
        return this.store.evaluation()?.missing ?? [];
    }

    /** Inscrit les ressources manquantes à la liste de courses de la ville. */
    protected send(): void {
        const ids: number[] = this.missing().map((resource: ResourceCount): number => resource.itemId);
        if (!this.store.can_edit() || ids.length === 0 || this.sending()) {
            return;
        }
        this.sending.set(true);
        this.wishlist_service.addMissingItems(ids).pipe(takeUntilDestroyed(this.destroy_ref)).subscribe({
            next: (): void => this.sending.set(false),
            error: (): void => this.sending.set(false)
        });
    }
}

/**
 * Total rangé et liste des citoyens concernés.
 * @param {ItemHolder[]} holders Citoyens qui détiennent l'objet.
 * @returns {StoredCount} Total et texte de l'infobulle, un citoyen par ligne avec ses exemplaires cassés.
 */
function stored(holders: ItemHolder[]): StoredCount {
    return {
        total: holders.reduce((total: number, holder: ItemHolder): number => total + holder.count, 0),
        tooltip: holders.map((holder: ItemHolder): string => `${holder.name} ×${holder.count}${brokenSuffix(holder.broken)}`).join('\n')
    };
}

/**
 * Mention des exemplaires cassés d'un citoyen.
 * @param {number} broken Exemplaires cassés.
 * @returns {string} « (N cassé(s)) » précédé d'une espace, vide sans exemplaire cassé.
 */
function brokenSuffix(broken: number): string {
    if (broken === 0) {
        return '';
    }
    return broken === 1 ? ` ${$localize`(1 cassé)`}` : ` ${$localize`(${broken}:count: cassés)`}`;
}
