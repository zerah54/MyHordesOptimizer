import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { JobEnum } from '../../../../_abstract_model/enum/job.enum';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Item } from '../../../../_abstract_model/types/item.class';
import { itemIcon } from '../../../buildings/planning/planning-labels.util';
import { NightwatchStore, NightwatchWatcherRow } from '../../nightwatch.store';
import { NightwatchPlanContentDTO, NightwatchWatcherDTO } from '../../nightwatch.types';
import { StatusOption, statusOptions } from '../../nightwatch-status-labels';

const material_modules: Imports = [MatButtonModule, MatCardModule, MatCheckboxModule, MatChipsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule];

/** Objet attribué à un veilleur. */
interface AssignedItem {
    item_id: number;
    label: string;
    icon: string;
    quantity: number;
}

/** Veilleur d'une proposition : statuts, objets attribués, veilles passées, Discours rassurant, note et valeurs calculées. */
@Component({
    selector: 'mho-nightwatch-watcher',
    templateUrl: './nightwatch-watcher.component.html',
    styleUrls: ['./nightwatch-watcher.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class NightwatchWatcherComponent {

    public readonly row: InputSignal<NightwatchWatcherRow> = input.required<NightwatchWatcherRow>();
    /** Objets du référentiel du jeu, pour les libellés et le choix. */
    public readonly items: InputSignal<readonly Item[]> = input.required<readonly Item[]>();

    protected readonly store: NightwatchStore = inject(NightwatchStore);
    protected readonly status_options: readonly StatusOption[] = statusOptions();
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly chosen_item: WritableSignal<number | null> = signal<number | null>(null);
    protected readonly chosen_quantity: WritableSignal<number> = signal(1);

    private readonly locale: string = moment.locale();

    /** Veilleur du brouillon. */
    protected readonly watcher: Signal<NightwatchWatcherDTO | null> = computed((): NightwatchWatcherDTO | null =>
        this.store.draft()?.watchers.find((candidate: NightwatchWatcherDTO): boolean => candidate.userId === this.row().user_id) ?? null);

    /** Métier du citoyen, nul s'il est inconnu. */
    protected readonly job: Signal<JobEnum | null> = computed((): JobEnum | null => {
        const job_uid: string | null | undefined = this.store.citizenState(this.row().user_id)?.jobUid;
        return job_uid === null || job_uid === undefined ? null : (JobEnum.getByKey<JobEnum>(job_uid) ?? null);
    });

    /** Objets déjà attribués, avec leur libellé. */
    protected readonly assigned: Signal<AssignedItem[]> = computed((): AssignedItem[] =>
        Object.entries(this.watcher()?.items ?? {}).map(([item_id, quantity]: [string, number]): AssignedItem => ({
            item_id: Number(item_id), label: this.itemLabel(Number(item_id)), icon: itemIcon(this.items(), Number(item_id)), quantity
        })));

    /** Objets attribuables : ceux du référentiel de veille. */
    protected readonly assignable: Signal<Item[]> = computed((): Item[] => {
        const known: Record<number, unknown> = this.store.referential()?.items ?? {};
        return this.items()
            .filter((item: Item): boolean => known[item.id] !== undefined)
            .sort((a: Item, b: Item): number => this.itemLabel(a.id).localeCompare(this.itemLabel(b.id)));
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
     * Statut prévu coché.
     * @param {string} key Clé du statut.
     * @returns {boolean} Vrai s'il est prévu.
     */
    protected hasStatus(key: string): boolean {
        return key === 'ghoul' ? this.store.isGhoul(this.row().user_id) : this.watcher()?.statuses.includes(key) === true;
    }

    /**
     * Répercute dans le brouillon un statut coché ou décoché par l'utilisateur.
     * @param {string} key Clé du statut.
     * @param {boolean} is_user_input Faux pour un changement venu du modèle.
     */
    protected onStatusChange(key: string, is_user_input: boolean): void {
        if (is_user_input) {
            this.store.toggleStatus(this.row().user_id, key);
        }
    }

    /**
     * Risque en pourcentage, à deux décimales.
     * @param {number} risk Risque (fraction).
     * @returns {number} Pourcentage.
     */
    protected percent(risk: number): number {
        return Math.round(risk * 10000) / 100;
    }

    /**
     * Mémorise l'objet choisi dans la liste.
     * @param {number | null} item_id Objet choisi ; nul = aucun.
     */
    protected chooseItem(item_id: number | null): void {
        this.chosen_item.set(item_id ?? null);
    }

    /**
     * Mémorise la quantité à attribuer.
     * @param {string} value Saisie.
     */
    protected chooseQuantity(value: string): void {
        this.chosen_quantity.set(Math.max(1, Math.floor(Number(value)) || 1));
    }

    /** Attribue l'objet choisi, avec la quantité saisie, au veilleur. */
    protected addItem(): void {
        const item_id: number | null = this.chosen_item();
        if (item_id !== null) {
            this.store.setItem(this.row().user_id, item_id, this.chosen_quantity());
            this.chosen_item.set(null);
        }
    }

    /**
     * Fixe la quantité d'un objet attribué ; vide ou nulle = retire l'objet.
     * @param {number} item_id Objet.
     * @param {string} value Saisie.
     */
    protected setQuantity(item_id: number, value: string): void {
        this.store.setItem(this.row().user_id, item_id, Math.max(0, Math.floor(Number(value)) || 0));
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
