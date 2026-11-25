import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Imports } from '../../../_abstract_model/types/_types';

const angular_common: Imports = [FormsModule];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule];

/** Paramètres de la boîte : un champ nul n'est pas demandé. */
export interface NightwatchSimulationDialogData {
    title: string;
    name: string | null;
    last_day: number | null;
    min_day: number;
}

/** Saisie validée : nom rogné et dernier jour à défendre, nuls s'ils n'étaient pas demandés. */
export interface NightwatchSimulationDialogResult {
    name: string | null;
    last_day: number | null;
}

/** Longueur maximale d'un nom de simulation (limite de l'API). */
const MAX_NAME_LENGTH: number = 64;

/** Boîte de saisie du nom et/ou du dernier jour à défendre d'une simulation. */
@Component({
    selector: 'mho-nightwatch-simulation-dialog',
    templateUrl: './nightwatch-simulation-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules]
})
export class NightwatchSimulationDialogComponent {

    protected readonly data: NightwatchSimulationDialogData = inject<NightwatchSimulationDialogData>(MAT_DIALOG_DATA);
    protected readonly max_length: number = MAX_NAME_LENGTH;
    protected readonly name: WritableSignal<string> = signal(this.data.name ?? '');
    protected readonly last_day: WritableSignal<number | null> = signal(this.data.last_day);

    /** Saisie valide : nom non vide et jour entier à partir du jour courant, pour les champs demandés. */
    protected readonly valid: Signal<boolean> = computed((): boolean => {
        const day: number | null = this.last_day();
        const name_ok: boolean = this.data.name === null || this.name().trim() !== '';
        const day_ok: boolean = this.data.last_day === null || (day !== null && Number.isInteger(day) && day >= this.data.min_day);
        return name_ok && day_ok;
    });

    private readonly dialog_ref: MatDialogRef<NightwatchSimulationDialogComponent, NightwatchSimulationDialogResult> = inject(MatDialogRef);

    /** Valide la saisie ; ignoré si elle est invalide. */
    protected confirm(): void {
        if (!this.valid()) {
            return;
        }
        this.dialog_ref.close({ name: this.data.name === null ? null : this.name().trim(), last_day: this.data.last_day === null ? null : this.last_day() });
    }
}
