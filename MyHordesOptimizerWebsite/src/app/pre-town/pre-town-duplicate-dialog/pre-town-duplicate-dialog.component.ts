import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Imports } from '../../_abstract_model/types/_types';

const angular_common: Imports = [FormsModule];
const material_modules: Imports = [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule];

/** Longueur maximale d'un alias, alignée sur le serveur. */
export const PRE_TOWN_ALIAS_MAX_LENGTH: number = 64;

/** Alias proposé pour la copie. */
export interface PreTownDuplicateDialogData {
    alias: string;
}

/** Saisie de l'alias de la copie d'une pré-ville ; ferme avec l'alias rogné, ou rien si annulé. */
@Component({
    selector: 'mho-pre-town-duplicate-dialog',
    templateUrl: './pre-town-duplicate-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...material_modules]
})
export class PreTownDuplicateDialogComponent {
    private readonly data: PreTownDuplicateDialogData = inject<PreTownDuplicateDialogData>(MAT_DIALOG_DATA);
    private readonly dialog_ref: MatDialogRef<PreTownDuplicateDialogComponent, string> = inject(MatDialogRef);

    protected readonly alias: WritableSignal<string> = signal<string>(this.data.alias);
    protected readonly max_length: number = PRE_TOWN_ALIAS_MAX_LENGTH;
    protected readonly valid: Signal<boolean> = computed((): boolean => {
        const length: number = this.alias().trim().length;
        return length > 0 && length <= PRE_TOWN_ALIAS_MAX_LENGTH;
    });

    /** Valide la saisie ; ignoré si l'alias est vide ou trop long. */
    protected confirm(): void {
        const trimmed: string = this.alias().trim();
        if (this.valid()) {
            this.dialog_ref.close(trimmed);
        }
    }
}
