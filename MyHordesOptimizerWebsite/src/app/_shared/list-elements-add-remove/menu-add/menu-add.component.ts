import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    input,
    InputSignal,
    InputSignalWithTransform,
    model,
    ModelSignal,
    output,
    OutputEmitterRef,
    Signal,
    signal,
    viewChild,
    WritableSignal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { AddMenuGroup, Imports, ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Item } from '../../../_abstract_model/types/item.class';
import { ItemImgPipe } from '../../../_core/pipes/item-img.pipe';
import { ItemsGroupByCategoryPipe } from '../../../_core/pipes/items-group-by-category.pipe';
import { LocalizedLabelPipe } from '../../../_core/pipes/localized-label.pipe';
import { IsItemsPipe } from '../is-item.pipe';
import { ItemsByQuantityPipe } from '../items-by-quantity.pipe';
import { DEFAULT_ITEMS_SORT_MODE, ItemsSortMode } from '../items-sort-mode';

const angular_common: Imports = [CommonModule, NgOptimizedImage];
const components: Imports = [];
const pipes: Imports = [IsItemsPipe, ItemImgPipe, ItemsByQuantityPipe, ItemsGroupByCategoryPipe, LocalizedLabelPipe];
const material_modules: Imports = [MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule];

@Component({
    selector: 'mho-menu-add',
    templateUrl: './menu-add.component.html',
    styleUrls: ['./menu-add.component.scss'],
    exportAs: 'menuAdd',
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuAddComponent {

    public readonly menu: Signal<MatMenu> = viewChild.required(MatMenu);

    public class: InputSignal<string> = input('');
    /** Garde le menu ouvert après un ajout, pour en enchaîner plusieurs */
    public keepOpen: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    /** Listes proposées, prioritaires sur celles du `matMenuTriggerData` qui restent figées tant que le menu est ouvert */
    public lists: InputSignal<ListForAddRemove[] | undefined> = input();
    /** Tri des listes qui fournissent leurs quantités ; à lier pour l'enregistrer. */
    public sortMode: ModelSignal<ItemsSortMode> = model<ItemsSortMode>(DEFAULT_ITEMS_SORT_MODE);

    /** Groupes proposés dans le segment « Groupes » ; sans eux, le menu n'affiche que les objets. */
    public groups: InputSignal<AddMenuGroup[] | undefined> = input();

    public add: OutputEmitterRef<number | string> = output();
    /** Clé du groupe à ajouter à la liste */
    public addGroup: OutputEmitterRef<string> = output();
    /** Ouverture de l'ajout avancé */
    public advanced: OutputEmitterRef<void> = output();
    /** Clé du groupe personnel à modifier */
    public editGroup: OutputEmitterRef<string> = output();
    /** Clé du groupe personnel à supprimer */
    public deleteGroup: OutputEmitterRef<string> = output();

    /** Le dossier dans lequel sont stockées les images */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La langue du site */
    protected readonly locale: string = moment.locale();
    /** Liste affichée quand il y en a plusieurs, gardée d'une ouverture du menu à l'autre. */
    protected readonly selected_list: WritableSignal<number> = signal(0);
    /** Segment affiché quand des groupes sont fournis. */
    protected readonly view: WritableSignal<'items' | 'groups'> = signal('items');
    /** Rubriques du segment Groupes, dans l'ordre d'affichage. */
    protected readonly sections: readonly { key: string, label: string }[] = [
        { key: 'game', label: $localize`Groupes du jeu` },
        { key: 'user', label: $localize`Mes groupes` }
    ];

    /** Libellé d'un objet dans la langue du site. */
    protected labelOf(item: Item): string {
        return (item.label as unknown as Record<string, string>)[this.locale] ?? String(item.label);
    }

    /** Groupes d'une rubrique dont le nom ou un objet contient la recherche. */
    protected visibleGroups(groups: AddMenuGroup[], section: string, search: string): AddMenuGroup[] {
        const needle: string = search.toLowerCase();
        return groups.filter((group: AddMenuGroup): boolean => group.section === section && (needle === ''
            || group.label.toLowerCase().includes(needle)
            || group.items.some((item: Item): boolean => this.labelOf(item).toLowerCase().includes(needle))));
    }

    /** Nombre d'objets du groupe déjà placés dans la zone d'ajout. */
    protected placedCount(group: AddMenuGroup): number {
        return group.items.filter((item: Item): boolean => group.placed_item_ids.has(item.id)).length;
    }

    /** Infobulle du compteur : objets déjà placés, ou groupe entièrement placé. */
    protected placedTitle(group: AddMenuGroup): string {
        if (this.placedCount(group) === group.items.length) return $localize`Déjà entièrement dans la liste`;
        const names: string = group.items.filter((item: Item): boolean => group.placed_item_ids.has(item.id)).map((item: Item): string => this.labelOf(item)).join(', ');
        return $localize`Déjà dans la liste, ne seront pas réajoutés : ${names}`;
    }

    /** Ajoute le groupe, sauf s'il est entièrement placé. */
    protected onGroupClick(group: AddMenuGroup): void {
        if (this.placedCount(group) < group.items.length) this.addGroup.emit(group.key);
    }

}

