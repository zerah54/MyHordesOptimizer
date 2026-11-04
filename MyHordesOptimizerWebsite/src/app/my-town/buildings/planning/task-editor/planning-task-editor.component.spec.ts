import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyActionEnum } from '../../../../_abstract_model/enum/daily-action.enum';
import { UNKNOWN_HERO_SKILL_LEVELS } from '../../../../_abstract_model/types/hero-skill-levels';
import { BuildingPlanContentDTO, emptyPlanContent, PlanTaskDTO, PlanTaskKind } from '../plan.types';
import { CitizenRef, HomeLevelRef } from '../plan-evaluation.util';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FAKE_CITIZENS, FakePlanningStore } from '../planning.store.fake';
import { PlanningTaskEditorComponent } from './planning-task-editor.component';

interface EditorInternals {
    setTaskKind(kind: PlanTaskKind): void;
    setTaskLevel(level: number): void;
    setTaskAction(key: string): void;
    setTaskUpgradeLevel(level: number): void;
    setTaskCount(count: number): void;
    actionOptions(task: PlanTaskDTO): DailyActionEnum[];
    actionMaxUses(task: PlanTaskDTO): number;
    homeLevels(task: PlanTaskDTO): HomeLevelRef[];
}

/**
 * Alice (Fouineuse) a une consigne libre « RDE ».
 * @returns {BuildingPlanContentDTO} Contenu.
 */
function content(): BuildingPlanContentDTO {
    return { ...emptyPlanContent(), citizens: [{ userId: 1, tasks: [{ kind: 'free', label: 'RDE', pa: 3 }] }] };
}

describe('PlanningTaskEditorComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningTaskEditorComponent>;

    /**
     * Affiche l'éditeur d'une consigne.
     * @param {BuildingPlanContentDTO} plan Contenu du plan.
     * @param {number} user_id Citoyen.
     * @param {number} index Rang de la consigne.
     * @param {string | null} task_id Identifiant de la consigne.
     */
    async function render(plan: BuildingPlanContentDTO = content(), user_id: number = 1, index: number = 0, task_id: string | null = null): Promise<void> {
        fake = createFakeStore(plan);
        await TestBed.configureTestingModule({
            imports: [PlanningTaskEditorComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }, { provide: PlanningStore, useValue: fake.store }]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningTaskEditorComponent);
        fixture.componentRef.setInput('userId', user_id);
        fixture.componentRef.setInput('index', index);
        fixture.componentRef.setInput('taskId', task_id);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    /**
     * Méthodes protégées de l'éditeur.
     * @returns {EditorInternals} Accès.
     */
    function internals(): EditorInternals {
        return fixture.componentInstance as unknown as EditorInternals;
    }

    /**
     * Consigne éditée.
     * @param {number} entry Rang de l'entrée du citoyen.
     * @returns {PlanTaskDTO | undefined} Consigne.
     */
    function task(entry: number = 0): PlanTaskDTO | undefined {
        return fake.draft()?.citizens[entry].tasks[0];
    }

    /**
     * Racine de l'éditeur.
     * @returns {HTMLElement} Élément.
     */
    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    afterEach((): void => {
        vi.useRealTimers();
    });

    it('modifie les PA puis supprime la consigne', async (): Promise<void> => {
        await render();
        vi.useFakeTimers();
        const input: HTMLInputElement = root().querySelector<HTMLInputElement>('input[data-field="task-pa"]') as HTMLInputElement;
        input.value = '5';
        input.dispatchEvent(new Event('input'));
        vi.advanceTimersByTime(400);
        expect(task()?.pa).toBe(5);

        vi.useRealTimers();
        root().querySelector<HTMLButtonElement>('button[data-action="remove-task"]')?.click();
        expect(fake.draft()?.citizens[0].tasks.length).toBe(0);
    });

    it('un clic dans l\'éditeur ne remonte pas (le menu qui le contient reste ouvert)', async (): Promise<void> => {
        await render();
        const parent: () => void = vi.fn();
        root().addEventListener('click', parent);

        root().querySelector<HTMLElement>('.task-editor')?.click();

        expect(parent).not.toHaveBeenCalled();
    });

    it('une tâche « maison » prend le niveau et le coût du référentiel', async (): Promise<void> => {
        await render();

        internals().setTaskKind('home');
        internals().setTaskLevel(2);

        expect(task()).toEqual({ kind: 'home', label: 'RDE', pa: 4, level: 2 });
    });

    it('agrandissement : seulement le niveau suivant, sauf en chaos ou Pandémonium ; tous si le niveau est inconnu', async (): Promise<void> => {
        await render({ ...content(), citizens: [{ userId: 3, tasks: [{ kind: 'home', pa: 0 }] }] }, 3);
        fake.citizens.set(FAKE_CITIZENS.map((citizen: CitizenRef): CitizenRef => (citizen.userId === 3 ? { ...citizen, homeLevel: 0 } : citizen)));
        const levels: () => number[] = (): number[] => internals().homeLevels({ kind: 'home', pa: 0 }).map((home: HomeLevelRef): number => home.level);

        expect(levels()).toEqual([1]);
        fake.unlimited_home_levels.set(true);
        expect(levels()).toEqual([1, 2]);
    });

    it('agrandissement de plusieurs niveaux (chaos) : PA de chaque niveau manquant', async (): Promise<void> => {
        await render({ ...content(), citizens: [{ userId: 3, tasks: [{ kind: 'home', pa: 0 }] }] }, 3);
        fake.citizens.set(FAKE_CITIZENS.map((citizen: CitizenRef): CitizenRef => (citizen.userId === 3 ? { ...citizen, homeLevel: 0 } : citizen)));

        internals().setTaskLevel(2);

        expect(task()?.pa).toBe(6);
    });

    it('une action de chantier : choisie parmi les actions proposées, PA selon le métier', async (): Promise<void> => {
        await render();

        internals().setTaskKind('action');
        expect(task()).toEqual({ kind: 'action', ref: 'home_crows', pa: 1 });

        internals().setTaskAction('home_scavenge');
        expect(task()).toEqual({ kind: 'action', ref: 'home_scavenge', pa: 3, count: 3 });
        expect(internals().actionOptions(task() ?? { kind: 'free', pa: 0 }).map((action: DailyActionEnum): string => action.key))
            .toEqual(['home_crows', 'home_scavenge', 'trash']);
    });

    it('fouilles des galeries : le Fouineur choisit de 1 à 3 fouilles, à 1 PA chacune', async (): Promise<void> => {
        await render();
        internals().setTaskKind('action');
        internals().setTaskAction('home_scavenge');
        fixture.detectChanges();

        expect(root().querySelector('[data-field="task-count"]')).not.toBeNull();

        internals().setTaskCount(2);
        expect(task()).toEqual({ kind: 'action', ref: 'home_scavenge', pa: 2, count: 2 });

        internals().setTaskCount(1);
        expect(task()).toEqual({ kind: 'action', ref: 'home_scavenge', pa: 1 });

        internals().setTaskKind('free');
        expect(task()?.count).toBeUndefined();
    });

    it('fouilles des galeries : un non-Fouineur n\'a qu\'une fouille, sans choix du nombre', async (): Promise<void> => {
        await render({ ...content(), citizens: [{ userId: 3, tasks: [{ kind: 'free', label: 'RDE', pa: 3 }] }] }, 3);
        internals().setTaskKind('action');
        internals().setTaskAction('home_scavenge');
        fixture.detectChanges();

        expect(task()).toEqual({ kind: 'action', ref: 'home_scavenge', pa: 2 });
        expect(root().querySelector('[data-field="task-count"]')).toBeNull();
    });

    it('Fouiller les déchets proposée sans chantier, utilisations selon métier et groupe R', async (): Promise<void> => {
        await render();
        fake.citizens_full()[0].hero_skills = { ...UNKNOWN_HERO_SKILL_LEVELS, r: 0 };

        internals().setTaskKind('action');
        internals().setTaskAction('trash');

        expect(internals().actionMaxUses(task() ?? { kind: 'free', pa: 0 })).toBe(4);
        expect(task()).toEqual({ kind: 'action', ref: 'trash', pa: 4, count: 4 });
    });

    it('Se soigner : proposée avec l\'Infirmerie construite, 1 utilisation par défaut, 5 PA', async (): Promise<void> => {
        await render();
        fake.displayable_actions.set([DailyActionEnum.HOME_HEAL]);

        internals().setTaskKind('action');
        fixture.detectChanges();

        expect(task()).toEqual({ kind: 'action', ref: 'home_heal', pa: 5 });
        expect(root().querySelector('[data-field="task-count"]')).not.toBeNull();
    });

    it('sans action proposée : le type « Action de chantier » n\'est pas applicable', async (): Promise<void> => {
        await render();
        fake.displayable_actions.set([]);

        internals().setTaskKind('action');

        expect(task()?.kind).toBe('free');
    });

    it('une amélioration : choisie au référentiel, niveau suivant celui du citoyen, PA des niveaux manquants', async (): Promise<void> => {
        await render({ ...emptyPlanContent(), citizens: [{ userId: 3, tasks: [{ kind: 'free', label: 'RDE', pa: 3 }] }] }, 3);

        internals().setTaskKind('homeUpgrade');
        expect(task()).toEqual({ kind: 'homeUpgrade', ref: 'kitchenLevel', level: 1, pa: 6 });

        internals().setTaskUpgradeLevel(2);
        expect(task()).toEqual({ kind: 'homeUpgrade', ref: 'kitchenLevel', level: 2, pa: 9 });
    });

    it('habitation sous le niveau 1 : le type « Amélioration de maison » n\'est pas applicable', async (): Promise<void> => {
        await render();

        internals().setTaskKind('homeUpgrade');

        expect(task()?.kind).toBe('free');
    });

    it('une amélioration au format libre reste modifiable par son libellé', async (): Promise<void> => {
        await render({ ...content(), citizens: [{ userId: 1, tasks: [{ id: 'old', kind: 'homeUpgrade', label: 'Cuisine 1', pa: 3 }] }] });

        expect((root().querySelector<HTMLInputElement>('input[data-field="task-label"]') as HTMLInputElement).value).toBe('Cuisine 1');
    });

    it('le clic sur « Supprimer » remonte : le menu qui contient l\'éditeur se ferme', async (): Promise<void> => {
        await render();
        const parent: () => void = vi.fn();
        root().addEventListener('click', parent);

        root().querySelector<HTMLButtonElement>('button[data-action="remove-task"]')?.click();

        expect(parent).toHaveBeenCalled();
    });

    it('Échap et Tab remontent (ils ferment le menu), les autres touches non', async (): Promise<void> => {
        await render();
        const parent: () => void = vi.fn();
        root().addEventListener('keydown', parent);
        const input: HTMLInputElement = root().querySelector<HTMLInputElement>('input[data-field="task-pa"]') as HTMLInputElement;

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
        expect(parent).not.toHaveBeenCalled();

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
        expect(parent).toHaveBeenCalledTimes(2);
    });

    it('consigne repérée par son identifiant : elle reste la même quand une autre est retirée', async (): Promise<void> => {
        const tasks: PlanTaskDTO[] = [{ id: 'x', kind: 'free', label: 'A', pa: 1 }, { id: 'y', kind: 'free', label: 'B', pa: 2 }];
        await render({ ...emptyPlanContent(), citizens: [{ userId: 1, tasks }] }, 1, 1, 'y');
        fake.draft.set({ ...emptyPlanContent(), citizens: [{ userId: 1, tasks: [{ id: 'y', kind: 'free', label: 'B', pa: 2 }] }] });

        internals().setTaskKind('home');

        expect(fake.draft()?.citizens[0].tasks).toEqual([{ id: 'y', kind: 'home', label: 'B', pa: 2 }]);
    });
});
