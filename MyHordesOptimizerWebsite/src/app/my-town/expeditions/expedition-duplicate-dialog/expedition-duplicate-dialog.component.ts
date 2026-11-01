import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ExpeditionDuplicateChoices, Imports } from '../../../_abstract_model/types/_types';

const material_modules: Imports = [MatButtonModule, MatCheckboxModule, MatDialogModule];

/** `hasRoute` : une partie au moins suit un tracé, sinon la question ne se pose pas. */
export interface ExpeditionDuplicateDialogData {
    hasRoute: boolean;
}

/** Boîte de choix de ce que reprend la copie d'une expédition. */
@Component({
    selector: 'mho-expedition-duplicate-dialog',
    templateUrl: './expedition-duplicate-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class ExpeditionDuplicateDialogComponent {

    protected readonly data: ExpeditionDuplicateDialogData = inject<ExpeditionDuplicateDialogData>(MAT_DIALOG_DATA);
    protected readonly keep_route: WritableSignal<boolean> = signal(this.data.hasRoute);
    protected readonly keep_general_orders: WritableSignal<boolean> = signal(true);
    protected readonly keep_route_orders: WritableSignal<boolean> = signal(true);

    private readonly dialog_ref: MatDialogRef<ExpeditionDuplicateDialogComponent, ExpeditionDuplicateChoices> = inject(MatDialogRef);

    /** Valide les choix : sans tracé, pas de consignes du tracé. */
    protected confirm(): void {
        this.dialog_ref.close({
            keepRoute: this.keep_route(),
            keepGeneralOrders: this.keep_general_orders(),
            keepRouteOrders: this.keep_route() && this.keep_route_orders()
        });
    }
}
