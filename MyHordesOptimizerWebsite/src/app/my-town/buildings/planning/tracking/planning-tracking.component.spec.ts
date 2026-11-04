import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeEnum } from '../../../../_abstract_model/enum/home.enum';
import { JobEnum } from '../../../../_abstract_model/enum/job.enum';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../../../_abstract_model/types/daily-action.class';
import { Home } from '../../../../_abstract_model/types/home.class';
import { CitizenFilterSortStore } from '../../../../_shared/citizen-filters/citizen-filter-sort.store';
import { CitizenFiltersStore } from '../citizen-filters.store';
import { BuildingPlanContentDTO, BuildingPlanDTO, emptyPlanContent } from '../plan.types';
import { PlanningStore } from '../planning.store';
import { createFakeStore, FakePlanningStore } from '../planning.store.fake';
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

    /** Affiche le suivi, Alice ayant fait ses galeries. */
    async function render(): Promise<void> {
        fake = createFakeStore(content());
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
        expect(cell?.querySelector('img')).toBeNull();
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
});
