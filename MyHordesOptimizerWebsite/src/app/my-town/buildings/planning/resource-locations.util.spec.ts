import { Bag } from '../../../_abstract_model/types/bag.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { holdersByItem, ItemHolder } from './resource-locations.util';

function bag(ids: number[], broken: number[] = []): Bag {
    return Object.assign(new Bag(), {
        items: [
            ...ids.map((id: number): Item => Object.assign(new Item(), { id, is_broken: false })),
            ...broken.map((id: number): Item => Object.assign(new Item(), { id, is_broken: true }))
        ]
    });
}

function citizen(name: string, bag_content?: Bag, chest?: Bag): Citizen {
    return Object.assign(new Citizen(), { name, bag: bag_content, chest });
}

describe('resource-locations.util', (): void => {
    it('holdersByItem : quantité de chaque citoyen par objet, cassés compris, triée par nom', (): void => {
        const holders: Map<number, ItemHolder[]> = holdersByItem([
            citizen('Zoé', bag([5, 5, 7])),
            citizen('Abel', bag([5], [5])),
            citizen('Sans sac')
        ], (holder: Citizen): Bag | undefined => holder.bag);

        expect(holders.get(5)).toEqual([{ name: 'Abel', count: 2, broken: 1 }, { name: 'Zoé', count: 2, broken: 0 }]);
        expect(holders.get(7)).toEqual([{ name: 'Zoé', count: 1, broken: 0 }]);
        expect(holders.size).toBe(2);
    });

    it('holdersByItem : lit le rangement choisi (coffre)', (): void => {
        const holders: Map<number, ItemHolder[]> = holdersByItem([citizen('Abel', bag([5]), bag([9], [9]))], (holder: Citizen): Bag | undefined => holder.chest);

        expect(holders.get(9)).toEqual([{ name: 'Abel', count: 2, broken: 1 }]);
        expect(holders.has(5)).toBe(false);
    });
});
