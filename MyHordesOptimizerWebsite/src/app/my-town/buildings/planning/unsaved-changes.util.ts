import { MatDialog } from '@angular/material/dialog';
import { from, map, Observable, of, switchMap } from 'rxjs';

import { ConfirmDialogComponent, ConfirmDialogData } from '../../../_shared/confirm-dialog/confirm-dialog.component';
import { PlanningStore } from './planning.store';

/**
 * Avant de quitter la proposition affichée (autre proposition, autre jour, nouvelle proposition, sortie de la page) : ce qui
 * attend est enregistré et la main libérée ; l'utilisateur ne confirme l'abandon que si l'enregistrement n'a pas abouti.
 * @param {PlanningStore} store État de la page.
 * @param {MatDialog} dialog Service des boîtes de dialogue.
 * @returns {Observable<boolean>} Vrai si l'action peut continuer.
 */
export function confirmDiscardChanges(store: PlanningStore, dialog: MatDialog): Observable<boolean> {
    return from(store.leave()).pipe(switchMap((saved: boolean): Observable<boolean> => {
        if (saved) {
            return of(true);
        }
        return dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
            data: {
                title: $localize`Modifications non enregistrées`,
                text: $localize`Les modifications de la proposition affichée n'ont pas pu être enregistrées et seront perdues. Continuer quand même ?`
            }
        })
            .afterClosed()
            .pipe(map((confirmed: boolean | undefined): boolean => confirmed === true));
    }));
}
