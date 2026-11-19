import { ANIMATION_MODULE_TYPE, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { emptyPlanContent, PlanCitizenDTO, PlanTaskDTO, PlanTaskKind } from '../plan.types';
import { CitizenRef } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FAKE_CITIZENS, FakePlanningStore } from '../planning.store.fake';
import { PlanningBulkTaskDialogComponent, PlanningBulkTaskDialogData } from './planning-bulk-task-dialog.component';

/** Signaux du formulaire, pilotés par les tests. */
interface DialogInternals {
    kind: WritableSignal<PlanTaskKind>;
    action_key: WritableSignal<string | null>;
    upgrade_key: WritableSignal<string | null>;
    level: WritableSignal<number | null>;
    label: WritableSignal<string>;
    pa: WritableSignal<number | null>;
    uses: WritableSignal<number | null>;
}

describe('PlanningBulkTaskDialogComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningBulkTaskDialogComponent>;
    let close: ReturnType<typeof vi.fn>;

    /**
     * Ouvre la fenêtre pour des citoyens donnés.
     * @param {number[]} user_ids Citoyens visés.
     */
    async function render(user_ids: number[] = [1, 2]): Promise<void> {
        fake = createFakeStore(emptyPlanContent());
        close = vi.fn();
        await TestBed.configureTestingModule({
            imports: [PlanningBulkTaskDialogComponent],
            providers: [
                { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
                { provide: PlanningStore, useValue: fake.store },
                { provide: MatDialogRef, useValue: { close } },
                { provide: MAT_DIALOG_DATA, useValue: <PlanningBulkTaskDialogData>{ user_ids } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningBulkTaskDialogComponent);
        fixture.detectChanges();
    }

    /**
     * Accès aux signaux du formulaire.
     * @returns {DialogInternals} Signaux.
     */
    function form(): DialogInternals {
        return fixture.componentInstance as unknown as DialogInternals;
    }

    /** Valide la fenêtre. */
    function confirm(): void {
        fixture.detectChanges();
        (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[data-action="bulk-confirm"]')?.click();
    }

    /**
     * Consignes d'un citoyen dans la copie de travail.
     * @param {number} user_id Citoyen.
     * @returns {PlanTaskDTO[]} Consignes.
     */
    function tasksOf(user_id: number): PlanTaskDTO[] {
        return fake.draft()?.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === user_id)?.tasks ?? [];
    }

    /**
     * Ouvre la liste des niveaux visés.
     * @param {string} field Liste : niveaux d'amélioration ou de maison.
     * @returns {string[]} Libellés des niveaux, espaces normalisées.
     */
    function levelOptions(field: string = 'task-upgrade-level'): string[] {
        fixture.detectChanges();
        (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`mat-select[data-field="${field}"] .mat-mdc-select-trigger`)?.click();
        fixture.detectChanges();
        return Array.from(document.querySelectorAll<HTMLElement>('mat-option'))
            .map((option: HTMLElement): string => (option.textContent ?? '').replace(/\s+/g, ' ').trim());
    }

    it('amélioration : PA de chaque niveau collés à leurs parenthèses', async (): Promise<void> => {
        await render();
        form().kind.set('homeUpgrade');
        form().upgrade_key.set('kitchenLevel');

        const [next, ...options]: string[] = levelOptions();
        expect(next).toBe('Niveau suivant de chacun');
        expect(options.length).toBeGreaterThan(0);
        options.forEach((option: string): void => expect(option).toMatch(/^niv\. \d+ \(\d+\)$/));
    });

    it('maison en chaos : PA de chaque niveau collés à leurs parenthèses', async (): Promise<void> => {
        await render();
        fake.unlimited_home_levels.set(true);
        form().kind.set('home');

        const [next, ...options]: string[] = levelOptions('task-home-level');
        expect(next).toBe('Niveau suivant de chacun');
        expect(options.length).toBeGreaterThan(0);
        options.forEach((option: string): void => expect(option).toMatch(/\S \(\d+\)$/));
    });

    it('annonce le nombre de citoyens visés', async (): Promise<void> => {
        await render();

        expect((fixture.nativeElement as HTMLElement).textContent).toContain('2');
    });

    it('action de chantier : PA selon le métier de chaque citoyen', async (): Promise<void> => {
        await render();
        form().kind.set('action');
        form().action_key.set('home_scavenge');
        confirm();

        expect(tasksOf(1).map((task: PlanTaskDTO): string => `${task.ref}:${task.pa}`)).toEqual(['home_scavenge:3']);
        expect(tasksOf(2).map((task: PlanTaskDTO): string => `${task.ref}:${task.pa}`)).toEqual(['home_scavenge:2']);
        expect(close).toHaveBeenCalledWith(2);
    });

    it('amélioration : niveau visé et PA du référentiel', async (): Promise<void> => {
        await render([3]);
        form().kind.set('homeUpgrade');
        form().upgrade_key.set('kitchenLevel');
        form().level.set(2);
        confirm();

        expect(tasksOf(3)[0]).toEqual(expect.objectContaining({ kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 9 }));
    });

    it('amélioration sans niveau choisi : niveau suivant de chacun, comme en ligne', async (): Promise<void> => {
        await render([3]);
        form().kind.set('homeUpgrade');
        form().upgrade_key.set('kitchenLevel');
        confirm();

        expect(tasksOf(3)[0]).toEqual(expect.objectContaining({ kind: 'homeUpgrade', ref: 'kitchenLevel', level: 1, pa: 6 }));
    });

    it('amélioration à un seul niveau : pas de choix du niveau', async (): Promise<void> => {
        await render([3]);
        form().kind.set('homeUpgrade');
        form().upgrade_key.set('hasLock');
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).querySelector('[data-field="task-upgrade-level"]')).toBeNull();
        confirm();
        expect(tasksOf(3)[0]).toEqual(expect.objectContaining({ kind: 'homeUpgrade', ref: 'hasLock', level: 1, pa: 6 }));
    });

    it('amélioration : seuls les citoyens qui ont une habitation la reçoivent, comme en ligne', async (): Promise<void> => {
        await render([1, 3]);
        form().kind.set('homeUpgrade');
        form().upgrade_key.set('hasLock');
        confirm();

        expect(tasksOf(1)).toEqual([]);
        expect(tasksOf(3).length).toBe(1);
    });

    it('action : nombre d\'utilisations choisi, borné aux possibilités de chacun', async (): Promise<void> => {
        await render();
        form().kind.set('action');
        form().action_key.set('home_scavenge');
        form().uses.set(2);
        confirm();

        expect(tasksOf(1)[0]).toEqual(expect.objectContaining({ ref: 'home_scavenge', count: 2, pa: 2 }));
        expect(tasksOf(2)[0]).toEqual(expect.objectContaining({ ref: 'home_scavenge', pa: 2 }));
        expect(tasksOf(2)[0].count).toBeUndefined();
    });

    it('Fouiller les déchets : seuls les bannis le reçoivent hors chaos', async (): Promise<void> => {
        await render([1, 2]);
        form().kind.set('action');
        form().action_key.set('trash');
        confirm();

        expect(tasksOf(1)).toEqual([]);
        expect(tasksOf(2)[0]).toEqual(expect.objectContaining({ ref: 'trash' }));
        expect(close).toHaveBeenCalledWith(1);
    });

    it('Fouiller les déchets : proposé seulement si un citoyen visé est banni, ou en chaos', async (): Promise<void> => {
        await render([1]);
        const keys = (): string[] => (fixture.componentInstance as unknown as { action_options: () => { key: string }[] }).action_options()
            .map((action: { key: string }): string => action.key);
        expect(keys()).not.toContain('trash');

        fake.chaos_forced.set(true);
        expect(keys()).toContain('trash');
    });

    it('PA saisis : imposés à tous, quel que soit le type', async (): Promise<void> => {
        await render();
        form().kind.set('action');
        form().action_key.set('home_scavenge');
        form().pa.set(5);
        confirm();

        expect(tasksOf(1)[0].pa).toBe(5);
        expect(tasksOf(2)[0].pa).toBe(5);
    });

    it('amélioration déjà atteinte par un citoyen : il ne la reçoit pas', async (): Promise<void> => {
        await render([1, 3]);
        fake.citizens.set(FAKE_CITIZENS.map((citizen: CitizenRef): CitizenRef =>
            (citizen.userId === 1 ? { ...citizen, homeLevel: 1, upgradeLevels: new Map<string, number>([['kitchenLevel', 2]]) } : citizen)));
        form().kind.set('homeUpgrade');
        form().upgrade_key.set('kitchenLevel');
        form().level.set(2);
        confirm();

        expect(tasksOf(1)).toEqual([]);
        expect(tasksOf(3)[0]).toEqual(expect.objectContaining({ kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 9 }));
    });

    it('maison hors chaos : niveau suivant de chacun, rien sans niveau connu', async (): Promise<void> => {
        await render([1, 3]);
        form().kind.set('home');
        confirm();

        expect(tasksOf(1)).toEqual([]);
        expect(tasksOf(3)[0]).toEqual(expect.objectContaining({ kind: 'home', level: 2, pa: 4 }));
        expect(close).toHaveBeenCalledWith(1);
    });

    it('maison hors chaos : seul le niveau suivant de chacun est proposé', async (): Promise<void> => {
        await render();
        form().kind.set('home');

        expect(levelOptions('task-home-level')).toEqual(['Niveau suivant de chacun']);
    });

    it('maison en chaos sans niveau choisi : niveau suivant de chacun', async (): Promise<void> => {
        await render([3]);
        fake.unlimited_home_levels.set(true);
        form().kind.set('home');
        confirm();

        expect(tasksOf(3)[0]).toEqual(expect.objectContaining({ kind: 'home', level: 2, pa: 4 }));
    });

    it('« Travaux personnels » grisé si aucun citoyen visé n’a d’habitation', async (): Promise<void> => {
        await render([1]);
        fixture.detectChanges();
        (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('mat-select[data-field="task-kind"] .mat-mdc-select-trigger')?.click();
        fixture.detectChanges();

        const disabled: string[] = Array.from(document.querySelectorAll<HTMLElement>('mat-option[aria-disabled="true"]'))
            .map((option: HTMLElement): string => (option.textContent ?? '').trim());
        expect(disabled).toContain('Travaux personnels');
    });

    it('maison en chaos : niveau visé, PA de chaque niveau manquant', async (): Promise<void> => {
        await render([1, 3]);
        fake.unlimited_home_levels.set(true);
        fake.citizens.set(FAKE_CITIZENS.map((citizen: CitizenRef): CitizenRef => (citizen.userId === 3 ? { ...citizen, homeLevel: 0 } : citizen)));
        form().kind.set('home');
        form().level.set(2);
        confirm();

        expect(tasksOf(1)[0]).toEqual(expect.objectContaining({ kind: 'home', level: 2, pa: 4 }));
        expect(tasksOf(3)[0]).toEqual(expect.objectContaining({ kind: 'home', level: 2, pa: 6 }));
    });

    it('consigne libre : libellé et PA saisis ; libellé vide = validation impossible', async (): Promise<void> => {
        await render();
        form().kind.set('free');
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[data-action="bulk-confirm"]')?.disabled).toBe(true);

        form().label.set('Puits');
        form().pa.set(2);
        confirm();

        expect(tasksOf(1)[0]).toEqual(expect.objectContaining({ kind: 'free', label: 'Puits', pa: 2 }));
    });

    it('sans droit d\'écriture : validation impossible', async (): Promise<void> => {
        await render();
        fake.can_edit.set(false);
        form().kind.set('free');
        form().label.set('Puits');
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[data-action="bulk-confirm"]')?.disabled).toBe(true);
    });
});
