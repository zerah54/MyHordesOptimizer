import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';

import { CitizenFilterSortStore } from '../../../../_shared/citizen-filters/citizen-filter-sort.store';
import { PlanningBulkTaskDialogComponent } from '../bulk-task-dialog/planning-bulk-task-dialog.component';
import { PlanningCitizenFilterSheetComponent } from '../citizen-filter-sheet/planning-citizen-filter-sheet.component';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { emptyPlanContent } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FakePlanningStore } from '../planning.store.fake';
import { PlanningCitizenFiltersComponent } from './planning-citizen-filters.component';

describe('PlanningCitizenFiltersComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningCitizenFiltersComponent>;
    let open: ReturnType<typeof vi.fn>;

    beforeEach(async (): Promise<void> => {
        fake = createFakeStore(emptyPlanContent());
        open = vi.fn((): { afterClosed: () => Observable<number | undefined> } => ({ afterClosed: (): Observable<number | undefined> => of(undefined) }));
        await TestBed.configureTestingModule({
            imports: [PlanningCitizenFiltersComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: PlanningStore, useValue: fake.store },
                CitizenFilterSortStore,
                CitizenFiltersStore
            ]
        }).overrideProvider(MatDialog, { useValue: { open } }).compileComponents();
        fixture = TestBed.createComponent(PlanningCitizenFiltersComponent);
        fixture.detectChanges();
    });

    /**
     * Bouton d'ajout massif.
     * @returns {HTMLButtonElement} Bouton.
     */
    function bulk(): HTMLButtonElement {
        return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[data-action="bulk-add"]') as HTMLButtonElement;
    }

    it('« Filtres » ouvre le volet des filtres communs au site ; le badge compte les critères actifs', (): void => {
        const button: HTMLButtonElement = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[data-action="citizen-filters"]') as HTMLButtonElement;
        TestBed.inject(CitizenFilterSortStore).setJobs(['scout']);
        fixture.detectChanges();

        button.click();

        expect(open).toHaveBeenCalledWith(PlanningCitizenFilterSheetComponent, expect.objectContaining({ panelClass: 'mho-side-sheet' }));
        expect(button.textContent).toContain('1');
    });

    it('ajout groupé inactif sans citoyen coché', (): void => {
        expect(bulk().disabled).toBe(true);
    });

    it('l\'ajout groupé ouvre la fenêtre pour les citoyens cochés, puis vide la sélection', (): void => {
        open.mockReturnValue({ afterClosed: (): Observable<number | undefined> => of(1) });
        const filters: CitizenFiltersStore = TestBed.inject(CitizenFiltersStore);
        filters.toggle(2);
        fixture.detectChanges();

        bulk().click();

        expect(open).toHaveBeenCalledWith(PlanningBulkTaskDialogComponent, expect.objectContaining({ data: { user_ids: [2] } }));
        expect(filters.selected().size).toBe(0);
    });

    it('annuler la fenêtre garde la sélection', (): void => {
        const filters: CitizenFiltersStore = TestBed.inject(CitizenFiltersStore);
        filters.toggle(2);
        fixture.detectChanges();

        bulk().click();

        expect([...filters.selected()]).toEqual([2]);
    });

    it('sans droit d\'écriture : ajout massif impossible', (): void => {
        TestBed.inject(CitizenFiltersStore).toggle(2);
        fake.can_edit.set(false);
        fixture.detectChanges();

        expect(bulk().disabled).toBe(true);
    });

    it('« Réinitialiser » n\'est actif qu\'avec un filtre', (): void => {
        const reset = (): HTMLButtonElement => (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[data-action="reset-filters"]') as HTMLButtonElement;
        expect(reset().disabled).toBe(true);

        TestBed.inject(CitizenFiltersStore).state.set('todo');
        fixture.detectChanges();
        expect(reset().disabled).toBe(false);
    });
});
