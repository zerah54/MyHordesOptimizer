import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Imports } from '../../../../_abstract_model/types/_types';

const angular_common: Imports = [FormsModule];
const material_modules: Imports = [MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatInputModule];

/** Paramètres de la boîte : titre, nom proposé, et proposition de partir d'une copie (création seulement). */
export interface PlanningNameDialogData {
    title: string;
    name: string;
    offerCopy: boolean;
}

/** Choix validé : nom rogné, et copie de la proposition affichée (faux hors création). */
export interface PlanningNameDialogResult {
    name: string;
    copy: boolean;
}

/** Longueur maximale d'un nom de proposition (limite de l'API). */
const MAX_NAME_LENGTH: number = 64;

/** Boîte de saisie du nom d'une proposition (création, duplication, renommage). */
@Component({
    selector: 'mho-planning-name-dialog',
    templateUrl: './planning-name-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules]
})
export class PlanningNameDialogComponent {

    protected readonly data: PlanningNameDialogData = inject<PlanningNameDialogData>(MAT_DIALOG_DATA);
    protected readonly max_length: number = MAX_NAME_LENGTH;
    protected readonly name: WritableSignal<string> = signal(this.data.name);
    protected readonly copy: WritableSignal<boolean> = signal(false);

    private readonly dialog_ref: MatDialogRef<PlanningNameDialogComponent, PlanningNameDialogResult> = inject(MatDialogRef);

    /** Valide la saisie ; ignoré si le nom est vide. */
    protected confirm(): void {
        const trimmed: string = this.name().trim();
        if (trimmed === '') {
            return;
        }
        this.dialog_ref.close({ name: trimmed, copy: this.data.offerCopy && this.copy() });
    }
}
