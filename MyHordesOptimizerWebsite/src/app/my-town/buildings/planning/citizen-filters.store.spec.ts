import { TestBed } from '@angular/core/testing';

import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { CitizenFiltersStore } from './citizen-filters.store';
import { BuildingPlanContentDTO, emptyPlanContent } from './plan.types';
import { PlanningStore } from './planning.store';
import { createFakeStore, FakePlanningStore } from './planning.store.fake';

/**
 * Alice : galeries ; Bob : consigne libre ; Chloé : rien.
 * @returns {BuildingPlanContentDTO} Contenu.
 */
function content(): BuildingPlanContentDTO {
    return {
        ...emptyPlanContent(),
        citizens: [
            { userId: 1, tasks: [{ id: 'a', kind: 'action', ref: 'home_scavenge', pa: 3 }] },
            { userId: 2, tasks: [{ id: 'c', kind: 'free', label: 'Veiller', pa: 0 }] }
        ]
    };
}

describe('CitizenFiltersStore', (): void => {
    let fake: FakePlanningStore;
    let filters: CitizenFiltersStore;

    beforeEach((): void => {
        fake = createFakeStore(content());
        TestBed.configureTestingModule({ providers: [CitizenFiltersStore, { provide: PlanningStore, useValue: fake.store }] });
        filters = TestBed.inject(CitizenFiltersStore);
    });

    it('sans filtre : tous les citoyens vivants', (): void => {
        expect([...filters.shown_user_ids()]).toEqual([1, 2, 3]);
        expect(filters.filtered()).toBe(false);
    });

    it('métier, consigne et état restreignent les citoyens retenus ; réinitialiser rétablit tout', (): void => {
        filters.onJobs([JobEnum.SCOUT.key, JobEnum.TECHNICIAN.key]);
        expect([...filters.shown_user_ids()]).toEqual([2, 3]);

        filters.jobs.set(new Set<string>());
        filters.task.set('action:home_scavenge');
        filters.state.set('todo');
        expect([...filters.shown_user_ids()]).toEqual([1]);
        expect(filters.filtered()).toBe(true);

        filters.reset();
        expect([...filters.shown_user_ids()]).toEqual([1, 2, 3]);
    });

    it('sélection : cocher un citoyen, tout cocher puis tout décocher', (): void => {
        filters.toggle(2);
        expect([...filters.selected()]).toEqual([2]);
        expect(filters.all_selected()).toBe(false);

        filters.toggleAll();
        expect([...filters.selected()]).toEqual([1, 2, 3]);
        expect(filters.all_selected()).toBe(true);

        filters.toggleAll();
        expect(filters.selected().size).toBe(0);
    });

    it('un citoyen masqué par un filtre sort de la sélection, même une fois le filtre retiré', (): void => {
        filters.toggleAll();
        filters.onJobs([JobEnum.SCOUT.key]);
        expect([...filters.selected()]).toEqual([2]);

        filters.reset();
        expect([...filters.selected()]).toEqual([2]);
    });

    it('options : métiers présents, consignes présentes, poche seulement s\'il y a des bannis', (): void => {
        expect(filters.job_options().map((job: JobEnum): string => job.key)).toEqual([JobEnum.SCAVENGER.key, JobEnum.SCOUT.key, JobEnum.TECHNICIAN.key].sort((a: string, b: string): number =>
            JobEnum.getAllValues<JobEnum>().findIndex((job: JobEnum): boolean => job.key === a) - JobEnum.getAllValues<JobEnum>().findIndex((job: JobEnum): boolean => job.key === b)));
        expect(filters.task_options().map((option: { key: string }): string => option.key)).toEqual(['action:home_scavenge', 'free']);
        expect(filters.has_banned()).toBe(true);
    });
});
