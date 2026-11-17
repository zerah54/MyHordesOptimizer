import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Imports } from '../../../../_abstract_model/types/_types';
import { DaySelectorComponent } from '../../../../_shared/day-selector/day-selector.component';

const angular_common: Imports = [FormsModule];
const components: Imports = [DaySelectorComponent];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule];

/** Paramètres de la boîte : titre, nom proposé, jour proposé, jours accessibles et jour courant de la ville. */
export interface PlanningCopyDayDialogData {
    title: string;
    name: string;
    day: number;
    days: number[];
    today: number;
}

/** Choix validé : jour et nom rogné. */
export interface PlanningCopyDayDialogResult {
    day: number;
    name: string;
}

/** Longueur maximale d'un nom de proposition (limite de l'API). */
const MAX_NAME_LENGTH: number = 64;

/** Boîte de choix d'un jour et du nom de la proposition copiée. */
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

    private readonly dialog_ref: MatDialogRef<PlanningCopyDayDialogComponent, PlanningCopyDayDialogResult> = inject(MatDialogRef);

    /** Valide la saisie ; ignoré si le nom est vide. */
    protected confirm(): void {
        const trimmed: string = this.name().trim();
        if (trimmed === '') {
            return;
        }
        this.dialog_ref.close({ day: this.day(), name: trimmed });
    }
}
