import { ChangeDetectionStrategy, Component, inject, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { Imports } from '../../../../_abstract_model/types/_types';
import { PlanningBulkTaskDialogComponent, PlanningBulkTaskDialogData } from '../bulk-task-dialog/planning-bulk-task-dialog.component';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { PlanningStore } from '../planning.store';

const material_modules: Imports = [MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatSelectModule, MatTooltipModule];

/** Filtres des citoyens (partagés entre Budget et Suivi) et ajout d'une consigne aux citoyens cochés. */
@Component({
    selector: 'mho-planning-citizen-filters',
    templateUrl: './planning-citizen-filters.component.html',
    styleUrls: ['./planning-citizen-filters.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class PlanningCitizenFiltersComponent {

    protected readonly filters: CitizenFiltersStore = inject(CitizenFiltersStore);
    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly injector: Injector = inject(Injector);

    /** Ouvre l'ajout d'une consigne aux citoyens cochés ; la sélection est vidée après l'ajout. */
    protected openBulkAdd(): void {
        this.dialog.open<PlanningBulkTaskDialogComponent, PlanningBulkTaskDialogData, number>(PlanningBulkTaskDialogComponent, {
            injector: this.injector,
            data: { user_ids: [...this.filters.selected()] },
            width: '28rem',
            maxWidth: '95vw'
        }).afterClosed().subscribe((added: number | undefined): void => {
            if (added !== undefined) {
                this.filters.selected.set(new Set<number>());
            }
        });
    }
}
