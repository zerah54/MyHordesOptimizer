import { TestBed } from '@angular/core/testing';

import { JobEnum } from '../../../../_abstract_model/enum/job.enum';
import { Property } from '../../../../_abstract_model/enum/property.enum';
import { Bag } from '../../../../_abstract_model/types/bag.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { Camper, CampersStore, MAX_CAMPERS, SCOUT_VEST_UID } from './campers.store';

function citizen(id: number, name: string, job?: JobEnum): Citizen {
    const result: Citizen = new Citizen();
    result.id = id;
    result.name = name;
    result.job = job;
    return result;
}

function names(store: CampersStore): string[] {
    return store.campers().map((camper: Camper): string => camper.name || `#${camper.profile_number}`);
}

describe('CampersStore', (): void => {
    let store: CampersStore;

    beforeEach((): void => {
        store = TestBed.inject(CampersStore);
        store.useTown(1);
    });

    it('adds a town citizen once, with their job, and numbered free profiles', (): void => {
        store.addCitizen(citizen(7, 'Bob', JobEnum.SURVIVALIST));
        store.addCitizen(citizen(7, 'Bob', JobEnum.SURVIVALIST));
        store.addProfile();
        store.addCitizen(citizen(8, 'Alice'));
        store.addProfile();

        expect(names(store)).toEqual(['Bob', '#1', 'Alice', '#2']);
        expect(store.campers()[0].job).toBe(JobEnum.SURVIVALIST);
        expect(store.campers()[2].job).toBe(JobEnum.CITIZEN);
        expect(new Set(store.campers().map((camper: Camper): number => camper.key)).size).toBe(4);
    });

    it('pre-fills a citizen from MHO: campings, Repos level, intact camping items and the worn vest', (): void => {
        const scout: Citizen = citizen(7, 'Bob', JobEnum.SCOUT);
        scout.camping_count = 2;
        scout.hero_skills = { s: null, u: null, p: null, e: null, r: 3 };
        const camp_item: (uid: string, broken: boolean) => Item = (uid: string, broken: boolean): Item =>
            Object.assign(new Item(), { uid, is_broken: broken, properties: [Property.CAMP_BONUS] });
        scout.bag = new Bag();
        scout.bag.items = [
            camp_item('sheet_#00', false),
            camp_item('smelly_meat_#00', false),
            camp_item('sheet_#00', true),
            Object.assign(new Item(), { uid: SCOUT_VEST_UID, properties: [] }),
            Object.assign(new Item(), { uid: 'water_#00', properties: [Property.IS_WATER] })
        ];

        store.addCitizen(scout);
        store.addCitizen(citizen(8, 'Alice'));

        expect(store.campers()[0]).toMatchObject({ campings: 2, recluse_level: 3, objects: 2, vest: true });
        expect(store.campers()[1]).toMatchObject({ campings: 0, recluse_level: null, objects: 0, vest: false });
    });

    it('updates, removes and moves campers', (): void => {
        store.addCitizen(citizen(1, 'A'));
        store.addCitizen(citizen(2, 'B'));
        store.addCitizen(citizen(3, 'C'));
        const key_b: number = store.campers()[1].key;

        store.update(key_b, { campings: 2, pro_camper: true });
        expect(store.campers()[1]).toMatchObject({ name: 'B', campings: 2, pro_camper: true });

        store.move(2, 0);
        expect(names(store)).toEqual(['C', 'A', 'B']);
        store.move(0, 5);
        expect(names(store)).toEqual(['C', 'A', 'B']);

        store.remove(key_b);
        expect(names(store)).toEqual(['C', 'A']);
    });

    it('applies an order only when it covers exactly the current campers', (): void => {
        store.addCitizen(citizen(1, 'A'));
        store.addCitizen(citizen(2, 'B'));
        store.addCitizen(citizen(3, 'C'));

        store.applyOrder([0, 1]);
        store.applyOrder([0, 0, 1]);
        store.applyOrder([0, 1, 3]);
        expect(names(store)).toEqual(['A', 'B', 'C']);

        store.applyOrder([2, 0, 1]);
        expect(names(store)).toEqual(['C', 'A', 'B']);
    });

    it('stops at the calculation limit', (): void => {
        for (let index: number = 0; index < MAX_CAMPERS + 2; index++) {
            store.addProfile();
        }

        expect(store.campers().length).toBe(MAX_CAMPERS);
    });

    it('starts an empty group for another town, keeps it for the same town', (): void => {
        store.addCitizen(citizen(1, 'A'));
        store.useTown(1);
        expect(store.campers().length).toBe(1);

        store.useTown(2);
        expect(store.campers().length).toBe(0);
        store.addProfile();
        expect(store.campers()[0].profile_number).toBe(1);
    });
});
