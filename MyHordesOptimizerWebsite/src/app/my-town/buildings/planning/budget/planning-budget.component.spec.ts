import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyActionEnum } from '../../../../_abstract_model/enum/daily-action.enum';
import { JobEnum } from '../../../../_abstract_model/enum/job.enum';
import { CitizenFilterSortStore } from '../../../../_shared/citizen-filters/citizen-filter-sort.store';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { BuildingPlanContentDTO, emptyPlanContent, PlanCitizenDTO, PlanTaskDTO, PlanTaskKind } from '../plan.types';
import { CitizenRef, HomeLevelRef } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FAKE_CITIZENS, FAKE_REGULAR_CITIZENS, fakeEvaluation, FakePlanningStore } from '../planning.store.fake';
import { PlanningBudgetComponent } from './planning-budget.component';

interface BudgetInternals {
    setTaskKind(user_id: number, index: number, kind: PlanTaskKind): void;
    setTaskLevel(user_id: number, index: number, level: number): void;
    setTaskAction(user_id: number, index: number, key: string): void;
    setTaskUpgradeLevel(user_id: number, index: number, level: number): void;
    setTaskCount(user_id: number, index: number, count: number): void;
    actionOptions(task: PlanTaskDTO): DailyActionEnum[];
    homeLevels(user_id: number, task: PlanTaskDTO): HomeLevelRef[];
}

function content(): BuildingPlanContentDTO {
    return {
        ...emptyPlanContent(),
        townLines: [{ label: 'Guitare', pool: 'regular', pa: 40 }],
        citizens: [{ userId: 1, tasks: [{ kind: 'free', label: 'RDE', pa: 3 }] }]
    };
}

describe('PlanningBudgetComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningBudgetComponent>;

    async function render(plan: BuildingPlanContentDTO = content()): Promise<void> {
        fake = createFakeStore(plan);
        await TestBed.configureTestingModule({
            imports: [PlanningBudgetComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }, { provide: PlanningStore, useValue: fake.store }, CitizenFilterSortStore, CitizenFiltersStore]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningBudgetComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function citizen_row(user_id: number): HTMLElement {
        return root().querySelector<HTMLElement>(`tr.citizen[data-user="${user_id}"]`) as HTMLElement;
    }

    function type(input: HTMLInputElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
    }

    afterEach((): void => {
        vi.useRealTimers();
    });

    it('sans poche des bannis affichée, aucune colonne ni ligne de poche', async (): Promise<void> => {
        await render();
        fake.citizens.set(FAKE_REGULAR_CITIZENS);
        fixture.detectChanges();

        expect(root().querySelector('.pool-summary tr[data-pool="banned"]')).toBeNull();
        expect(root().querySelector('.pool-summary')?.textContent).not.toMatch(/bannis|poche/i);
        expect(root().querySelector('tr.line mat-select')).toBeNull();
        expect(root().querySelector('table.lines')?.textContent).not.toMatch(/poche/i);
        expect(root().textContent).not.toMatch(/par poche/i);
    });

    it('une ligne par citoyen avec sa capacité calculée', async (): Promise<void> => {
        await render();

        expect(root().querySelectorAll('tr.citizen').length).toBe(3);
        expect(citizen_row(1).textContent).toContain('Alice');
        expect(citizen_row(1).querySelector('.capacity')?.textContent?.trim()).toBe('16');
        expect(citizen_row(3).querySelector('.capacity')?.textContent?.trim()).toBe('25');
    });

    it('cases de sélection : une par citoyen, l\'en-tête coche tous les affichés', async (): Promise<void> => {
        await render();
        const filters: CitizenFiltersStore = TestBed.inject(CitizenFiltersStore);

        root().querySelector<HTMLInputElement>('tr.citizen[data-user="2"] [data-field="select"] input')?.click();
        fixture.detectChanges();
        expect([...filters.selected()]).toEqual([2]);

        root().querySelector<HTMLInputElement>('thead [data-field="select-all"] input')?.click();
        fixture.detectChanges();
        expect([...filters.selected()]).toEqual([1, 2, 3]);
    });

    it('sans droit d\'écriture : pas de case de sélection', async (): Promise<void> => {
        await render();
        fake.can_edit.set(false);
        fixture.detectChanges();

        expect(root().querySelector('[data-field="select"], [data-field="select-all"]')).toBeNull();
    });

    it('signale les bannis et les techniciens', async (): Promise<void> => {
        await render();

        expect(citizen_row(2).querySelector('.badge-banned')).not.toBeNull();
        expect(citizen_row(3).querySelector('.badge-tech')).not.toBeNull();
        expect(citizen_row(1).querySelector('.badge-banned')).toBeNull();
    });

    it('affiche les PA d\'expédition et signale un citoyen sur-engagé', async (): Promise<void> => {
        await render();
        fake.evaluation.set(fakeEvaluation(content(), { expeditionPa: new Map<number, number>([[1, 25]]) }));
        fixture.detectChanges();

        expect(citizen_row(1).querySelector('.expedition')?.textContent?.trim()).toBe('25');
        expect(citizen_row(1).querySelector('.over-committed')).not.toBeNull();
        expect(citizen_row(2).querySelector('.over-committed')).toBeNull();
    });

    it('les PA de base saisis créent la saisie du citoyen après le débounce', async (): Promise<void> => {
        await render();
        vi.useFakeTimers();

        type(citizen_row(2).querySelector<HTMLInputElement>('input[data-field="base-pa"]') as HTMLInputElement, '12');
        expect(fake.updateDraft).not.toHaveBeenCalled();
        vi.advanceTimersByTime(400);

        expect(fake.draft()?.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === 2)?.basePaOverride).toBe(12);
    });

    it('ajoute, modifie et supprime une tâche libre', async (): Promise<void> => {
        await render();

        citizen_row(1).querySelector<HTMLButtonElement>('button[data-action="add-task"]')?.click();
        expect(fake.draft()?.citizens[0].tasks.length).toBe(2);
        expect(fake.draft()?.citizens[0].tasks[1]).toEqual({ id: expect.stringMatching(/^[a-z0-9]{10}$/), kind: 'free', label: '', pa: 0 });

        fixture.detectChanges();
        vi.useFakeTimers();
        type(citizen_row(1).querySelector<HTMLInputElement>('input[data-field="task-pa"]') as HTMLInputElement, '5');
        vi.advanceTimersByTime(400);
        expect(fake.draft()?.citizens[0].tasks[0].pa).toBe(5);

        vi.useRealTimers();
        fixture.detectChanges();
        citizen_row(1).querySelector<HTMLButtonElement>('button[data-action="remove-task"]')?.click();
        expect(fake.draft()?.citizens[0].tasks.length).toBe(1);
    });

    it('une tâche « maison » prend le niveau et le coût du référentiel', async (): Promise<void> => {
        await render();
        const internals: BudgetInternals = fixture.componentInstance as unknown as BudgetInternals;

        internals.setTaskKind(1, 0, 'home');
        internals.setTaskLevel(1, 0, 2);

        expect(fake.draft()?.citizens[0].tasks[0]).toEqual({ kind: 'home', label: 'RDE', pa: 4, level: 2 });
    });

    it('agrandissement : seulement le niveau suivant, sauf en chaos ou Pandémonium ; tous si le niveau est inconnu', async (): Promise<void> => {
        await render();
        const internals: BudgetInternals = fixture.componentInstance as unknown as BudgetInternals;
        fake.citizens.set(FAKE_CITIZENS.map((citizen: CitizenRef): CitizenRef => (citizen.userId === 3 ? { ...citizen, homeLevel: 0 } : citizen)));
        const levels: (user_id: number) => number[] = (user_id: number): number[] => internals.homeLevels(user_id, { kind: 'home', pa: 0 }).map((home: HomeLevelRef): number => home.level);

        expect(levels(3)).toEqual([1]);
        expect(levels(1)).toEqual([1, 2]);
        fake.unlimited_home_levels.set(true);
        expect(levels(3)).toEqual([1, 2]);
    });

    it('agrandissement de plusieurs niveaux (chaos) : PA de chaque niveau manquant', async (): Promise<void> => {
        await render({ ...content(), citizens: [{ userId: 3, tasks: [{ kind: 'home', pa: 0 }] }] });
        const internals: BudgetInternals = fixture.componentInstance as unknown as BudgetInternals;
        fake.citizens.set(FAKE_CITIZENS.map((citizen: CitizenRef): CitizenRef => (citizen.userId === 3 ? { ...citizen, homeLevel: 0 } : citizen)));

        internals.setTaskLevel(3, 0, 2);

        expect(fake.draft()?.citizens[0].tasks[0].pa).toBe(6);
    });

    it('filtres partagés avec le Suivi : barre de filtres en tête, lignes restreintes', async (): Promise<void> => {
        await render();
        expect(root().querySelector('mho-planning-citizen-filters')).not.toBeNull();

        TestBed.inject(CitizenFilterSortStore).setJobs([JobEnum.SCOUT.key]);
        fixture.detectChanges();

        expect(Array.from(root().querySelectorAll<HTMLElement>('tr.citizen')).map((row: HTMLElement): string => row.dataset['user'] ?? '')).toEqual(['2']);
    });

    it('le pseudo ouvre la fiche du citoyen, métier affiché', async (): Promise<void> => {
        await render();

        expect(citizen_row(1).querySelector('mho-citizen-chip img.job')).not.toBeNull();
    });

    it('vocabulaire unique : « consignes individuelles »', async (): Promise<void> => {
        await render();

        expect(root().querySelector('table.summary thead')?.textContent).toContain('Consignes individuelles');
        expect(citizen_row(1).querySelector('button[data-action="add-task"]')?.textContent?.trim()).toBe('Ajouter une consigne');
    });

    it('une action de chantier : choisie parmi les chantiers construits, PA selon le métier', async (): Promise<void> => {
        await render();
        const internals: BudgetInternals = fixture.componentInstance as unknown as BudgetInternals;

        internals.setTaskKind(1, 0, 'action');
        expect(fake.draft()?.citizens[0].tasks[0]).toEqual({ kind: 'action', ref: 'home_crows', pa: 1 });

        internals.setTaskAction(1, 0, 'home_scavenge');
        expect(fake.draft()?.citizens[0].tasks[0]).toEqual({ kind: 'action', ref: 'home_scavenge', pa: 3, count: 3 });
        fixture.detectChanges();
        expect(internals.actionOptions(fake.draft()?.citizens[0].tasks[0] ?? { kind: 'free', pa: 0 }).map((action: DailyActionEnum): string => action.key))
            .toEqual(['home_crows', 'home_scavenge']);
    });

    it('fouilles des galeries : le Fouineur choisit de 1 à 3 fouilles, à 1 PA chacune', async (): Promise<void> => {
        await render();
        const internals: BudgetInternals = fixture.componentInstance as unknown as BudgetInternals;
        internals.setTaskKind(1, 0, 'action');
        internals.setTaskAction(1, 0, 'home_scavenge');
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('tr.citizen[data-user="1"] [data-field="task-count"]')).not.toBeNull();

        internals.setTaskCount(1, 0, 2);
        expect(fake.draft()?.citizens[0].tasks[0]).toEqual({ kind: 'action', ref: 'home_scavenge', pa: 2, count: 2 });

        internals.setTaskCount(1, 0, 1);
        expect(fake.draft()?.citizens[0].tasks[0]).toEqual({ kind: 'action', ref: 'home_scavenge', pa: 1 });

        internals.setTaskKind(1, 0, 'free');
        expect(fake.draft()?.citizens[0].tasks[0].count).toBeUndefined();
    });

    it('fouilles des galeries : un non-Fouineur n\'a qu\'une fouille, sans choix du nombre', async (): Promise<void> => {
        await render({ ...content(), citizens: [{ userId: 3, tasks: [{ kind: 'free', label: 'RDE', pa: 3 }] }] });
        const internals: BudgetInternals = fixture.componentInstance as unknown as BudgetInternals;
        internals.setTaskKind(3, 0, 'action');
        internals.setTaskAction(3, 0, 'home_scavenge');
        fixture.detectChanges();

        expect(fake.draft()?.citizens[0].tasks[0]).toEqual({ kind: 'action', ref: 'home_scavenge', pa: 2 });
        expect(fixture.nativeElement.querySelector('tr.citizen[data-user="3"] [data-field="task-count"]')).toBeNull();
    });

    it('sans chantier à action construit : le type « Action de chantier » n\'est pas applicable', async (): Promise<void> => {
        await render();
        fake.displayable_actions.set([]);
        const internals: BudgetInternals = fixture.componentInstance as unknown as BudgetInternals;

        internals.setTaskKind(1, 0, 'action');

        expect(fake.draft()?.citizens[0].tasks[0].kind).toBe('free');
    });

    it('une amélioration : choisie au référentiel, niveau suivant celui du citoyen, PA des niveaux manquants', async (): Promise<void> => {
        await render();
        const internals: BudgetInternals = fixture.componentInstance as unknown as BudgetInternals;

        internals.setTaskKind(1, 0, 'homeUpgrade');
        expect(fake.draft()?.citizens[0].tasks[0]).toEqual({ kind: 'homeUpgrade', ref: 'kitchenLevel', level: 1, pa: 6 });

        internals.setTaskUpgradeLevel(1, 0, 2);
        expect(fake.draft()?.citizens[0].tasks[0]).toEqual({ kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 9 });
    });

    it('une amélioration au format libre reste modifiable par son libellé', async (): Promise<void> => {
        await render({ ...content(), citizens: [{ userId: 1, tasks: [{ id: 'old', kind: 'homeUpgrade', label: 'Cuisine 1', pa: 3 }] }] });

        expect((citizen_row(1).querySelector<HTMLInputElement>('input[data-field="task-label"]') as HTMLInputElement).value).toBe('Cuisine 1');
    });

    it('ajoute et supprime une ligne ville', async (): Promise<void> => {
        await render();

        root().querySelector<HTMLButtonElement>('button[data-action="add-line"]')?.click();
        expect(fake.draft()?.townLines[1]).toEqual({ label: '', pool: 'regular', pa: 0 });

        fixture.detectChanges();
        root().querySelector<HTMLButtonElement>('button[data-action="remove-line"]')?.click();
        expect(fake.draft()?.townLines.length).toBe(1);
        expect(fake.draft()?.townLines[0].label).toBe('');
    });

    it('le résumé par poche liste les bannis avant les non-bannis', async (): Promise<void> => {
        await render();

        const order: (string | null)[] = Array.from(root().querySelectorAll<HTMLElement>('.pool-summary tr[data-pool]'))
            .map((row: HTMLElement): string | null => row.getAttribute('data-pool'));
        expect(order).toEqual(['banned', 'regular']);
    });

    it('le résumé par poche marque un reste négatif', async (): Promise<void> => {
        await render({ ...content(), townLines: [{ label: 'Perte', pool: 'regular', pa: -100 }] });

        const regular: HTMLElement = root().querySelector<HTMLElement>('.pool-summary tr[data-pool="regular"]') as HTMLElement;
        expect(regular.querySelector('.remaining')?.classList.contains('negative')).toBe(true);
        const banned: HTMLElement = root().querySelector<HTMLElement>('.pool-summary tr[data-pool="banned"]') as HTMLElement;
        expect(banned.querySelector('.remaining')?.classList.contains('negative')).toBe(false);
    });

    it('lecture seule : les contrôles sont désactivés', async (): Promise<void> => {
        await render();
        fake.can_edit.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        // Les filtres restent utilisables en lecture seule ; l'ajout massif, lui, est désactivé.
        const controls: HTMLElement[] = Array.from(root().querySelectorAll<HTMLElement>('button:not(.chip), input'))
            .filter((control: HTMLElement): boolean => control.closest('mho-planning-citizen-filters') === null);
        expect(controls.length).toBeGreaterThan(0);
        expect(controls.every((control: HTMLElement): boolean => (control as HTMLButtonElement).disabled)).toBe(true);
        expect(root().querySelector<HTMLButtonElement>('button[data-action="bulk-add"]')?.disabled).toBe(true);
    });
});
