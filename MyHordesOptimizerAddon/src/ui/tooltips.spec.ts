import { describe, expect, it } from 'vitest';

import { state } from '../state';
import type { MhoItem, MhoItemSummary } from '../types';
import { createAdvancedProperties } from './tooltips';

function baseItem(overrides: Partial<MhoItem> = {}): MhoItem {
    return {
        id: 1,
        img: 'item/item_x.gif',
        label: { fr: 'X', en: 'X', de: 'X', es: 'X' },
        recipes: [],
        ...overrides
    };
}

describe('createAdvancedProperties — relation ouvre-boîte sur un container pur', () => {
    it('displays the openedWith row even when the item has no properties, actions, recipes or deco', () => {
        state.mho_parameters = { enhanced_tooltips_item_properties: true };
        state.mh_user = undefined;

        const openers: MhoItemSummary[] = [
            { uid: 'can_opener_#00', img: 'item/item_can_opener.gif', imgBroken: null, label: { fr: 'Ouvre-boîte', en: 'Can opener', de: 'Dosenöffner', es: 'Abrelatas' } }
        ];
        const item: MhoItem = baseItem({ openedWith: openers, openApCost: null, openSuccessRate: null, technicianOpenCpCost: null });

        const content: HTMLDivElement = document.createElement('div');
        createAdvancedProperties(content, item, null);

        expect(content.querySelectorAll('.item').length).toBe(1);
    });

    it('displays the opens row even when the item has no properties, actions, recipes or deco', () => {
        state.mho_parameters = { enhanced_tooltips_item_properties: true };
        state.mh_user = undefined;

        const boxes: MhoItemSummary[] = [
            { uid: 'chest_#00', img: 'item/item_chest.gif', imgBroken: null, label: { fr: 'Coffre', en: 'Chest', de: 'Truhe', es: 'Cofre' } }
        ];
        const item: MhoItem = baseItem({ opens: boxes });

        const content: HTMLDivElement = document.createElement('div');
        createAdvancedProperties(content, item, null);

        expect(content.querySelector('.mho-opener-relation-row')).not.toBeNull();
    });

    it('still returns early when the item truly has nothing to show', () => {
        state.mho_parameters = { enhanced_tooltips_item_properties: true };
        state.mh_user = undefined;

        const item: MhoItem = baseItem();

        const content: HTMLDivElement = document.createElement('div');
        createAdvancedProperties(content, item, null);

        expect(content.children.length).toBe(0);
    });
});
