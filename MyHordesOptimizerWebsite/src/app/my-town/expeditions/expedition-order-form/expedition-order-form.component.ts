import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import moment from 'moment';

import { HeroicActionEnum } from '../../../_abstract_model/enum/heroic-action.enum';
import { ExpeditionOrderKind, ExpeditionOrderType, Imports } from '../../../_abstract_model/types/_types';
import { ExpeditionOrder } from '../../../_abstract_model/types/expedition-order.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { SelectComponent } from '../../../_shared/select/select.component';
import { TiptapEditorComponent } from '../../../_shared/tiptap-editor/tiptap-editor.component';
import {
    cellKey, cloneOrder, EXPEDITION_ORDER_KIND_INFO, EXPEDITION_ORDER_MAX_NOTE_LENGTH, EXPEDITION_ORDER_MAX_QUANTITY, isConsumable
} from '../expedition-orders/expedition-orders.util';

const angular_common: Imports = [FormsModule];
const components: Imports = [SelectComponent, TiptapEditorComponent];
const material_modules: Imports = [
    MatButtonModule, MatButtonToggleModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule
];

/** Type choisi dans le formulaire : une consigne typée, ou un texte libre. */
export type ExpeditionOrderFormKind = ExpeditionOrderKind | 'text';

/** Case proposée pour déplacer une consigne. */
export interface ExpeditionOrderFormCell {
    readonly cell: MapRoutePoint;
    /** « [x ; y] · lieu · n PA ». */
    readonly label: string;
}

/** Place de la partie : propriétaire possible d'une consigne, ou citoyen à attendre. */
export interface ExpeditionOrderFormMember {
    /** Citoyen d'expédition (la place). */
    readonly id: number;
    /** Utilisateur placé ; `null` pour une place sans citoyen. */
    readonly user_id: number | null;
    readonly label: string;
    /** Place tenue par un fouineur : seule à pouvoir « Excaver ». */
    readonly is_scavenger: boolean;
}

/** Autre expédition du jour, à attendre. */
export interface ExpeditionOrderFormExpedition {
    readonly id: number;
    readonly label: string;
}

/** Qui attendre : le groupe, un citoyen (`user:id`) ou une autre expédition (`expedition:id`). */
type WaitTarget = 'group' | `user:${number}` | `expedition:${number}`;

export interface ExpeditionOrderFormData {
    /** Case de la consigne, en coordonnées absolues. */
    readonly cell: MapRoutePoint;
    /** Coordonnées relatives et lieu, pour le titre. */
    readonly cell_label: string;
    /** « Déblayer » est proposé sur un bâtiment enseveli, « Explorer la ruine » sur une ruine explorable. */
    readonly can_clear: boolean;
    readonly can_explore: boolean;
    /** « Excaver » n'est plus proposé sur une case déjà excavée. */
    readonly can_excavate: boolean;
    /** Cases où déplacer la consigne (celles du tracé) ; vide : la case ne change pas. */
    readonly move_targets: readonly ExpeditionOrderFormCell[];
    readonly members: readonly ExpeditionOrderFormMember[];
    readonly items: readonly Item[];
    /** Autres expéditions du jour, à attendre. */
    readonly expeditions: readonly ExpeditionOrderFormExpedition[];
    /** Consigne à modifier ; `null` pour en ajouter une. */
    readonly order: ExpeditionOrder | null;
    /** Place qui porte la consigne ; `null` : toute l'expédition. */
    readonly owner_id: number | null;
}

export type ExpeditionOrderFormResult =
    | { readonly action: 'save'; readonly order: ExpeditionOrder; readonly owner_ids: readonly number[] }
    | { readonly action: 'delete' };

interface CellOption {
    readonly key: string;
    readonly label: string;
}

interface KindOption {
    readonly kind: ExpeditionOrderFormKind;
    readonly label: string;
    readonly icon: string;
}

const ALWAYS: readonly ExpeditionOrderKind[] = ['pick', 'drop', 'use', 'camp', 'hero', 'wait'];

/** Option « Tout le monde » de la sélection multiple : sélectionne toutes les places, ou aucune si toutes le sont. */
export const EVERYONE: number = -1;

/**
 * Ajout ou modification d'une consigne sur une case : type, paramètres, à qui elle s'adresse et, pour une consigne
 * sortie du tracé, sa nouvelle case. La fenêtre renvoie la consigne prête à enregistrer, sans rien enregistrer.
 */
@Component({
    selector: 'mho-expedition-order-form',
    templateUrl: './expedition-order-form.component.html',
    styleUrls: ['./expedition-order-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules]
})
export class ExpeditionOrderFormComponent {
    protected readonly data: ExpeditionOrderFormData = inject<ExpeditionOrderFormData>(MAT_DIALOG_DATA);
    protected readonly max_quantity: number = EXPEDITION_ORDER_MAX_QUANTITY;
    protected readonly max_note_length: number = EXPEDITION_ORDER_MAX_NOTE_LENGTH;
    protected readonly item_label: string = `label.${moment.locale()}`;

    protected readonly heroics: readonly HeroicActionEnum[] = (<HeroicActionEnum[]>HeroicActionEnum.getAllValues())
        .filter((heroic: HeroicActionEnum): boolean => heroic.value.count_in_daily && heroic.value.action !== '');
    protected readonly consumables: Item[];
    protected readonly all_items: Item[];
    protected readonly wait_targets: readonly ExpeditionOrderFormMember[];
    /** Case actuelle de la consigne, puis les cases du tracé où la déplacer. */
    protected readonly original_cell_key: string;
    protected readonly move_options: readonly CellOption[];

    protected readonly kind: WritableSignal<ExpeditionOrderFormKind>;
    protected readonly type: WritableSignal<ExpeditionOrderType>;
    protected readonly text: WritableSignal<string>;
    protected readonly item_id: WritableSignal<number | null>;
    protected readonly quantity: WritableSignal<number>;
    protected readonly hero_skill: WritableSignal<string | null>;
    protected readonly target_user_id: WritableSignal<number | null>;
    protected readonly target_expedition_id: WritableSignal<number | null>;
    /** Précision libre d'une consigne typée. */
    protected readonly note: WritableSignal<string>;
    /** Places qui portent la consigne ; tableau vide : toute l'expédition. */
    protected readonly owner_ids: WritableSignal<readonly number[]>;
    protected readonly cell_key: WritableSignal<string>;

    protected readonly anyone_label: string = $localize`N'importe qui`;
    protected readonly everyone: number = EVERYONE;

    protected readonly kinds: Signal<readonly KindOption[]> = computed((): readonly KindOption[] => {
        const order: ExpeditionOrder | null = this.data.order;
        const kinds: ExpeditionOrderKind[] = [...ALWAYS];
        // Une consigne posée garde son type, même si la case ou la place a changé depuis.
        if (this.data.can_clear || order?.kind === 'clear') kinds.splice(3, 0, 'clear');
        if (this.data.can_explore || order?.kind === 'explore') kinds.splice(kinds.indexOf('camp'), 0, 'explore');
        if (this.canExcavateHere() || order?.kind === 'excavate') kinds.splice(kinds.indexOf('camp'), 0, 'excavate');
        return [
            { kind: 'text', label: $localize`Texte`, icon: 'notes' },
            ...kinds.map((kind: ExpeditionOrderKind): KindOption => ({ kind, label: EXPEDITION_ORDER_KIND_INFO[kind].verb, icon: EXPEDITION_ORDER_KIND_INFO[kind].icon }))
        ];
    });

    protected readonly wait_target: Signal<WaitTarget> = computed((): WaitTarget => {
        const expedition_id: number | null = this.target_expedition_id();
        if (expedition_id !== null) return `expedition:${expedition_id}`;
        const user_id: number | null = this.target_user_id();
        return user_id !== null ? `user:${user_id}` : 'group';
    });

    protected readonly needs_item: Signal<boolean> = computed((): boolean => ['pick', 'drop', 'use'].includes(this.kind()));
    protected readonly needs_quantity: Signal<boolean> = computed((): boolean => ['pick', 'drop', 'clear'].includes(this.kind()));

    protected readonly valid: Signal<boolean> = computed((): boolean => {
        const kind: ExpeditionOrderFormKind = this.kind();
        if (kind === 'text') return this.text().replace(/<[^>]*>/g, '').trim() !== '';
        if (this.needs_item() && this.item_id() === null) return false;
        if (this.needs_quantity() && !(this.quantity() >= 1 && this.quantity() <= EXPEDITION_ORDER_MAX_QUANTITY)) return false;
        return kind !== 'hero' || this.hero_skill() !== null;
    });

    private readonly dialog_ref: MatDialogRef<ExpeditionOrderFormComponent, ExpeditionOrderFormResult> = inject(MatDialogRef);

    public constructor() {
        const order: ExpeditionOrder | null = this.data.order;
        this.all_items = [...this.data.items];
        this.consumables = this.all_items.filter(isConsumable);
        this.wait_targets = this.data.members.filter((member: ExpeditionOrderFormMember): boolean => member.user_id !== null);
        this.original_cell_key = cellKey(this.data.cell);
        this.move_options = this.data.move_targets.map((target: ExpeditionOrderFormCell): CellOption => ({ key: cellKey(target.cell), label: target.label }));

        this.kind = signal(order?.kind ?? 'text');
        this.type = signal(order && !order.kind ? order.type : 'checkbox');
        this.text = signal(order && !order.kind ? order.text ?? '' : '');
        this.item_id = signal(order?.item_id ?? null);
        this.quantity = signal(order?.quantity ?? 1);
        this.hero_skill = signal(order?.hero_skill ?? null);
        this.target_user_id = signal(order?.target_user_id ?? null);
        this.target_expedition_id = signal(order?.target_expedition_id ?? null);
        this.note = signal(order?.kind ? order.note ?? '' : '');
        this.owner_ids = signal(this.data.owner_id !== null ? [this.data.owner_id] : []);
        this.cell_key = signal(this.original_cell_key);
    }

    protected changeKind(change: MatButtonToggleChange): void {
        this.kind.set(change.value);
        // La liste des objets à consommer est plus courte : un objet qui n'y est pas est retiré.
        const item_id: number | null = this.item_id();
        if (change.value === 'use' && item_id !== null && !this.consumables.some((item: Item): boolean => item.id === item_id)) {
            this.item_id.set(null);
        }
    }

    /** Sélection d'une seule place (modification) : retire « Excaver » si la nouvelle place ne peut pas. */
    protected changeOwner(owner_id: number | null): void {
        this.changeOwners(owner_id === null ? [] : [owner_id]);
    }

    /** Sélection de plusieurs places (ajout) : retire « Excaver » si l'une des places ne peut pas. */
    protected changeOwners(owner_ids: readonly number[]): void {
        if (owner_ids.includes(EVERYONE)) {
            const all: number[] = this.data.members.map((member: ExpeditionOrderFormMember): number => member.id);
            owner_ids = owner_ids.length > all.length ? [] : all;
        }
        this.owner_ids.set(owner_ids);
        if (this.kind() === 'excavate' && !this.kinds().some((option: KindOption): boolean => option.kind === 'excavate')) {
            this.kind.set('text');
        }
    }

    /** Cible d'attente choisie : un citoyen ou une expédition, aucun des deux pour le groupe. */
    protected changeWaitTarget(target: WaitTarget): void {
        const [kind, id]: string[] = target.split(':');
        this.target_user_id.set(kind === 'user' ? Number(id) : null);
        this.target_expedition_id.set(kind === 'expedition' ? Number(id) : null);
    }

    protected changeItem(item_id: number | null | undefined): void {
        this.item_id.set(item_id ?? null);
    }

    protected changeQuantity(value: number | string | null): void {
        const quantity: number = Math.trunc(Number(value));
        this.quantity.set(Number.isFinite(quantity) ? quantity : 0);
    }

    protected save(): void {
        if (!this.valid()) return;
        const kind: ExpeditionOrderFormKind = this.kind();
        const order: ExpeditionOrder = this.data.order ? cloneOrder(this.data.order) : new ExpeditionOrder();
        const cell: MapRoutePoint = this.selectedCell();
        order.type = kind === 'text' ? this.type() : 'checkbox';
        order.text = kind === 'text' ? this.text() : '';
        order.is_done = this.data.order?.is_done ?? false;
        order.position = this.data.order?.position ?? 0;
        order.x = cell.x;
        order.y = cell.y;
        order.kind = kind === 'text' ? null : kind;
        order.item_id = this.needs_item() ? this.item_id() : null;
        order.quantity = this.needs_quantity() ? this.quantity() : null;
        order.hero_skill = kind === 'hero' ? this.hero_skill() : null;
        order.target_user_id = kind === 'wait' ? this.target_user_id() : null;
        order.target_expedition_id = kind === 'wait' ? this.target_expedition_id() : null;
        order.note = kind === 'text' ? null : this.note().trim() || null;
        this.dialog_ref.close({ action: 'save', order, owner_ids: this.owner_ids() });
    }

    protected remove(): void {
        this.dialog_ref.close({ action: 'delete' });
    }

    /** « Excaver » suppose que chaque place sélectionnée (une copie de la consigne par place) puisse le faire. */
    private canExcavateHere(): boolean {
        const owner_ids: readonly number[] = this.owner_ids();
        if (!this.data.can_excavate || owner_ids.length === 0) return false;
        return owner_ids.every((owner_id: number): boolean =>
            this.data.members.some((member: ExpeditionOrderFormMember): boolean => member.id === owner_id && member.is_scavenger));
    }

    private selectedCell(): MapRoutePoint {
        const key: string = this.cell_key();
        return this.data.move_targets.find((target: ExpeditionOrderFormCell): boolean => cellKey(target.cell) === key)?.cell ?? this.data.cell;
    }
}
