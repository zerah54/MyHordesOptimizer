import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import moment from 'moment';

import { Imports } from '../../../../_abstract_model/types/_types';
import { Item } from '../../../../_abstract_model/types/item.class';
import { IconApComponent } from '../../../../_shared/icon-ap/icon-ap.component';
import { PlanningStore } from '../planning.store';
import { toNonNegativeInt } from '../planning-input.util';
import { itemLabel } from '../planning-labels.util';

const material_modules: Imports = [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule];

/** Ligne de l'éditeur de valeurs d'objets. */
interface ValueRow {
    id: number;
    label: string;
    value: number;
}

/** Boîte « Valeurs des objets » : valeur en PA de chaque ressource, pour le coût réel des chantiers (réglage de la ville). */
@Component({
    selector: 'mho-planning-item-values-dialog',
    templateUrl: './planning-item-values-dialog.component.html',
    styleUrls: ['./planning-item-values-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules, IconApComponent]
})
export class PlanningItemValuesDialogComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);

    private readonly locale: string = moment.locale();
    /** Valeurs en cours d'édition ; nul tant que rien n'a été modifié localement. */
    private readonly edits: WritableSignal<Record<string, number> | null> = signal<Record<string, number> | null>(null);
    /** Version des réglages sur laquelle portent les modifications locales : un enregistrement fait ailleurs entre-temps donne un 409. */
    private base_version: number | null = null;

    /** Valeurs affichées : modifications locales, sinon valeurs enregistrées. */
    private readonly values: Signal<Record<string, number>> = computed((): Record<string, number> => {
        const local: Record<string, number> | null = this.edits();
        if (local !== null) {
            return local;
        }
        const saved: Record<string, number> = {};
        this.store.item_values().forEach((value: number, id: number): void => {
            saved[String(id)] = value;
        });
        return saved;
    });

    /** Lignes de l'éditeur, triées par libellé. */
    protected valueRows(): ValueRow[] {
        return Object.entries(this.values())
            .map(([id, value]: [string, number]): ValueRow => ({ id: Number(id), label: itemLabel(this.store.items(), Number(id), this.locale), value }))
            .sort((a: ValueRow, b: ValueRow): number => a.label.localeCompare(b.label));
    }

    /** Objets proposés à l'ajout d'une valeur. */
    protected itemOptions(): readonly Item[] {
        return this.store.items();
    }

    /**
     * Nom d'un objet dans la langue du site.
     * @param {Item} item Objet.
     * @returns {string} Nom, sinon uid.
     */
    protected itemName(item: Item): string {
        return itemLabel(this.store.items(), item.id, this.locale);
    }

    /**
     * Modifie localement la valeur d'un objet (envoyée à l'enregistrement).
     * @param {number} item_id Identifiant de l'objet.
     * @param {string} value Valeur saisie ; invalide ou négative = 0.
     */
    protected onItemValue(item_id: number, value: string): void {
        this.edit({ ...this.values(), [String(item_id)]: toNonNegativeInt(value) });
    }

    /**
     * Ajoute à l'éditeur l'objet dont le nom ou l'uid est saisi, avec une valeur nulle.
     * @param {HTMLInputElement} input Champ de saisie du nom.
     */
    protected addValue(input: HTMLInputElement): void {
        const wanted: string = input.value.trim().toLowerCase();
        const item: Item | undefined = this.store.items().find((candidate: Item): boolean =>
            candidate.uid.toLowerCase() === wanted || Object.values(candidate.label ?? {}).some((label: string): boolean => label.toLowerCase() === wanted));
        if (item === undefined || String(item.id) in this.values()) {
            return;
        }
        this.edit({ ...this.values(), [String(item.id)]: 0 });
        input.value = '';
    }

    /** Enregistre les valeurs avec la version lue à la première modification (version courante sans modification). */
    protected saveValues(): void {
        this.store.saveItemValues(this.values(), this.base_version);
        this.edits.set(null);
        this.base_version = null;
    }

    /**
     * Remplace les valeurs éditées ; la première modification retient la version des réglages lue.
     * @param {Record<string, number>} values Valeurs.
     */
    private edit(values: Record<string, number>): void {
        if (this.edits() === null) {
            this.base_version = this.store.settings_version();
        }
        this.edits.set(values);
    }
}
