import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { Imports } from '../../../../_abstract_model/types/_types';
import { CitizenFilterPanelComponent } from '../../../../_shared/citizen-filters/citizen-filter-panel/citizen-filter-panel.component';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { PlanningStore } from '../planning.store';

const components: Imports = [CitizenFilterPanelComponent];

/** Volet latéral des filtres des citoyens de la page Chantiers : le panneau commun au site, alimenté par la page. */
@Component({
    selector: 'mho-planning-citizen-filter-sheet',
    templateUrl: './planning-citizen-filter-sheet.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...components]
})
export class PlanningCitizenFilterSheetComponent {

    protected readonly store: PlanningStore = inject(PlanningStore);
    protected readonly filters: CitizenFiltersStore = inject(CitizenFiltersStore);
    protected readonly dialog_ref: MatDialogRef<PlanningCitizenFilterSheetComponent> = inject<MatDialogRef<PlanningCitizenFilterSheetComponent>>(MatDialogRef);
}
