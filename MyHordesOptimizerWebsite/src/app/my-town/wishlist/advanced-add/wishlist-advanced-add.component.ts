import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Action } from '../../../_abstract_model/enum/action.enum';
import { Property } from '../../../_abstract_model/enum/property.enum';
import { I18nLabels, Imports } from '../../../_abstract_model/types/_types';
import { Item } from '../../../_abstract_model/types/item.class';
import { ItemsGroupByCategoryPipe } from '../../../_core/pipes/items-group-by-category.pipe';
import { LocalizedLabelPipe } from '../../../_core/pipes/localized-label.pipe';
import { localizedLabel } from '../../../_core/utilities/string.utils';
import { selectGroupItems, WishlistCriterion } from '../wishlist-criteria.util';

const angular_common: Imports = [FormsModule, NgOptimizedImage];
const pipes: Imports = [ItemsGroupByCategoryPipe, LocalizedLabelPipe];
const material_modules: Imports = [MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule];

/** Données d'ouverture : `edit` non nul = modification d'un groupe perso (nom et objets préremplis, stock et zone masqués). */
export interface WishlistAdvancedAddData {
    items: Item[];
    /** Ids des objets déjà dans la liste pour la zone donnée. */
    placedIdsInZone: (zone: number) => ReadonlySet<number>;
    zone: number;
    edit: { name: string; item_uids: string[] } | null;
}

/** Résultat : `item_ids` contient tous les objets retenus, placés compris ; `count` est le stock souhaité (-1 : infini). */
export interface WishlistAdvancedAddResult {
    name: string;
    item_ids: number[];
    count: number;
    zone: number;
    save_as_user_group: boolean;
}

export type WishlistCriterionKind = WishlistCriterion['kind'];

/** Option d'un critère à choix multiple. */
interface CriterionOption<T> {
    value: T;
    label: string;
}

const ALL_KINDS: readonly WishlistCriterionKind[] = ['action', 'property', 'category', 'heavy'];
/** Actions hors du périmètre des critères (spec §4.6). */
const EXCLUDED_ACTION_KEYS: readonly string[] = ['special_guitar'];

@Component({
    selector: 'mho-wishlist-advanced-add',
    templateUrl: './wishlist-advanced-add.component.html',
    styleUrls: ['./wishlist-advanced-add.component.scss'],
    imports: [...angular_common, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistAdvancedAddComponent {

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly data: WishlistAdvancedAddData = inject<WishlistAdvancedAddData>(MAT_DIALOG_DATA);
    protected readonly edit_mode: boolean = this.data.edit !== null;
    protected readonly add_title: string = $localize`Ajouter un objet précis`;
    protected readonly name: WritableSignal<string> = signal(this.data.edit?.name ?? '');
    protected readonly count: WritableSignal<number> = signal(-1);
    protected readonly zone: WritableSignal<number> = signal(this.data.zone);
    protected readonly save_as_user_group: WritableSignal<boolean> = signal(false);
    /** Panneau de recherche d'un objet à ajouter à la main. */
    protected readonly picking: WritableSignal<boolean> = signal(false);
    protected readonly search: WritableSignal<string> = signal('');
    /** Types de critères utilisés, dans l'ordre d'ajout. */
    protected readonly kinds: WritableSignal<WishlistCriterionKind[]> = signal([]);
    protected readonly action_keys: WritableSignal<string[]> = signal([]);
    protected readonly property_keys: WritableSignal<string[]> = signal([]);
    protected readonly category_ids: WritableSignal<number[]> = signal([]);
    protected readonly heavy: WritableSignal<boolean | null> = signal(null);
    protected readonly added_ids: WritableSignal<ReadonlySet<number>> = signal(this.initialAddedIds());
    protected readonly excluded_ids: WritableSignal<ReadonlySet<number>> = signal(new Set());

    protected readonly action_options: readonly CriterionOption<string>[] = Action.getAllValues<Action>()
        .filter((action: Action): boolean => !EXCLUDED_ACTION_KEYS.includes(action.key))
        .map((action: Action): CriterionOption<string> => ({ value: action.key, label: `${action.value.label} (${action.key})` }));
    protected readonly property_options: readonly CriterionOption<string>[] = Property.getAllValues<Property>()
        .map((property: Property): CriterionOption<string> => ({ value: property.key, label: property.toValue<{ label: string }>().label }));
    protected readonly category_options: readonly { id: number; label: I18nLabels }[] = this.buildCategoryOptions();

    protected readonly available_kinds: Signal<WishlistCriterionKind[]> = computed((): WishlistCriterionKind[] =>
        ALL_KINDS.filter((kind: WishlistCriterionKind): boolean => !this.kinds().includes(kind)));
    /** Critères renseignés ; un type utilisé mais vide est ignoré. */
    protected readonly criteria: Signal<WishlistCriterion[]> = computed((): WishlistCriterion[] => {
        const criteria: WishlistCriterion[] = [];
        if (this.kinds().includes('action') && this.action_keys().length > 0) criteria.push({ kind: 'action', keys: this.action_keys() });
        if (this.kinds().includes('property') && this.property_keys().length > 0) criteria.push({ kind: 'property', keys: this.property_keys() });
        if (this.kinds().includes('category') && this.category_ids().length > 0) criteria.push({ kind: 'category', ids: this.category_ids() });
        const heavy: boolean | null = this.heavy();
        if (this.kinds().includes('heavy') && heavy !== null) criteria.push({ kind: 'heavy', value: heavy });
        return criteria;
    });
    /** Tuiles de l'aperçu : correspondants et ajoutés, exclus compris pour pouvoir les remettre. */
    protected readonly preview: Signal<Item[]> = computed((): Item[] =>
        selectGroupItems(this.data.items, this.criteria(), this.added_ids(), new Set()));
    protected readonly selected: Signal<Item[]> = computed((): Item[] =>
        this.preview().filter((item: Item): boolean => !this.excluded_ids().has(item.id)));
    protected readonly selected_count: Signal<number> = computed((): number => this.selected().length);
    /** Objets réellement ajoutés : les retenus hors ceux déjà placés (sans objet placé en modification). */
    protected readonly placed_ids: Signal<ReadonlySet<number>> = computed((): ReadonlySet<number> =>
        this.edit_mode || !Number.isInteger(this.zone()) ? new Set<number>() : this.data.placedIdsInZone(this.zone()));
    protected readonly to_add_count: Signal<number> = computed((): number =>
        this.selected().filter((item: Item): boolean => !this.placed_ids().has(item.id)).length);
    /** Stock et zone doivent être des entiers : un champ vidé donnerait `null` et un PUT refusé. */
    protected readonly can_submit: Signal<boolean> = computed((): boolean => this.name().trim() !== ''
        && (this.edit_mode || (Number.isInteger(this.count()) && Number.isInteger(this.zone())))
        && (this.to_add_count() > 0 || this.save_as_user_group()));
    /** Objets proposables à la main : ceux qui ne sont pas déjà dans l'aperçu, filtrés par la recherche. */
    protected readonly pickable: Signal<Item[]> = computed((): Item[] => {
        const in_preview: Set<number> = new Set(this.preview().map((item: Item): number => item.id));
        const needle: string = this.search().trim().toLowerCase();
        return this.data.items.filter((item: Item): boolean => !in_preview.has(item.id) && (needle === '' || this.labelOf(item).toLowerCase().includes(needle)));
    });

    private readonly dialog_ref: MatDialogRef<WishlistAdvancedAddComponent, WishlistAdvancedAddResult> = inject(MatDialogRef);
    private readonly locale: string = moment.locale();

    /** Libellé d'un objet dans la langue du site. */
    protected labelOf(item: Item): string {
        return localizedLabel(item.label, this.locale);
    }

    /** Ajoute une ligne de critère du type donné, s'il n'est pas déjà utilisé. */
    protected addCriterion(kind: WishlistCriterionKind): void {
        this.kinds.update((kinds: WishlistCriterionKind[]): WishlistCriterionKind[] => kinds.includes(kind) ? kinds : [...kinds, kind]);
    }

    /** Retire la ligne de critère et vide ses seules valeurs. */
    protected removeCriterion(kind: WishlistCriterionKind): void {
        this.kinds.update((kinds: WishlistCriterionKind[]): WishlistCriterionKind[] => kinds.filter((used: WishlistCriterionKind): boolean => used !== kind));
        switch (kind) {
            case 'action': this.action_keys.set([]); break;
            case 'property': this.property_keys.set([]); break;
            case 'category': this.category_ids.set([]); break;
            case 'heavy': this.heavy.set(null); break;
        }
    }

    /** Fixe les actions du critère Action. */
    protected setActionKeys(keys: string[]): void {
        this.action_keys.set(keys);
    }

    /** Fixe les propriétés du critère Propriété. */
    protected setPropertyKeys(keys: string[]): void {
        this.property_keys.set(keys);
    }

    /** Fixe les catégories du critère Catégorie. */
    protected setCategoryIds(ids: number[]): void {
        this.category_ids.set(ids);
    }

    /** Fixe le critère Encombrant (null : non renseigné). */
    protected setHeavy(value: boolean | null): void {
        this.heavy.set(value);
    }

    /** Exclut l'objet de l'aperçu, ou le remet s'il l'était. */
    protected toggleExcluded(item: Item): void {
        this.excluded_ids.update((excluded: ReadonlySet<number>): ReadonlySet<number> => {
            const next: Set<number> = new Set(excluded);
            if (!next.delete(item.id)) next.add(item.id);
            return next;
        });
    }

    /** Ajoute à l'aperçu un objet choisi à la main. */
    protected pick(item: Item): void {
        this.added_ids.update((added: ReadonlySet<number>): ReadonlySet<number> => new Set(added).add(item.id));
    }

    /** Ferme la fenêtre avec le groupe composé, si le formulaire est valide. */
    protected submit(): void {
        if (!this.can_submit()) return;
        this.dialog_ref.close({
            name: this.name().trim(),
            item_ids: this.selected().map((item: Item): number => item.id),
            count: this.count(),
            zone: this.zone(),
            save_as_user_group: this.edit_mode || this.save_as_user_group()
        });
    }

    /** Ferme la fenêtre sans résultat. */
    protected cancel(): void {
        this.dialog_ref.close();
    }

    /** Objets d'un groupe perso en modification, retrouvés par uid. */
    private initialAddedIds(): Set<number> {
        const uids: string[] = this.data.edit?.item_uids ?? [];
        return new Set(this.data.items.filter((item: Item): boolean => uids.includes(item.uid)).map((item: Item): number => item.id));
    }

    /** Catégories des objets, sans doublon, dans l'ordre de la banque. */
    private buildCategoryOptions(): { id: number; label: I18nLabels }[] {
        const by_id: Map<number, { id: number; label: I18nLabels; ordering: number }> = new Map();
        for (const item of this.data.items) {
            if (item.category && !by_id.has(item.category.id_category)) {
                by_id.set(item.category.id_category, { id: item.category.id_category, label: item.category.label, ordering: item.category.ordering });
            }
        }
        return [...by_id.values()].sort((a: { ordering: number }, b: { ordering: number }): number => a.ordering - b.ordering);
    }
}
