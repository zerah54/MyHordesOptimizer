import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeEnum } from '../../../../_abstract_model/enum/home.enum';
import { JobEnum } from '../../../../_abstract_model/enum/job.enum';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../../_abstract_model/types/daily-action.class';
import { Home } from '../../../../_abstract_model/types/home.class';
import { CitizenFilterSortStore } from '../../../../_shared/citizen-filters/citizen-filter-sort.store';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { BuildingPlanContentDTO, BuildingPlanDTO, emptyPlanContent, PlanCitizenDTO, PlanTaskDTO } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { createFakeStore, fakeEvaluation, FakePlanningStore } from '../planning.store.fake';
import { PlanningTrackingComponent } from './planning-tracking.component';

/**
 * Alice : galeries (faites) et Repaire ; Bob : consigne libre ; Chloé : rien.
 * @returns {BuildingPlanContentDTO} Contenu.
 */
function content(): BuildingPlanContentDTO {
    return {
        ...emptyPlanContent(),
        citizens: [
            { userId: 1, tasks: [{ id: 'a', kind: 'action', ref: 'home_scavenge', pa: 1 }, { id: 'b', kind: 'action', ref: 'home_crows', pa: 1 }] },
            { userId: 2, tasks: [{ id: 'c', kind: 'free', label: 'Veiller', pa: 0 }] }
        ]
    };
}

describe('PlanningTrackingComponent', (): void => {
    let fake: FakePlanningStore;
    let fixture: ComponentFixture<PlanningTrackingComponent>;

    /**
     * Affiche le suivi, Alice ayant fait ses galeries.
     * @param {BuildingPlanContentDTO} plan Contenu du plan.
     */
    async function render(plan: BuildingPlanContentDTO = content()): Promise<void> {
        fake = createFakeStore(plan);
        fake.citizens_full()[0].daily_actions = [Object.assign(new DailyAction(), { day: 10, action_key: 'home_scavenge' })];
        await TestBed.configureTestingModule({
            imports: [PlanningTrackingComponent],
            providers: [{ provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' }, { provide: PlanningStore, useValue: fake.store }, CitizenFilterSortStore, CitizenFiltersStore]
        }).compileComponents();
        fixture = TestBed.createComponent(PlanningTrackingComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    /**
     * Racine du composant.
     * @returns {HTMLElement} Élément.
     */
    function root(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    /**
     * Identifiants des citoyens affichés.
     * @returns {string[]} Identifiants.
     */
    function row(user_id: number): HTMLElement {
        return root().querySelector<HTMLElement>(`tr.citizen[data-user="${user_id}"]`) as HTMLElement;
    }

    function addHome(user_id: number, home: HomeEnum): HTMLButtonElement | null {
        return row(user_id).querySelector<HTMLButtonElement>(`td[data-home="${home.key}"] button[data-action="add-home"]`);
    }

    function tasksOf(user_id: number): PlanTaskDTO[] {
        return fake.draft()?.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === user_id)?.tasks ?? [];
    }

    function editButtons(user_id: number): HTMLButtonElement[] {
        return Array.from(row(user_id).querySelectorAll<HTMLButtonElement>('button[data-action="edit-task"]'));
    }

    function type(input: HTMLInputElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
    }

    afterEach((): void => {
        vi.useRealTimers();
    });

    function shown(): string[] {
        return Array.from(root().querySelectorAll<HTMLElement>('tr.citizen')).map((row: HTMLElement): string => row.dataset['user'] ?? '');
    }

    it('une ligne par citoyen avec sa fiche, ses consignes cochées si faites et son état', async (): Promise<void> => {
        await render();

        expect(shown()).toEqual(['1', '2', '3']);
        const alice: HTMLElement = root().querySelector<HTMLElement>('tr.citizen[data-user="1"]') as HTMLElement;
        expect(alice.querySelector('mho-citizen-chip')).not.toBeNull();
        const boxes: HTMLInputElement[] = Array.from(alice.querySelectorAll<HTMLInputElement>('.task input[type="checkbox"]'));
        expect(boxes.map((box: HTMLInputElement): boolean => box.checked)).toEqual([true, false]);
        expect(alice.querySelector('.state')?.textContent).toContain('1/2');
        expect(root().querySelector('tr.citizen[data-user="3"] .state')?.textContent?.trim()).toBe('—');
        expect(root().querySelector('.summary')?.textContent).toContain('0');
    });

    it('colonnes d\'habitation : niveau d\'habitation puis améliorations, masquables sur petit écran', async (): Promise<void> => {
        await render();

        const headers: HTMLElement[] = Array.from(root().querySelectorAll<HTMLElement>('thead th.home-col'));
        expect(headers.map((header: HTMLElement): string => header.dataset['home'] ?? '')).toEqual([
            HomeEnum.HOUSE_LEVEL.key, HomeEnum.KITCHEN_LEVEL.key, HomeEnum.LAB_LEVEL.key, HomeEnum.REST_LEVEL.key, HomeEnum.HOUSE_DEFENSE.key, HomeEnum.HAS_FENCE.key
        ]);
        expect(root().querySelectorAll('thead th.home-col.secondary').length).toBe(5);
        const chloe_house: HTMLImageElement | null = root().querySelector<HTMLImageElement>(`tr.citizen[data-user="3"] td[data-home="${HomeEnum.HOUSE_LEVEL.key}"] img`);
        expect(chloe_house?.getAttribute('src')).toContain('home_lv1');
        expect(root().querySelector(`tr.citizen[data-user="1"] td[data-home="${HomeEnum.REST_LEVEL.key}"]`)?.textContent).toContain('1');
        expect(root().querySelector(`tr.citizen[data-user="1"] td[data-home="${HomeEnum.KITCHEN_LEVEL.key}"]`)?.textContent?.trim()).toBe('—');
        expect(root().querySelector('tr.citizen td.home-col.secondary')).not.toBeNull();
    });

    it('détail de la maison au survol de l\'habitation : améliorations faites, sur une ligne', async (): Promise<void> => {
        await render();
        const internals: { homeSummary(citizen: Citizen): string } = fixture.componentInstance as unknown as { homeSummary(citizen: Citizen): string };

        expect(internals.homeSummary(fake.citizens_full()[0])).toBe(`${HomeEnum.REST_LEVEL.getLabel()} 1`);
        expect(internals.homeSummary(new Citizen())).toBe('');
    });

    it('habitation de niveau négatif (non défini) : tiret, sans icône', async (): Promise<void> => {
        await render();
        const chloe: Citizen = fake.citizens_full()[2];
        chloe.home = Object.assign(new Home(), { content: [{ element: HomeEnum.HOUSE_LEVEL, value: -1 }] });
        fake.citizens_full.set([...fake.citizens_full()]);
        fixture.detectChanges();

        const cell: HTMLElement | null = root().querySelector<HTMLElement>(`tr.citizen[data-user="3"] td[data-home="${HomeEnum.HOUSE_LEVEL.key}"]`);
        expect(cell?.querySelector('.home > img')).toBeNull();
        expect(cell?.textContent?.trim()).toBe('—');
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

    it('cocher une consigne l\'enregistre pour ce citoyen', async (): Promise<void> => {
        await render();

        root().querySelector<HTMLInputElement>('tr.citizen[data-user="1"] .task input[type="checkbox"]:not(:checked)')?.click();

        expect(fake.actions['setTaskDone']).toHaveBeenCalledWith(1, { id: 'b', kind: 'action', ref: 'home_crows', pa: 1 }, true);
    });

    it('un clic sans écriture réussie laisse la case dans l\'état réel', async (): Promise<void> => {
        await render();
        const box: HTMLInputElement = root().querySelector<HTMLInputElement>('tr.citizen[data-user="2"] .task input[type="checkbox"]') as HTMLInputElement;

        box.click();
        fixture.detectChanges();

        expect(fake.actions['setTaskDone']).toHaveBeenCalled();
        expect(box.checked).toBe(false);
    });

    it('niveau de maison déjà relevé : case non décochable', async (): Promise<void> => {
        await render();
        fake.draft.set({ ...content(), citizens: [{ userId: 3, tasks: [{ id: 'h', kind: 'home', level: 1, pa: 2 }] }] });
        fixture.detectChanges();

        const box: HTMLInputElement = root().querySelector<HTMLInputElement>('tr.citizen[data-user="3"] .task input[type="checkbox"]') as HTMLInputElement;
        expect(box.checked).toBe(true);
        expect(box.disabled).toBe(true);
    });

    it('jour à venir : consignes sans case ni compteur', async (): Promise<void> => {
        await render();
        fake.selected_day.set(11);
        fake.can_track.set(false);
        fixture.detectChanges();

        expect(root().querySelector('.task input[type="checkbox"]')).toBeNull();
        expect(root().querySelector('.summary')).toBeNull();
        expect(root().querySelector('tr.citizen[data-user="1"]')?.textContent).toContain('Creuser dans les galeries');
    });

    it('hors jour en cours, les cases sont désactivées', async (): Promise<void> => {
        await render();
        fake.can_track.set(false);
        fixture.detectChanges();

        const boxes: HTMLInputElement[] = Array.from(root().querySelectorAll<HTMLInputElement>('.task input[type="checkbox"]'));
        expect(boxes.length).toBeGreaterThan(0);
        expect(boxes.every((box: HTMLInputElement): boolean => box.disabled)).toBe(true);
    });

    it('filtres : métier, consigne et état', async (): Promise<void> => {
        await render();
        const component: CitizenFiltersStore = TestBed.inject(CitizenFiltersStore);

        component.citizen_filters.setJobs([JobEnum.SCOUT.key]);
        fixture.detectChanges();
        expect(shown()).toEqual(['2']);

        component.citizen_filters.setJobs([]);
        component.task.set('action:home_crows');
        fixture.detectChanges();
        expect(shown()).toEqual(['1']);

        component.task.set(null);
        component.state.set('none');
        fixture.detectChanges();
        expect(shown()).toEqual(['3']);
    });

    it('le compteur suit les filtres ; « Réinitialiser » rétablit tout', async (): Promise<void> => {
        await render();
        const component: CitizenFiltersStore = TestBed.inject(CitizenFiltersStore);

        component.task.set('action:home_scavenge');
        fixture.detectChanges();
        expect(root().querySelector('.summary')?.textContent?.replace(/\s+/g, ' ')).toContain('1 / 1');

        root().querySelector<HTMLButtonElement>('button[data-action="reset-filters"]')?.click();
        fixture.detectChanges();
        expect(shown()).toEqual(['1', '2', '3']);
        expect(root().querySelector('.summary')?.textContent?.replace(/\s+/g, ' ')).toContain('0 / 2');
    });

    it('consigne choisie : état, mise en évidence et compteur portent sur cette consigne', async (): Promise<void> => {
        await render();
        const component: CitizenFiltersStore = TestBed.inject(CitizenFiltersStore);

        component.task.set('action:home_scavenge');
        fixture.detectChanges();

        const alice: HTMLElement = root().querySelector<HTMLElement>('tr.citizen[data-user="1"]') as HTMLElement;
        expect(alice.classList.contains('todo')).toBe(false);
        expect(alice.querySelector('.state')?.textContent).toContain('Fait');
        expect(alice.querySelector('.state')?.textContent).not.toContain('1/2');
        expect(alice.querySelector('.task.focused')?.textContent).toContain('Creuser dans les galeries');
        expect(root().querySelector('.summary')?.textContent).toContain('ont fait cette consigne');
    });

    it('signale une proposition qui n\'est pas l\'effective', async (): Promise<void> => {
        await render();
        expect(root().querySelector('.not-effective')).toBeNull();

        fake.selected_plan.set({ ...(fake.selected_plan() as BuildingPlanDTO), isEffective: false });
        fixture.detectChanges();
        expect(root().querySelector('.not-effective')).not.toBeNull();
    });

    describe('saisie des consignes', (): void => {
        it('« + » d\'une amélioration : consigne au niveau suivant, puis un niveau de plus, PA des niveaux manquants', async (): Promise<void> => {
            await render();
            const kitchen = (): PlanTaskDTO | undefined => tasksOf(3).find((task: PlanTaskDTO): boolean => task.ref === HomeEnum.KITCHEN_LEVEL.key);

            addHome(3, HomeEnum.KITCHEN_LEVEL)?.click();
            fixture.detectChanges();
            expect(kitchen()).toEqual(expect.objectContaining({ kind: 'homeUpgrade', level: 1, pa: 6 }));

            addHome(3, HomeEnum.KITCHEN_LEVEL)?.click();
            fixture.detectChanges();
            expect(kitchen()).toEqual(expect.objectContaining({ level: 2, pa: 9 }));
            expect(tasksOf(3).length).toBe(1);
        });

        it('habitation sous le niveau 1 : ni « + » ni menu d\'amélioration, sauf agrandissement du jour au niveau 1', async (): Promise<void> => {
            await render();
            expect(addHome(1, HomeEnum.KITCHEN_LEVEL)).toBeNull();

            row(1).querySelector<HTMLButtonElement>('button[data-action="add-task"]')?.click();
            fixture.detectChanges();
            const entry: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>('.mat-mdc-menu-panel [data-kind="homeUpgrade"]');
            expect(entry?.disabled).toBe(true);
            entry?.click();
            expect(tasksOf(1).some((task: PlanTaskDTO): boolean => task.kind === 'homeUpgrade')).toBe(false);

            fake.draft.set({ ...content(), citizens: [{ userId: 1, tasks: [{ id: 'h', kind: 'home', level: 1, pa: 2 }] }] });
            fixture.detectChanges();
            expect(addHome(1, HomeEnum.KITCHEN_LEVEL)).not.toBeNull();
        });

        it('« + » de l\'habitation : niveau suivant, une seule fois hors chaos ; absent si le niveau est inconnu ; crée l\'entrée du citoyen', async (): Promise<void> => {
            await render();
            expect(addHome(1, HomeEnum.HOUSE_LEVEL)).toBeNull();

            addHome(3, HomeEnum.HOUSE_LEVEL)?.click();
            fixture.detectChanges();

            expect(tasksOf(3)).toEqual([expect.objectContaining({ kind: 'home', level: 2, pa: 4 })]);
            expect(addHome(3, HomeEnum.HOUSE_LEVEL)).toBeNull();
        });

        it('signale les bannis et les techniciens', async (): Promise<void> => {
            await render();

            expect(row(2).querySelector('.badge-banned')).not.toBeNull();
            expect(row(3).querySelector('.badge-tech')).not.toBeNull();
            expect(row(1).querySelector('.badge-banned')).toBeNull();
        });

        it('rab d\'expé : PA de base moins PA d\'expédition ; surengagement signalé', async (): Promise<void> => {
            await render({ ...content(), basePa: 10 });
            fake.evaluation.set(fakeEvaluation({ ...content(), basePa: 10 }, { expeditionPa: new Map<number, number>([[1, 4], [2, 25]]) }));
            fixture.detectChanges();

            expect(row(1).querySelector('td.rab')?.textContent?.trim()).toBe('6');
            expect(row(2).querySelector('td.capacity-cell .over-committed')).not.toBeNull();
            expect(row(1).querySelector('td.capacity-cell .over-committed')).toBeNull();
            const capacity: number | undefined = fake.evaluation()?.capacities.find((entry: { userId: number }): boolean => entry.userId === 1)?.capacity;
            expect(row(1).querySelector('td.capacity-cell .capacity')?.textContent?.trim()).toBe(`${capacity}`);
        });

        it('les PA de base saisis créent la saisie du citoyen après le débounce ; PA de base par défaut en tête', async (): Promise<void> => {
            await render();
            vi.useFakeTimers();

            type(row(3).querySelector<HTMLInputElement>('input[data-field="base-pa"]') as HTMLInputElement, '12');
            type(root().querySelector<HTMLInputElement>('input[data-field="default-pa"]') as HTMLInputElement, '15');
            expect(fake.updateDraft).not.toHaveBeenCalled();
            vi.advanceTimersByTime(400);

            expect(tasksOf(3)).toEqual([]);
            expect(fake.draft()?.citizens.find((entry: PlanCitizenDTO): boolean => entry.userId === 3)?.basePaOverride).toBe(12);
            expect(fake.draft()?.basePa).toBe(15);
        });

        it('consigne faite : libellé non cliquable ; décochée, de nouveau modifiable', async (): Promise<void> => {
            await render();
            expect(editButtons(1).map((button: HTMLButtonElement): boolean => button.disabled)).toEqual([true, false]);

            fake.citizens_full()[0].daily_actions = [];
            fake.citizens_full.set([...fake.citizens_full()]);
            fixture.detectChanges();

            expect(editButtons(1).map((button: HTMLButtonElement): boolean => button.disabled)).toEqual([false, false]);
        });

        it('niveau de maison relevé : consigne figée', async (): Promise<void> => {
            await render();
            fake.draft.set({ ...content(), citizens: [{ userId: 3, tasks: [{ id: 'h', kind: 'home', level: 1, pa: 2 }] }] });
            fixture.detectChanges();

            expect(editButtons(3).map((button: HTMLButtonElement): boolean => button.disabled)).toEqual([true]);
        });

        it('cliquer une consigne ouvre son éditeur dans un menu', async (): Promise<void> => {
            await render();

            editButtons(1)[1].click();
            fixture.detectChanges();

            expect(document.querySelector('.mat-mdc-menu-panel mho-planning-task-editor')).not.toBeNull();
        });

        it('« Supprimer » dans le menu retire la consigne et ferme le menu', async (): Promise<void> => {
            await render();
            editButtons(1)[1].click();
            fixture.detectChanges();

            document.querySelector<HTMLButtonElement>('.mat-mdc-menu-panel button[data-action="remove-task"]')?.click();
            fixture.detectChanges();
            await fixture.whenStable();

            expect(tasksOf(1).map((task: PlanTaskDTO): string | null | undefined => task.ref)).toEqual(['home_scavenge']);
            expect(document.querySelector('.mat-mdc-menu-panel mho-planning-task-editor')).toBeNull();
        });

        it('« Ajouter une consigne » > Action de chantier : première action proposée, entrée du citoyen créée', async (): Promise<void> => {
            await render();

            row(3).querySelector<HTMLButtonElement>('button[data-action="add-task"]')?.click();
            fixture.detectChanges();
            document.querySelector<HTMLButtonElement>('.mat-mdc-menu-panel [data-kind="action"]')?.click();

            expect(tasksOf(3)).toEqual([{ id: expect.stringMatching(/^[a-z0-9]{10}$/), kind: 'action', ref: 'home_crows', pa: 1 }]);
        });

        it('« Ajouter une consigne » > Libre : consigne vide', async (): Promise<void> => {
            await render();

            row(1).querySelector<HTMLButtonElement>('button[data-action="add-task"]')?.click();
            fixture.detectChanges();
            document.querySelector<HTMLButtonElement>('.mat-mdc-menu-panel [data-kind="free"]')?.click();

            expect(tasksOf(1)[2]).toEqual({ id: expect.stringMatching(/^[a-z0-9]{10}$/), kind: 'free', label: '', pa: 0 });
        });

        it('lecture seule : ni « + », ni menu, ni ajout', async (): Promise<void> => {
            await render();
            fake.can_edit.set(false);
            fixture.detectChanges();

            expect(root().querySelector('button[data-action="add-home"]')).toBeNull();
            expect(root().querySelector('button[data-action="add-task"]')).toBeNull();
            expect(editButtons(2).every((button: HTMLButtonElement): boolean => button.disabled)).toBe(true);
        });
    });
});
