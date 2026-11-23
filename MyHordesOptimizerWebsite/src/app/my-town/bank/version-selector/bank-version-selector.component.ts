import 'moment-timezone';

import { ChangeDetectionStrategy, Component, computed, input, InputSignal, model, ModelSignal, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Imports } from '../../../_abstract_model/types/_types';
import { BankVersion } from '../../../_abstract_model/types/bank-version.class';

const material_modules: Imports = [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule];

/** Navigation entre les versions de la banque : voisine par les chevrons, n'importe laquelle par le menu du libellé. */
@Component({
    selector: 'mho-bank-version-selector',
    templateUrl: './bank-version-selector.component.html',
    styleUrls: ['./bank-version-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class BankVersionSelectorComponent {
    /** Versions accessibles, par `last_update_id` croissant. */
    public readonly versions: InputSignal<BankVersion[]> = input.required<BankVersion[]>();
    /** `last_update_id` de la version sélectionnée. */
    public readonly value: ModelSignal<number> = model.required<number>();

    private readonly index: Signal<number> = computed((): number =>
        this.versions().findIndex((version: BankVersion): boolean => version.last_update_id === this.value()));

    protected readonly current: Signal<BankVersion | null> = computed((): BankVersion | null =>
        this.versions()[this.index()] ?? null);

    protected readonly previous_version: Signal<BankVersion | null> = computed((): BankVersion | null =>
        this.index() > 0 ? this.versions()[this.index() - 1] : null);

    protected readonly next_version: Signal<BankVersion | null> = computed((): BankVersion | null =>
        this.index() >= 0 ? this.versions()[this.index() + 1] ?? null : null);

    protected readonly latest_id: Signal<number | null> = computed((): number | null => {
        const all: BankVersion[] = this.versions();
        return all.length > 0 ? all[all.length - 1].last_update_id : null;
    });

    /**
     * Sélectionne une version.
     * @param {BankVersion | null} version Version visée ; nulle = rien.
     */
    protected select(version: BankVersion | null): void {
        if (version !== null) {
            this.value.set(version.last_update_id);
        }
    }

    /**
     * Libellé d'une version : heure de Paris, puis auteur s'il est connu.
     * @param {BankVersion} version Version.
     * @returns {string} Libellé.
     */
    protected label(version: BankVersion): string {
        const time: string = version.update_time.clone().tz('Europe/Paris').format('HH:mm');
        return version.user_name === null ? time : `${time} · ${version.user_name}`;
    }
}
