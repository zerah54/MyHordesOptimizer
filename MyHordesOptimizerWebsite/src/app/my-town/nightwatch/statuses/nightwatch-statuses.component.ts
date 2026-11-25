import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Imports } from '../../../_abstract_model/types/_types';
import { NightwatchStore } from '../nightwatch.store';
import { NightwatchWatcherDTO } from '../nightwatch.types';
import { StatusOption, statusOptions } from '../nightwatch-status-labels';

const material_modules: Imports = [MatButtonToggleModule, MatChipsModule];

/** Statuts du chien, exclusifs entre eux. */
const DOG_KEYS: readonly string[] = ['dog', 'dogSteak'];

/** Valeur du choix « Sans chien ». */
const NO_DOG: string = 'none';

/** Statuts prévus d'un veilleur : puces cumulables, et choix exclusif du chien. */
@Component({
    selector: 'mho-nightwatch-statuses',
    templateUrl: './nightwatch-statuses.component.html',
    styleUrls: ['./nightwatch-statuses.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class NightwatchStatusesComponent {

    public readonly userId: InputSignal<number> = input.required<number>();
    public readonly disabled: InputSignal<boolean> = input<boolean>(false);

    protected readonly store: NightwatchStore = inject(NightwatchStore);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly NO_DOG: string = NO_DOG;
    protected readonly chip_options: readonly StatusOption[] = statusOptions().filter((option: StatusOption): boolean => !DOG_KEYS.includes(option.key));
    protected readonly dog_options: readonly StatusOption[] = statusOptions().filter((option: StatusOption): boolean => DOG_KEYS.includes(option.key));

    /** Statuts prévus du veilleur. */
    private readonly statuses: Signal<readonly string[]> = computed((): readonly string[] =>
        this.store.draft()?.watchers.find((watcher: NightwatchWatcherDTO): boolean => watcher.userId === this.userId())?.statuses ?? []);

    /** Chien prévu, `none` sans chien. */
    protected readonly dog: Signal<string> = computed((): string => DOG_KEYS.find((key: string): boolean => this.statuses().includes(key)) ?? NO_DOG);

    /**
     * Statut prévu coché.
     * @param {string} key Clé du statut.
     * @returns {boolean} Vrai s'il est prévu.
     */
    protected hasStatus(key: string): boolean {
        return key === 'ghoul' ? this.store.isGhoul(this.userId()) : this.statuses().includes(key);
    }

    /**
     * Répercute une puce cochée ou décochée par l'utilisateur.
     * @param {string} key Clé du statut.
     * @param {boolean} is_user_input Faux pour un changement venu du modèle.
     */
    protected onStatusChange(key: string, is_user_input: boolean): void {
        if (is_user_input) {
            this.store.toggleStatus(this.userId(), key);
        }
    }

    /**
     * Change le chien prévu (le store retire l'autre chien).
     * @param {string} value Chien choisi, `none` pour aucun.
     */
    protected setDog(value: string): void {
        const current: string = this.dog();
        if (value === current) {
            return;
        }
        this.store.toggleStatus(this.userId(), value === NO_DOG ? current : value);
    }
}
