import { ANIMATION_MODULE_TYPE, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import type { Mock } from 'vitest';

import { PlanningNameDialogResult } from '../name-dialog/planning-name-dialog.component';
import { BuildingPlanDTO, emptyPlanContent } from '../plan.types';
import { PlanningStore, PlanSaveState } from '../planning.store';
import { createFakeStore, FAKE_REGULAR_CITIZENS, FakePlanningStore } from '../planning.store.fake';
import { PlanningHeaderComponent } from './planning-header.component';

function plan(id: number, name: string, effective: boolean): BuildingPlanDTO {
    return { id, day: 10, name, isEffective: effective, version: 1, authorId: 9, authorName: 'Zerah', content: emptyPlanContent(), lastUpdateInfo: null };
}

describe('PlanningHeaderComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningHeaderComponent>;
    let open: Mock;

    async function render(dialog_result: PlanningNameDialogResult | undefined = undefined): Promise<void> {
        fake = createFakeStore(emptyPlanContent());
        const plans: BuildingPlanDTO[] = [plan(7, 'Plan A', true), plan(8, 'Plan B', false)];
        fake.plans_of_day.set(plans);
        fake.selected_plan.set(plans[0]);
        open = vi.fn().mockReturnValue({ afterClosed: (): unknown => of(dialog_result) });
        await TestBed.configureTestingModule({
            imports: [PlanningHeaderComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: PlanningStore, useValue: fake.store }
            ]
        }).overrideProvider(MatDialog, { useValue: { open } }).compileComponents();
        fixture = TestBed.createComponent(PlanningHeaderComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function button(action: string): HTMLButtonElement | null {
        return root().querySelector<HTMLButtonElement>(`button[data-action="${action}"]`);
    }

    function menuItem(action: string): HTMLButtonElement | null {
        return document.querySelector<HTMLButtonElement>(`.mat-mdc-menu-panel button[data-action="${action}"]`);
    }

    it('affiche le jour, signale aujourd\'hui et navigue entre les jours', async (): Promise<void> => {
        await render();

        expect(root().querySelector('.day')?.textContent).toContain('10');
        expect(root().querySelector('.today')).not.toBeNull();
        expect(button('previous-day')?.disabled).toBe(true);
        button('next-day')?.click();
        await fixture.whenStable();
        expect(fake.actions['selectDay']).toHaveBeenCalledWith(11);
    });

    describe('ville en chaos', (): void => {
        function toggle(): HTMLButtonElement | null {
            return root().querySelector<HTMLButtonElement>('mat-slide-toggle[data-field="planned-chaos"] button[role="switch"]');
        }

        it('absente le jour même : API seule', async (): Promise<void> => {
            await render();

            expect(toggle()).toBeNull();
        });

        it('jour à venir : cochée, elle est portée par la proposition', async (): Promise<void> => {
            await render();
            fake.selected_day.set(11);
            fixture.detectChanges();

            expect(toggle()?.getAttribute('aria-checked')).toBe('false');
            toggle()?.click();
            fixture.detectChanges();

            expect(fake.draft()?.chaos).toBe(true);
            expect(toggle()?.getAttribute('aria-checked')).toBe('true');
        });

        it('cochée et bloquée quand le chaos est imposé', async (): Promise<void> => {
            await render();
            fake.selected_day.set(11);
            fake.chaos_forced.set(true);
            fixture.detectChanges();

            expect(toggle()?.getAttribute('aria-checked')).toBe('true');
            expect(toggle()?.disabled).toBe(true);
        });
    });

    describe('gestion des bannis', (): void => {
        function toggle(): HTMLButtonElement {
            return root().querySelector<HTMLButtonElement>('mat-slide-toggle[data-field="manage-banned"] button[role="switch"]') as HTMLButtonElement;
        }

        it('coupée par défaut sans banni ni BDE, l\'activation est portée par la proposition', async (): Promise<void> => {
            await render();
            fake.citizens.set(FAKE_REGULAR_CITIZENS);
            fixture.detectChanges();

            expect(toggle().getAttribute('aria-checked')).toBe('false');
            expect(toggle().disabled).toBe(false);

            toggle().click();
            fixture.detectChanges();

            expect(fake.draft()?.manageBanned).toBe(true);
            expect(toggle().getAttribute('aria-checked')).toBe('true');
        });

        it('se coupe à nouveau tant que rien ne l\'impose', async (): Promise<void> => {
            await render();
            fake.citizens.set(FAKE_REGULAR_CITIZENS);
            fake.draft.set({ ...emptyPlanContent(), manageBanned: true });
            fixture.detectChanges();

            toggle().click();
            fixture.detectChanges();

            expect(fake.draft()?.manageBanned).toBe(false);
            expect(toggle().getAttribute('aria-checked')).toBe('false');
        });

        it('activée et bloquée quand la ville a un banni', async (): Promise<void> => {
            await render();

            expect(toggle().getAttribute('aria-checked')).toBe('true');
            expect(toggle().disabled).toBe(true);
        });

        it('bloquée sans droit d\'édition', async (): Promise<void> => {
            await render();
            fake.citizens.set(FAKE_REGULAR_CITIZENS);
            fake.can_edit.set(false);
            fixture.detectChanges();

            expect(toggle().disabled).toBe(true);
        });
    });

    it('une puce par proposition, l\'effective étoilée, la sélection change de proposition', async (): Promise<void> => {
        await render();

        const chips: HTMLElement[] = Array.from(root().querySelectorAll<HTMLElement>('.plan-chip'));
        expect(chips.length).toBe(2);
        expect(chips[0].classList.contains('selected')).toBe(true);
        expect(chips[0].querySelector('.effective')).not.toBeNull();
        expect(chips[1].querySelector('.effective')).toBeNull();
        chips[1].querySelector<HTMLButtonElement>('button[data-action="select-plan"]')?.click();
        await fixture.whenStable();
        expect(fake.actions['selectPlan']).toHaveBeenCalledWith(8);
    });

    it('le menu de la proposition renomme avec le nom saisi', async (): Promise<void> => {
        await render({ name: 'Plan C', copy: false });

        button('plan-menu')?.click();
        fixture.detectChanges();
        menuItem('rename')?.click();

        expect(open).toHaveBeenCalledTimes(1);
        expect(fake.actions['renamePlan']).toHaveBeenCalledWith('Plan C');
    });

    it('le menu de la proposition duplique, rend effective et supprime', async (): Promise<void> => {
        await render({ name: 'Plan A bis', copy: false });

        button('plan-menu')?.click();
        fixture.detectChanges();
        menuItem('duplicate')?.click();
        expect(fake.actions['duplicatePlan']).toHaveBeenCalledWith('Plan A bis');

        button('plan-menu')?.click();
        fixture.detectChanges();
        expect(menuItem('effective')?.disabled).toBe(true);
        menuItem('delete')?.click();
        expect(fake.actions['deletePlan']).toHaveBeenCalledTimes(1);
    });

    it('le menu copie depuis / vers un jour avec les bons jours', async (): Promise<void> => {
        await render();
        open.mockReturnValue({ afterClosed: (): unknown => of({ day: 12, name: 'Copie', parts: { budget: true, programs: false } }) });

        button('plan-menu')?.click();
        fixture.detectChanges();
        menuItem('copy-from-day')?.click();
        expect(open.mock.calls[0][1].data.askParts).toBe(true);
        expect(fake.actions['copyPlanFromDay']).toHaveBeenCalledWith(12, { budget: true, programs: false });
        expect(fake.actions['copyPlanBetweenDays']).not.toHaveBeenCalled();

        button('plan-menu')?.click();
        fixture.detectChanges();
        menuItem('copy-to-day')?.click();
        expect(open.mock.calls[1][1].data.askParts).toBe(false);
        expect(fake.actions['copyPlanBetweenDays']).toHaveBeenLastCalledWith(10, 12, 'Copie');
    });

    it('« vers » ne propose que les jours à partir d\'aujourd\'hui, « depuis » tous les jours', async (): Promise<void> => {
        await render();
        Object.assign(fake.store, { days: signal([8, 10, 11]) });

        button('plan-menu')?.click();
        fixture.detectChanges();
        menuItem('copy-to-day')?.click();
        button('plan-menu')?.click();
        fixture.detectChanges();
        menuItem('copy-from-day')?.click();

        expect(open.mock.calls[0][1].data.days).toEqual([10, 11]);
        expect(open.mock.calls[1][1].data.days).toEqual([8, 10, 11]);
    });

    it('« depuis » est désactivé sur un jour passé, « vers » reste disponible', async (): Promise<void> => {
        await render();
        fake.selected_day.set(9);
        button('plan-menu')?.click();
        fixture.detectChanges();

        expect(menuItem('copy-from-day')?.disabled).toBe(true);
        expect(menuItem('copy-to-day')?.disabled).toBe(false);
    });

    it('copie annulée : rien n\'est copié ; sans droit d\'écriture : pas de menu', async (): Promise<void> => {
        await render();
        button('plan-menu')?.click();
        fixture.detectChanges();
        menuItem('copy-to-day')?.click();
        expect(fake.actions['copyPlanBetweenDays']).not.toHaveBeenCalled();

        fake.can_edit.set(false);
        fixture.detectChanges();
        expect(button('plan-menu')).toBeNull();
    });

    describe('modifications non enregistrées', (): void => {
        it('changer de proposition ou de jour demande confirmation ; annuler ne change rien', async (): Promise<void> => {
            await render();
            fake.actions['leave'].mockResolvedValue(false);
            open.mockReturnValue({ afterClosed: (): unknown => of(false) });

            root().querySelectorAll<HTMLElement>('.plan-chip')[1].querySelector<HTMLButtonElement>('button[data-action="select-plan"]')?.click();
            await fixture.whenStable();
            button('next-day')?.click();
            await fixture.whenStable();

            expect(open).toHaveBeenCalledTimes(2);
            expect(fake.actions['selectPlan']).not.toHaveBeenCalled();
            expect(fake.actions['selectDay']).not.toHaveBeenCalled();
        });

        it('confirmer abandonne les modifications et change de proposition', async (): Promise<void> => {
            await render();
            fake.actions['leave'].mockResolvedValue(false);
            open.mockReturnValue({ afterClosed: (): unknown => of(true) });

            root().querySelectorAll<HTMLElement>('.plan-chip')[1].querySelector<HTMLButtonElement>('button[data-action="select-plan"]')?.click();
            await fixture.whenStable();

            expect(fake.actions['selectPlan']).toHaveBeenCalledWith(8);
        });

        it('enregistrement réussi : pas de confirmation, on change de proposition', async (): Promise<void> => {
            await render();

            root().querySelectorAll<HTMLElement>('.plan-chip')[1].querySelector<HTMLButtonElement>('button[data-action="select-plan"]')?.click();
            await fixture.whenStable();

            expect(fake.actions['leave']).toHaveBeenCalledTimes(1);
            expect(open).not.toHaveBeenCalled();
            expect(fake.actions['selectPlan']).toHaveBeenCalledWith(8);
        });

        it('un second changement pendant l\'enregistrement est ignoré : un seul départ, une seule bascule', async (): Promise<void> => {
            await render();
            let finish: (saved: boolean) => void = (): void => undefined;
            fake.actions['leave'].mockReturnValue(new Promise<boolean>((resolve: (saved: boolean) => void): void => {
                finish = resolve;
            }));
            const chip: HTMLButtonElement | null = root().querySelectorAll<HTMLElement>('.plan-chip')[1].querySelector<HTMLButtonElement>('button[data-action="select-plan"]');

            chip?.click();
            chip?.click();
            button('next-day')?.click();
            finish(true);
            await fixture.whenStable();

            expect(fake.actions['leave']).toHaveBeenCalledTimes(1);
            expect(fake.actions['selectPlan']).toHaveBeenCalledTimes(1);
            expect(fake.actions['selectDay']).not.toHaveBeenCalled();
        });

        it('cliquer la proposition déjà affichée ne demande rien', async (): Promise<void> => {
            await render();
            fake.dirty.set(true);

            root().querySelectorAll<HTMLElement>('.plan-chip')[0].querySelector<HTMLButtonElement>('button[data-action="select-plan"]')?.click();

            expect(open).not.toHaveBeenCalled();
            expect(fake.actions['selectPlan']).not.toHaveBeenCalled();
        });
    });

    it('supprimer demande confirmation ; annuler ne supprime rien', async (): Promise<void> => {
        await render(undefined);

        button('plan-menu')?.click();
        fixture.detectChanges();
        menuItem('delete')?.click();

        expect(open).toHaveBeenCalledTimes(1);
        expect(fake.actions['deletePlan']).not.toHaveBeenCalled();
    });

    it('une boîte annulée ne fait rien', async (): Promise<void> => {
        await render(undefined);

        button('new-plan')?.click();

        expect(fake.actions['createPlan']).not.toHaveBeenCalled();
        expect(fake.actions['duplicatePlan']).not.toHaveBeenCalled();
    });

    it('nouvelle proposition : vide ou copie de la proposition affichée', async (): Promise<void> => {
        await render({ name: 'Plan D', copy: false });
        button('new-plan')?.click();
        await fixture.whenStable();
        expect(fake.actions['createPlan']).toHaveBeenCalledWith('Plan D');

        open.mockReturnValue({ afterClosed: (): unknown => of({ name: 'Plan E', copy: true }) });
        button('new-plan')?.click();
        expect(fake.actions['duplicatePlan']).toHaveBeenCalledWith('Plan E');
    });

    it('plus de bouton Enregistrer : un indicateur affiche l\'état de l\'enregistrement', async (): Promise<void> => {
        await render();
        const texts: [PlanSaveState, string][] = [['pending', 'Enregistrement…'], ['saving', 'Enregistrement…'], ['saved', 'Enregistré'], ['error', 'Échec de l\'enregistrement']];

        expect(button('save')).toBeNull();
        expect(root().querySelector('[data-field="save-state"]')?.textContent?.trim() ?? '').toBe('');
        for (const [state, text] of texts) {
            fake.save_state.set(state);
            fixture.detectChanges();

            expect(root().querySelector('[data-field="save-state"]')?.textContent).toContain(text);
        }
    });

    it('lecture seule : ni création ni menu de proposition', async (): Promise<void> => {
        await render();
        fake.can_edit.set(false);
        fixture.detectChanges();

        expect(button('new-plan')?.disabled).toBe(true);
        expect(button('plan-menu')).toBeNull();
    });
});
