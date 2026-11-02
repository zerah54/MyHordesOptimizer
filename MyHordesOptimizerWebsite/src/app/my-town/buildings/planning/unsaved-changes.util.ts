import { MatDialog } from '@angular/material/dialog';
import { map, Observable, of } from 'rxjs';

import { ConfirmDialogComponent, ConfirmDialogData } from '../../../_shared/confirm-dialog/confirm-dialog.component';
import { PlanningStore } from './planning.store';

/**
 * Avant de remplacer la copie de travail (autre proposition, autre jour, nouvelle proposition, sortie de la page) : les saisies en
 * attente sont appliquées, puis, s'il reste des modifications non enregistrées, l'utilisateur confirme qu'il les abandonne.
 * @param {PlanningStore} store État de la page.
 * @param {MatDialog} dialog Service des boîtes de dialogue.
 * @returns {Observable<boolean>} Vrai si l'action peut continuer.
 */
export function confirmDiscardChanges(store: PlanningStore, dialog: MatDialog): Observable<boolean> {
    store.flushEdits();
    if (!store.dirty()) {
        return of(true);
    }
    return dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
            title: $localize`Modifications non enregistrées`,
            text: $localize`Les modifications de la proposition affichée ne sont pas enregistrées et seront perdues. Continuer quand même ?`
        }
    })
        .afterClosed()
        .pipe(map((confirmed: boolean | undefined): boolean => confirmed === true));
}
