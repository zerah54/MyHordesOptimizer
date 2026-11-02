import { ChangeDetectionStrategy, Component, inject, Injector } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Imports } from '../../../../_abstract_model/types/_types';
import { CitizenSortButtonComponent } from '../../../../_shared/citizen-filters/citizen-sort-button/citizen-sort-button.component';
import { PlanningBulkTaskDialogComponent, PlanningBulkTaskDialogData } from '../bulk-task-dialog/planning-bulk-task-dialog.component';
import { PlanningCitizenFilterSheetComponent } from '../citizen-filter-sheet/planning-citizen-filter-sheet.component';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { PlanningStore } from '../planning.store';

const components: Imports = [CitizenSortButtonComponent];
const material_modules: Imports = [MatBadgeModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule, MatTooltipModule];

/** Largeur d'écran sous laquelle le volet des filtres occupe toute la largeur. */
const NARROW_SCREEN: number = 600;

/**
 * Filtres des citoyens (partagés entre Budget et Suivi) : volet des filtres communs au site, tri, consigne, état, poche ; et ajout
 * d'une consigne aux citoyens cochés.
 */
@Component({
    selector: 'mho-planning-citizen-filters',
    templateUrl: './planning-citizen-filters.component.html',
    styleUrls: ['./planning-citizen-filters.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...components, ...material_modules]
})
export class PlanningCitizenFiltersComponent {

    protected readonly filters: CitizenFiltersStore = inject(CitizenFiltersStore);
    protected readonly store: PlanningStore = inject(PlanningStore);
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly injector: Injector = inject(Injector);

    /** Ouvre le volet des filtres à droite (pleine largeur sur petit écran) ; la liste se filtre en direct derrière. */
    protected openCitizenFilters(): void {
        const narrow: boolean = typeof window !== 'undefined' && window.innerWidth < NARROW_SCREEN;
        this.dialog.open(PlanningCitizenFilterSheetComponent, {
            injector: this.injector,
            position: { right: '0', top: '0' },
            height: '100dvh',
            width: narrow ? '100vw' : '22rem',
            maxWidth: '100vw',
            panelClass: 'mho-side-sheet',
            backdropClass: 'cdk-overlay-transparent-backdrop'
        });
    }

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
