import { Action } from '../../_abstract_model/enum/action.enum';
import { Property } from '../../_abstract_model/enum/property.enum';
import { Item } from '../../_abstract_model/types/item.class';
import { ActionOutcome, ItemActionEffects } from '../../_abstract_model/types/item-action-effects.class';
import { ItemSummary } from '../../_abstract_model/types/item-summary.class';
import { GameWishlistGroup, gameWishlistGroups, matchesCriteria, selectGroupItems, WishlistCriterion } from './wishlist-criteria.util';

function buildItem(id: number, overrides: Partial<Item>): Item {
    return Object.assign(new Item(), { id, actions: [], properties: [], is_heaver: false }, overrides);
}

function groupOf(key: string): GameWishlistGroup {
    return gameWishlistGroups().find((group: GameWishlistGroup): boolean => group.key === key)!;
}

describe('wishlist-criteria.util', (): void => {
    it('B6 matches an item having the eat_6ap action', (): void => {
        const item: Item = buildItem(1, { actions: [Action.EAT_6AP] });

        expect(matchesCriteria(item, groupOf('b6').criteria)).toBe(true);
        expect(matchesCriteria(item, groupOf('b7').criteria)).toBe(false);
    });

    it('requires every criterion and rejects a heavy item when light is required', (): void => {
        const criteria: WishlistCriterion[] = [{ kind: 'action', keys: ['eat_6ap', 'eat_7ap'] }, { kind: 'heavy', value: false }];

        expect(matchesCriteria(buildItem(1, { actions: [Action.EAT_7AP] }), criteria)).toBe(true);
        expect(matchesCriteria(buildItem(2, { actions: [Action.EAT_7AP], is_heaver: true }), criteria)).toBe(false);
    });

    it('ignores action and property keys unknown to the site (undefined after dtoToModel)', (): void => {
        const item: Item = buildItem(1, {
            actions: [undefined as unknown as Action, Action.EAT_6AP],
            properties: [undefined as unknown as Property, Property.FOOD]
        });

        expect(matchesCriteria(item, groupOf('b6').criteria)).toBe(true);
        expect(matchesCriteria(item, [{ kind: 'property', keys: ['food'] }])).toBe(true);
        expect(matchesCriteria(buildItem(2, { actions: [undefined as unknown as Action] }), groupOf('b7').criteria)).toBe(false);
    });

    describe('contenants qui ne donnent que des B6 / B7', (): void => {
        /** Effet « Ouvrir » produisant (ou transformant en) les objets d'uid donnés. */
        function opening(kind: 'Produced' | 'Transformed', uids: string[]): ItemActionEffects {
            return Object.assign(new ItemActionEffects(), {
                kind: 'Open',
                outcomes: [
                    Object.assign(new ActionOutcome(), { kind: 'Consumed', item: null }),
                    ...uids.map((uid: string): ActionOutcome => Object.assign(new ActionOutcome(), { kind, item: Object.assign(new ItemSummary(), { uid }) }))
                ]
            });
        }

        const b6_a: Item = buildItem(1, { uid: 'food_bar2_#00', actions: [Action.EAT_6AP] });
        const b6_b: Item = buildItem(2, { uid: 'can_open_#00', actions: [Action.EAT_6AP] });
        const b7: Item = buildItem(3, { uid: 'meat_#00', actions: [Action.EAT_7AP] });
        const other: Item = buildItem(4, { uid: 'hmeat_#00' });
        const catalog: ReadonlyMap<string, Item> = new Map([b6_a, b6_b, b7, other].map((item: Item): [string, Item] => [item.uid, item]));

        it('range dans B6 un contenant qui ne produit que des B6 (doggy-bag)', (): void => {
            const doggy_bag: Item = buildItem(5, { action_effects: [opening('Produced', ['food_bar2_#00', 'can_open_#00'])] });
            expect(matchesCriteria(doggy_bag, groupOf('b6').criteria, catalog)).toBe(true);
            expect(matchesCriteria(doggy_bag, groupOf('b7').criteria, catalog)).toBe(false);
        });

        it('range dans B6 un objet qui ne se transforme qu\'en B6 (boîte de conserve)', (): void => {
            const can: Item = buildItem(6, { action_effects: [opening('Transformed', ['can_open_#00'])] });
            expect(matchesCriteria(can, groupOf('b6').criteria, catalog)).toBe(true);
        });

        it('range dans B7 un contenant qui ne produit que des B7 (boîte-déjeuner)', (): void => {
            const lunch_box: Item = buildItem(7, { action_effects: [opening('Produced', ['meat_#00'])] });
            expect(matchesCriteria(lunch_box, groupOf('b7').criteria, catalog)).toBe(true);
        });

        it('écarte un contenant au contenu mélangé ou inconnu', (): void => {
            const mixed: Item = buildItem(8, { action_effects: [opening('Produced', ['food_bar2_#00', 'hmeat_#00'])] });
            const unknown: Item = buildItem(9, { action_effects: [opening('Produced', ['absent_#00'])] });
            const empty: Item = buildItem(10, { action_effects: [opening('Produced', [])] });
            expect(matchesCriteria(mixed, groupOf('b6').criteria, catalog)).toBe(false);
            expect(matchesCriteria(unknown, groupOf('b6').criteria, catalog)).toBe(false);
            expect(matchesCriteria(empty, groupOf('b6').criteria, catalog)).toBe(false);
        });

        it('selectGroupItems retrouve les contenants à partir de la liste fournie', (): void => {
            const doggy_bag: Item = buildItem(5, { action_effects: [opening('Produced', ['food_bar2_#00'])] });
            const selected: Item[] = selectGroupItems([b6_a, other, doggy_bag], groupOf('b6').criteria, new Set(), new Set());
            expect(selected.map((item: Item): number => item.id)).toEqual([1, 5]);
        });
    });

    it('matches nothing with an empty criteria list', (): void => {
        expect(matchesCriteria(buildItem(1, { actions: [Action.EAT_6AP] }), [])).toBe(false);
    });

    it('splits pets by heaviness', (): void => {
        const heavy_pet: Item = buildItem(1, { properties: [Property.PET], is_heaver: true });

        expect(matchesCriteria(heavy_pet, groupOf('pet_heavy').criteria)).toBe(true);
        expect(matchesCriteria(heavy_pet, groupOf('pet_light').criteria)).toBe(false);
    });

    it('selectGroupItems adds an out-of-criteria item and removes an excluded one', (): void => {
        const a: Item = buildItem(1, { actions: [Action.EAT_6AP] });
        const b: Item = buildItem(2, { actions: [Action.EAT_6AP] });
        const c: Item = buildItem(3, {});

        const selected: Item[] = selectGroupItems([a, b, c], groupOf('b6').criteria, new Set([3]), new Set([2]));

        expect(selected.map((item: Item): number => item.id)).toEqual([1, 3]);
    });

    it('exposes 11 game groups with distinct keys', (): void => {
        const keys: string[] = gameWishlistGroups().map((group: GameWishlistGroup): string => group.key);

        expect(keys.length).toBe(11);
        expect(new Set(keys).size).toBe(11);
    });
});
