import { CommonModule } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import moment from 'moment';

import { Action } from '../../_abstract_model/enum/action.enum';
import { Property } from '../../_abstract_model/enum/property.enum';
import { ApiService } from '../../_abstract_model/services/api.service';
import { Imports } from '../../_abstract_model/types/_types';
import { Item } from '../../_abstract_model/types/item.class';
import { ItemsGroupByCategoryPipe } from '../../_core/pipes/items-group-by-category.pipe';
import { LocalizedLabelPipe } from '../../_core/pipes/localized-label.pipe';
import { DEEP_LINK_PARAMS, deepLinkTargets } from '../../_core/utilities/deep-link.util';
import { normalizeString } from '../../_core/utilities/string.utils';
import { FilterFieldComponent } from '../../_shared/filter-field/filter-field.component';
import { ItemComponent } from '../../_shared/item/item.component';
import { SelectComponent } from '../../_shared/select/select.component';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [FilterFieldComponent, ItemComponent, SelectComponent];
const pipes: Imports = [ItemsGroupByCategoryPipe, LocalizedLabelPipe];
const material_modules: Imports = [MatFormFieldModule];

@Component({
    selector: 'mho-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsComponent implements OnInit {

    /** La liste des objets du jeu */
    private items!: Item[];

    protected readonly displayed_items: WritableSignal<Item[] | undefined> = signal(undefined);

    protected readonly locale: string = moment.locale();

    /** Le champ de filtre sur les objets */
    protected filter_value: string = '';
    /** Le champ de filtres sur les propriétés */
    protected select_value: (Property | Action)[] = [];
    /**
     * Objet montré dans le panneau de droite. Le catalogue est une grille : déplier une fiche
     * sur place pousserait tous les objets suivants vers le bas, et la place manquerait pour
     * tout ce que la fiche contient (recettes, ouverture, catapulte, propriétés).
     * Signal : un lien profond (`?item=`) l'ouvre depuis un abonnement, hors de tout événement du gabarit.
     */
    protected readonly detailed_item: WritableSignal<Item | undefined> = signal(undefined);

    /** La liste des filtres */
    protected options: (Property | Action)[] = [...<Property[]>Property.getAllValues(), ...<Action[]>Action.getAllValues()];

    private readonly api: ApiService = inject(ApiService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly router: Router = inject(Router);
    private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
    private readonly injector: Injector = inject(Injector);
    /** Objet demandé par un lien profond, en attente du catalogue. */
    private requested_item_id: number | null = null;

    public ngOnInit(): void {
        deepLinkTargets(this.router, DEEP_LINK_PARAMS.item)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((id: number): void => {
                this.requested_item_id = id;
                this.openRequestedItem();
            });

        this.api.getItems(true)
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((items: Item[]) => {
                this.items = items;
                if (this.items) {
                    this.items = this.items.sort((item_a: Item, item_b: Item) => {
                        if (item_a.category.ordering < item_b.category.ordering) return -1;
                        if (item_a.category.ordering > item_b.category.ordering) return 1;
                        return 0;
                    });
                    this.displayed_items.set([...this.items]);
                    this.openRequestedItem();
                }
            });
    }

    protected applyFilters(): void {
        let filtered: Item[];
        if (this.filter_value !== null && this.filter_value !== undefined && this.filter_value !== '') {
            filtered = this.items.filter((item: Item) => normalizeString(item.label[this.locale]).indexOf(normalizeString(this.filter_value)) > -1);
        } else {
            filtered = [...this.items];
        }

        if (this.select_value && this.select_value.length > 0) {
            filtered = filtered.filter((item: Item) => {
                const item_actions_and_properties: (Action | Property)[] = [
                    ...item.actions.filter((action: Action) => action),
                    ...(item.properties ?? []).filter((property: Property) => property)
                ];
                const item_has_action_or_property: boolean = item_actions_and_properties.some((action_or_property: Action | Property) => {
                    return this.select_value.some((selected: Action | Property) => selected?.key === action_or_property?.key);
                });
                const item_has_key: boolean = this.select_value.some((filter: Property | Action) => (<{ [key: string]: unknown }><unknown>item)[filter?.key]);
                return item_has_action_or_property || item_has_key;
            });
        }
        this.displayed_items.set(filtered);
        // La fiche ouverte ne doit pas survivre à un filtre qui l'exclut.
        const detailed_item: Item | undefined = this.detailed_item();
        if (detailed_item && !filtered.includes(detailed_item)) {
            this.detailed_item.set(undefined);
        }
    }

    /**
     * Ouvre la fiche demandée par un lien profond (`/wiki/items?item=42`) et amène sa tuile à
     * l'écran. Un filtre en cours n'est pas levé : la fiche s'affiche de toute façon dans le
     * panneau, et vider le champ de filtre sous les yeux de l'utilisateur serait plus surprenant.
     */
    private openRequestedItem(): void {
        if (this.requested_item_id === null || !this.items) {
            return;
        }
        const requested_id: number = this.requested_item_id;
        this.requested_item_id = null;
        const item: Item | undefined = this.items.find((candidate: Item): boolean => candidate.id === requested_id);
        if (!item) {
            return;
        }
        this.detailed_item.set(item);
        afterNextRender({
            read: (): void => {
                this.host.nativeElement.querySelector<HTMLElement>('.catalog .mho-item.selected')?.scrollIntoView?.({ block: 'center' });
            }
        }, { injector: this.injector });
    }
}
