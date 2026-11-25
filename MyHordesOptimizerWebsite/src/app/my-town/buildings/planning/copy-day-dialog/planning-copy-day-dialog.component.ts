import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Imports } from '../../../../_abstract_model/types/_types';
import { DaySelectorComponent } from '../../../../_shared/day-selector/day-selector.component';
import { CopyParts } from '../plan-copy.util';

const angular_common: Imports = [FormsModule];
const components: Imports = [DaySelectorComponent];
const material_modules: Imports = [MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatInputModule];

/**
 * Paramètres de la boîte : titre, nom proposé, jour proposé, jours accessibles, jour courant ; `askParts` : parties à cocher au lieu du nom ;
 * `askName` à faux : seulement le jour.
 */
export interface PlanningCopyDayDialogData {
    title: string;
    name: string;
    day: number;
    days: number[];
    today: number;
    askParts: boolean;
    askName?: boolean;
}

/** Choix validé : jour, nom rogné et parties cochées. */
export interface PlanningCopyDayDialogResult {
    day: number;
    name: string;
    parts: CopyParts;
}

/** Longueur maximale d'un nom de proposition (limite de l'API). */
const MAX_NAME_LENGTH: number = 64;

/** Boîte de choix d'un jour et du nom de la proposition copiée, ou des parties à copier. */
@Component({
    selector: 'mho-planning-copy-day-dialog',
    templateUrl: './planning-copy-day-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules]
})
export class PlanningCopyDayDialogComponent {

    protected readonly data: PlanningCopyDayDialogData = inject<PlanningCopyDayDialogData>(MAT_DIALOG_DATA);
    protected readonly max_length: number = MAX_NAME_LENGTH;
    protected readonly name: WritableSignal<string> = signal(this.data.name);
    protected readonly day: WritableSignal<number> = signal(this.data.day);
    protected readonly budget: WritableSignal<boolean> = signal(true);
    protected readonly programs: WritableSignal<boolean> = signal(true);
    protected readonly invalid: Signal<boolean> = computed((): boolean =>
        this.data.askParts ? !this.budget() && !this.programs() : this.data.askName !== false && this.name().trim() === '');

    private readonly dialog_ref: MatDialogRef<PlanningCopyDayDialogComponent, PlanningCopyDayDialogResult> = inject(MatDialogRef);

    /** Valide la saisie ; ignoré si le nom est vide ou si aucune partie n'est cochée. */
    protected confirm(): void {
        if (this.invalid()) {
            return;
        }
        this.dialog_ref.close({ day: this.day(), name: this.name().trim(), parts: { budget: this.budget(), programs: this.programs() } });
    }
}
