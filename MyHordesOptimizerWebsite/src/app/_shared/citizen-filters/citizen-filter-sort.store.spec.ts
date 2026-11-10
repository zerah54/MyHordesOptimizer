import { CitizenFilterSortStore } from './citizen-filter-sort.store';

describe('CitizenFilterSortStore', (): void => {
    let store: CitizenFilterSortStore;

    beforeEach((): void => {
        store = new CitizenFilterSortStore();
    });

    it('un champ oui / non tourne : tous → oui → non → tous', (): void => {
        expect(store.boolValue('immune')).toBeNull();
        store.cycleBool('immune');
        expect(store.boolValue('immune')).toBe(true);
        store.cycleBool('immune');
        expect(store.boolValue('immune')).toBe(false);
        store.cycleBool('immune');
        expect(store.boolValue('immune')).toBeNull();
        expect(store.criteria().bools).toEqual({});
    });

    it('des valeurs vides retirent le critère', (): void => {
        store.setValues('home_x', [1, 2]);
        expect(store.values('home_x')).toEqual([1, 2]);
        expect(store.active_count()).toBe(1);

        store.setValues('home_x', []);
        expect(store.criteria().values).toEqual({});
        expect(store.active_count()).toBe(0);
    });

    it('réinitialiser retire tous les critères, pas le tri', (): void => {
        store.setNames([1]);
        store.setJobs(['guardian']);
        store.setBag([42]);
        store.setStatus(['drunk']);
        store.sortBy('job');
        expect(store.active_count()).toBe(4);

        store.reset();

        expect(store.active_count()).toBe(0);
        expect(store.sort_field()).toBe('job');
    });

    it('le tri tourne : croissant → décroissant → sans tri ; un autre champ repart en croissant', (): void => {
        store.sortBy('job');
        expect([store.sort_field(), store.sort_direction()]).toEqual(['job', 'asc']);
        store.sortBy('job');
        expect([store.sort_field(), store.sort_direction()]).toEqual(['job', 'desc']);
        store.sortBy('avatar_name');
        expect([store.sort_field(), store.sort_direction()]).toEqual(['avatar_name', 'asc']);
        store.sortBy('avatar_name');
        store.sortBy('avatar_name');
        expect([store.sort_field(), store.sort_direction()]).toEqual(['', '']);
    });
});
