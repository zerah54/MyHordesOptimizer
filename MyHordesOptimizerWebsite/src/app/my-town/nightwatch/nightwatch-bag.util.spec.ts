import { Item } from '../../_abstract_model/types/item.class';
import { bagItems, bagItemUids, bagUsed } from './nightwatch-bag.util';

describe('nightwatch-bag.util', (): void => {
    const wood: Item = Object.assign(new Item(), { id: 5, uid: 'wood_#00', label: { fr: 'Bois' }, img: 'item/item_wood.gif' });
    const discourse: Item = Object.assign(new Item(), { id: 8, uid: 'chkspk_#00', label: { fr: 'Discours rassurant multicoloré' }, img: 'item/item_chkspk.gif' });
    const bag: Item = Object.assign(new Item(), { id: 9, uid: 'bag_#00', label: { fr: 'Sac' }, img: 'item/item_bag.gif' });

    it('contenu du sac : un objet par exemplaire puis le Discours porté ; hors catalogue omis', (): void => {
        expect(bagItems({ 5: 2, 99: 1 }, [wood, discourse], true).map((item: Item): number => item.id)).toEqual([5, 5, 8]);
        expect(bagItems({ 5: 1 }, [wood], true).map((item: Item): number => item.id)).toEqual([5]);
    });

    it('places occupées : exemplaires hors essentiels, Discours compris, hors catalogue compris', (): void => {
        expect(bagUsed({ 5: 2, 6: 1, 7: 1 }, new Set([7]), true)).toBe(4);
        expect(bagUsed({}, new Set(), false)).toBe(0);
    });

    it('uids des objets du sac (extensions comprises), inconnus ignorés', (): void => {
        expect(bagItemUids({ 5: 1, 9: 1, 99: 2 }, [wood, bag])).toEqual(['wood_#00', 'bag_#00']);
    });
});
