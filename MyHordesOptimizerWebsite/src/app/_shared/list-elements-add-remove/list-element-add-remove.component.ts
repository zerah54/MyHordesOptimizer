import { A11yModule } from '@angular/cdk/a11y';
import { FlexibleConnectedPositionStrategy, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    inject,
    input,
    InputSignal,
    InputSignalWithTransform,
    model,
    ModelSignal,
    output,
    OutputEmitterRef,
    Signal,
    signal,
    TemplateRef,
    viewChild,
    ViewContainerRef,
    WritableSignal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { StatusEnum } from '../../_abstract_model/enum/status.enum';
import { Imports, ListForAddRemove } from '../../_abstract_model/types/_types';
import { Item } from '../../_abstract_model/types/item.class';
import { IconApComponent } from '../icon-ap/icon-ap.component';
import { CountAvailableApPipe } from './count-available-ap.pipe';
import { IsItemsPipe } from './is-item.pipe';
import { DEFAULT_ITEMS_SORT_MODE, ItemsSortMode } from './items-sort-mode';
import { MenuAddComponent } from './menu-add/menu-add.component';
import { MenuRemoveComponent } from './menu-remove/menu-remove.component';

const angular_common: Imports = [A11yModule, CommonModule, NgOptimizedImage, NgTemplateOutlet];
const components: Imports = [IconApComponent, MenuAddComponent, MenuRemoveComponent];
const pipes: Imports = [CountAvailableApPipe, IsItemsPipe];
const material_modules: Imports = [MatButtonModule, MatIconModule, MatMenuModule];

/** Écart entre l'icône cliquée et son sélecteur de quantité, en pixels. */
const QUANTITY_OFFSET: number = 4;

@Component({
    selector: 'mho-list-element-add-remove',
    templateUrl: './list-element-add-remove.component.html',
    styleUrls: ['./list-element-add-remove.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListElementAddRemoveComponent {

    public currentList: InputSignal<Item[] | StatusEnum[]> = input.required();
    public lists: InputSignal<ListForAddRemove[]> = input.required();

    public label: InputSignal<string> = input.required();
    public class: InputSignal<string> = input('');
    public readonly: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    /** Ajout rapide : le menu d'ajout reste ouvert après un ajout */
    public keepOpen: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    /** Liste à quantités (sac, coffre) : un objet peut y figurer plusieurs fois. Un clic sur une icône ouvre alors
     *  son sélecteur de quantité ; sans quantités, il retire l'élément. */
    public withQuantity: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    /** Tri du menu d'ajout, pour les listes qui fournissent leurs quantités ; à lier pour l'enregistrer. */
    public sortMode: ModelSignal<ItemsSortMode> = model<ItemsSortMode>(DEFAULT_ITEMS_SORT_MODE);

    public addLabel: InputSignal<string> = input.required();
    public add: OutputEmitterRef<number | string> = output();

    public removeLabel: InputSignal<string> = input.required();
    public remove: OutputEmitterRef<number | string> = output();

    public emptyLabel: InputSignal<string> = input.required();
    public empty: OutputEmitterRef<void> = output();


    /** Le dossier dans lequel sont stockées les images */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    protected readonly locale: string = moment.locale();
    /** Objet dont le sélecteur de quantité est ouvert. */
    protected readonly quantity_item: WritableSignal<Item | null> = signal(null);

    private readonly overlay: Overlay = inject(Overlay);
    private readonly quantity_template: Signal<TemplateRef<unknown>> = viewChild.required('quantityTemplate');
    /** Le sélecteur est créé dans la vue du composant : un clic sur + ou − la fait vérifier, même si le parent modifie sa liste sur place. */
    private readonly quantity_outlet: Signal<ViewContainerRef> = viewChild.required('quantityOutlet', { read: ViewContainerRef });
    private quantity_overlay: OverlayRef | null = null;

    public constructor() {
        inject(DestroyRef).onDestroy((): void => this.closeQuantity());
    }

    /** Clic sur un élément de la liste : sélecteur de quantité d'un objet d'une liste à quantités, retrait sinon. */
    protected onElementClick(element: Item | StatusEnum, event: Event): void {
        if (this.withQuantity() && element instanceof Item && event.currentTarget instanceof HTMLElement) {
            this.openQuantity(element, event.currentTarget);
        } else {
            this.remove.emit(element.id);
        }
    }

    /** Exemplaires de l'objet dans la liste. Recompté à chaque vérification : certains parents modifient la liste sur place. */
    protected quantityOf(item_id: number): number {
        let quantity: number = 0;
        for (const element of <(Item | StatusEnum)[]>this.currentList()) {
            if (element instanceof Item && element.id === item_id) quantity++;
        }
        return quantity;
    }

    protected increaseQuantity(item: Item): void {
        this.add.emit(item.id);
    }

    /** Retire un exemplaire ; le dernier retiré, l'objet quitte la liste et le sélecteur se ferme. */
    protected decreaseQuantity(item: Item): void {
        const remaining: number = this.quantityOf(item.id) - 1;
        this.remove.emit(item.id);
        if (remaining <= 0) {
            this.closeQuantity();
        }
    }

    protected closeQuantity(): void {
        const overlay_ref: OverlayRef | null = this.quantity_overlay;
        // Remis à zéro avant dispose() : son détachement rappelle closeQuantity().
        this.quantity_overlay = null;
        this.quantity_item.set(null);
        overlay_ref?.dispose();
    }

    /**
     * Sélecteur ancré au point de l'icône cliquée, pas à l'icône : retirer un exemplaire peut détruire l'icône
     * cliquée (une par exemplaire), et le sélecteur doit rester ouvert jusqu'au dernier.
     */
    private openQuantity(item: Item, origin: HTMLElement): void {
        this.closeQuantity();
        const bounds: DOMRect = origin.getBoundingClientRect();
        const position_strategy: FlexibleConnectedPositionStrategy = this.overlay.position()
            .flexibleConnectedTo({ x: bounds.left + bounds.width / 2, y: bounds.bottom })
            .withPositions([
                { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: QUANTITY_OFFSET },
                { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -(bounds.height + QUANTITY_OFFSET) }
            ]);
        const overlay_ref: OverlayRef = this.overlay.create({
            positionStrategy: position_strategy,
            scrollStrategy: this.overlay.scrollStrategies.close(),
            hasBackdrop: true,
            backdropClass: 'cdk-overlay-transparent-backdrop'
        });
        // Flux terminés par dispose() : rien à désinscrire. Le détachement couvre la fermeture au défilement.
        overlay_ref.detachments().subscribe((): void => {
            if (this.quantity_overlay === overlay_ref) this.closeQuantity();
        });
        overlay_ref.backdropClick().subscribe((): void => this.closeQuantity());
        overlay_ref.keydownEvents().subscribe((event: KeyboardEvent): void => {
            if (event.key === 'Escape') this.closeQuantity();
        });
        this.quantity_overlay = overlay_ref;
        this.quantity_item.set(item);
        overlay_ref.attach(new TemplatePortal(this.quantity_template(), this.quantity_outlet()));
    }

}
