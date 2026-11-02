import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { WishlistService } from '../../../../_abstract_model/services/wishlist.service';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Item } from '../../../../_abstract_model/types/item.class';
import { PlanningStore } from '../planning.store';
import { itemLabel } from '../planning-labels.util';
import { ResourceCount } from '../resources.util';

const material_modules: Imports = [MatButtonModule, MatIconModule, MatProgressSpinnerModule];

/** Ligne du tableau : besoin, stock de la banque et manque d'une ressource. */
interface ResourceRow {
    itemId: number;
    label: string;
    /** Chemin complet de l'icône, vide si l'objet est inconnu. */
    icon: string;
    need: number;
    stock: number;
    gap: number;
}

/** Onglet « Ressources » : besoin des chantiers terminés et des maisons face à la banque, avec envoi des manques à la liste de courses. */
@Component({
    selector: 'mho-planning-resources',
    templateUrl: './planning-resources.component.html',
    styleUrls: ['./planning-resources.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class PlanningResourcesComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly sending: WritableSignal<boolean> = signal(false);

    private readonly wishlist_service: WishlistService = inject(WishlistService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly locale: string = moment.locale();

    /** Lignes du tableau, triées par libellé. */
    protected rows(): ResourceRow[] {
        const needs: ReadonlyMap<number, number> = this.store.evaluation()?.needs ?? new Map<number, number>();
        const items: readonly Item[] = this.store.items();
        const rows: ResourceRow[] = [];
        needs.forEach((need: number, item_id: number): void => {
            const stock: number = this.store.bank().get(item_id) ?? 0;
            const img: string = items.find((item: Item): boolean => item.id === item_id)?.img ?? '';
            rows.push({
                itemId: item_id,
                label: itemLabel(items, item_id, this.locale),
                icon: img === '' ? '' : HORDES_IMG_REPO + img,
                need,
                stock,
                gap: Math.max(0, need - stock)
            });
        });
        return rows.sort((a: ResourceRow, b: ResourceRow): number => a.label.localeCompare(b.label));
    }

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
