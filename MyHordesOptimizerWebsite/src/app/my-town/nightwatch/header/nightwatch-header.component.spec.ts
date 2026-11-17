import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import type { Mock } from 'vitest';

import { PlanningNameDialogResult } from '../../buildings/planning/name-dialog/planning-name-dialog.component';
import { NightwatchStore } from '../nightwatch.store';
import { createFakeNightwatchStore, FakeNightwatchStore } from '../nightwatch.store.fake';
import { NightwatchPlanDTO } from '../nightwatch.types';
import { NightwatchHeaderComponent } from './nightwatch-header.component';

describe('NightwatchHeaderComponent', (): void => {
    let fake: FakeNightwatchStore;
    let fixture: ComponentFixture<NightwatchHeaderComponent>;
    let open: Mock;

    async function render(dialog_result: PlanningNameDialogResult | boolean | undefined = undefined): Promise<void> {
        fake = createFakeNightwatchStore();
        open = vi.fn().mockReturnValue({ afterClosed: (): unknown => of(dialog_result) });
        await TestBed.configureTestingModule({
            imports: [NightwatchHeaderComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }, { provide: NightwatchStore, useValue: fake.store }]
        }).overrideProvider(MatDialog, { useValue: { open } }).compileComponents();
        fixture = TestBed.createComponent(NightwatchHeaderComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    afterEach((): void => {
        TestBed.resetTestingModule();
    });

    it('liste les propositions du jour et sélectionne une autre', async (): Promise<void> => {
        await render();
        const base: NightwatchPlanDTO = fake.selected_plan() as NightwatchPlanDTO;
        fake.plans_of_day.set([{ ...base, id: 7, name: 'Plan A' }, { ...base, id: 8, name: 'Plan B', isEffective: false }]);
        fixture.detectChanges();

        root().querySelectorAll<HTMLButtonElement>('button[data-action="select-plan"]')[1].click();

        expect(root().textContent).toContain('Plan A');
        expect(fake.actions.selectPlan).toHaveBeenCalledWith(8);
    });

    it('accessibilité : proposition sélectionnée annoncée, pas de liste contenant le bouton, étoile nommée', async (): Promise<void> => {
        await render();
        const base: NightwatchPlanDTO = fake.selected_plan() as NightwatchPlanDTO;
        fake.plans_of_day.set([{ ...base, id: 7, name: 'Plan A' }, { ...base, id: 8, name: 'Plan B', isEffective: false }]);
        fake.selected_plan.set({ ...base, id: 7, name: 'Plan A' });
        fixture.detectChanges();

        const buttons: HTMLButtonElement[] = Array.from(root().querySelectorAll<HTMLButtonElement>('button[data-action="select-plan"]'));
        expect(buttons.map((button: HTMLButtonElement): string | null => button.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
        expect(root().querySelector('[role="list"]')).toBeNull();
        expect(root().querySelector('mat-icon.effective')?.getAttribute('aria-label')).toBeTruthy();
    });

    it('créer / dupliquer / rendre effective restent possibles quand un autre tient la proposition affichée (can_write sans can_edit)', async (): Promise<void> => {
        await render();
        fake.can_write.set(true);
        fake.can_edit.set(false);
        fake.selected_plan.set({ ...(fake.selected_plan() as NightwatchPlanDTO), isEffective: false });
        fixture.detectChanges();

        expect(root().querySelector<HTMLButtonElement>('button[data-action="new-plan"]')?.disabled).toBe(false);
        await openMenu();
        expect(menuItem('duplicate')).not.toBeNull();
        expect(menuItem('effective')?.disabled).toBe(false);
    });

    async function openMenu(): Promise<void> {
        root().querySelector<HTMLButtonElement>('button[data-action="plan-menu"]')?.click();
        fixture.detectChanges();
        await fixture.whenStable();
    }

    function menuItem(action: string): HTMLButtonElement | null {
        return document.querySelector<HTMLButtonElement>(`.mat-mdc-menu-panel button[data-action="${action}"]`);
    }

    it('renomme la proposition affichée', async (): Promise<void> => {
        await render({ name: 'Nouveau', copy: false });
        await openMenu();

        menuItem('rename')?.click();

        expect(fake.actions.renamePlan).toHaveBeenCalledWith('Nouveau');
    });

    it('duplique la proposition affichée sous le nom saisi', async (): Promise<void> => {
        await render({ name: 'Copie', copy: false });
        await openMenu();

        menuItem('duplicate')?.click();

        expect(fake.actions.duplicatePlan).toHaveBeenCalledWith('Copie');
    });

    it('supprime après confirmation seulement', async (): Promise<void> => {
        await render(true);
        await openMenu();

        menuItem('delete')?.click();

        expect(open).toHaveBeenCalledTimes(1);
        expect(fake.actions.deletePlan).toHaveBeenCalledTimes(1);
    });

    it('ne supprime pas si la confirmation est refusée', async (): Promise<void> => {
        await render(false);
        await openMenu();

        menuItem('delete')?.click();

        expect(fake.actions.deletePlan).not.toHaveBeenCalled();
    });

    it('change de jour', async (): Promise<void> => {
        await render();

        root().querySelector<HTMLButtonElement>('button[data-action="next-day"]')?.click();

        expect(fake.actions.selectDay).toHaveBeenCalledWith(11);
    });

    it('crée une proposition sous le nom saisi', async (): Promise<void> => {
        await render({ name: 'Plan B', copy: false });

        root().querySelector<HTMLButtonElement>('button[data-action="new-plan"]')?.click();

        expect(fake.actions.createPlan).toHaveBeenCalledWith('Plan B');
    });

    it('désactive la création sans droit de modification', async (): Promise<void> => {
        await render();
        fake.can_write.set(false);
        fixture.detectChanges();

        expect(root().querySelector<HTMLButtonElement>('button[data-action="new-plan"]')?.disabled).toBe(true);
    });

    it('affiche l\'état d\'enregistrement', async (): Promise<void> => {
        await render();
        fake.save_state.set('saved');
        fixture.detectChanges();

        expect(root().querySelector('[data-field="save-state"]')?.textContent).toContain('Enregistré');
    });
});
