import { missingResources, ResourceCount, sumResources } from './resources.util';

describe('resources.util', (): void => {
    it('sumResources additionne les quantités par objet', (): void => {
        const total: Map<number, number> = sumResources([
            [{ itemId: 5, count: 2 }, { itemId: 7, count: 1 }],
            [{ itemId: 5, count: 3 }]
        ]);
        expect(total.get(5)).toBe(5);
        expect(total.get(7)).toBe(1);
    });

    it('sumResources ignore les quantités nulles ou négatives', (): void => {
        expect(sumResources([[{ itemId: 5, count: 0 }, { itemId: 6, count: -2 }]]).size).toBe(0);
    });

    it('missingResources renvoie le manque par rapport à la banque, trié par objet', (): void => {
        const missing: ResourceCount[] = missingResources(new Map([[9, 4], [5, 2], [7, 1]]), new Map([[9, 1], [5, 5]]));
        expect(missing).toEqual([{ itemId: 7, count: 1 }, { itemId: 9, count: 3 }]);
    });

    it('missingResources est vide quand la banque couvre tout', (): void => {
        expect(missingResources(new Map([[5, 2]]), new Map([[5, 2]]))).toEqual([]);
    });
});
