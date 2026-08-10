import { ItemDTO } from '../dto/item.dto';
import { Item } from './item.class';

function buildDto(overrides: Partial<ItemDTO>): ItemDTO {
    return {
        uid: 'chest_food_#00', img: '', imgBroken: null, label: {}, description: {},
        id: 1, category: { idCategory: 1, name: 'Box', label: {}, ordering: 0 },
        deco: 0, isHeaver: false, guard: 0,
        properties: [], actions: [], recipes: [],
        openedWith: null, opens: [],
        bankCount: 0, wishListCount: 0, dropRateNotPraf: 0, dropRatePraf: 0,
        ...overrides
    };
}

describe('Item', (): void => {
    it('keeps opened_with null when the item is not a container', (): void => {
        const item: Item = new Item(buildDto({ openedWith: null }));

        expect(item.opened_with).toBeNull();
    });

    it('keeps opened_with as an empty array when the container needs no tool', (): void => {
        const item: Item = new Item(buildDto({ openedWith: [] }));

        expect(item.opened_with).toEqual([]);
    });

    it('maps opened_with entries to ItemSummary instances', (): void => {
        const item: Item = new Item(buildDto({
            openedWith: [{ uid: 'parcel_tool_#00', img: 'item_parcel_tool.gif', imgBroken: null, label: { fr: 'Pince' } }]
        }));

        expect(item.opened_with?.length).toBe(1);
        expect(item.opened_with?.[0].uid).toBe('parcel_tool_#00');
    });

    it('defaults opens to an empty array when the item opens nothing', (): void => {
        const item: Item = new Item(buildDto({ opens: [] }));

        expect(item.opens).toEqual([]);
    });

    it('round-trips opened_with through modelToDto, preserving null', (): void => {
        const item: Item = new Item(buildDto({ openedWith: null }));

        expect(item.modelToDto().openedWith).toBeNull();
    });

    it('round-trips a populated opened_with through modelToDto', (): void => {
        const item: Item = new Item(buildDto({
            openedWith: [{ uid: 'parcel_tool_#00', img: '', imgBroken: null, label: {} }]
        }));

        expect(item.modelToDto().openedWith?.map((summary) => summary.uid)).toEqual(['parcel_tool_#00']);
    });
});
