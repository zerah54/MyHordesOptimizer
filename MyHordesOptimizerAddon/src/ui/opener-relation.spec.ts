import { describe, expect, it } from 'vitest';

import { opener_relation_texts } from '../i18n/texts';
import type { MhoItemSummary } from '../types';
import { getI18N } from '../utils/i18n';
import { getOpenedWithRowElement, getOpenerRelationElement, getPointCostIconElement } from './opener-relation';

describe('getOpenerRelationElement', () => {
    it('renders one icon per item, wrapped in the same badge as recipe items, with the localized label as title', () => {
        const items: MhoItemSummary[] = [
            { uid: 'parcel_tool_#00', img: 'item/item_wrench.gif', imgBroken: null, label: { fr: 'Pince', en: 'Pliers', de: 'Zange', es: 'Pinza' } }
        ];

        const container: HTMLElement = getOpenerRelationElement(items);
        const badges: NodeListOf<HTMLElement> = container.querySelectorAll('.item');

        expect(badges.length).toBe(1);
        const img: HTMLImageElement | null = badges[0].querySelector('img');
        expect(img?.getAttribute('src')).toContain('item/item_wrench.gif');
        expect(img?.getAttribute('title')).toBe(getI18N(items[0].label));
        expect(badges[0].querySelector('span')).toBeNull();
    });

    it('renders one icon per item, in order', () => {
        const items: MhoItemSummary[] = [
            { uid: 'a_#00', img: 'item/item_a.gif', imgBroken: null, label: { fr: 'A', en: 'A', de: 'A', es: 'A' } },
            { uid: 'b_#00', img: 'item/item_b.gif', imgBroken: null, label: { fr: 'B', en: 'B', de: 'B', es: 'B' } }
        ];

        const container: HTMLElement = getOpenerRelationElement(items);
        const images: NodeListOf<HTMLImageElement> = container.querySelectorAll('img');

        expect(images.length).toBe(2);
        expect(images[0].getAttribute('src')).toContain('item_a.gif');
        expect(images[1].getAttribute('src')).toContain('item_b.gif');
    });

    it('renders no icon for no items', () => {
        const container: HTMLElement = getOpenerRelationElement([]);

        expect(container.querySelectorAll('img').length).toBe(0);
    });
});

describe('getPointCostIconElement', () => {
    it('builds an <img> pointing at the localized ap icon', () => {
        const img: HTMLImageElement = getPointCostIconElement('ap');

        expect(img.tagName).toBe('IMG');
        expect(img.src).toMatch(/icons\/ap_small(_\w{2})?\.gif$/);
    });

    it('builds an <img> pointing at the localized cp icon', () => {
        const img: HTMLImageElement = getPointCostIconElement('cp');

        expect(img.src).toMatch(/icons\/bp_small(_\w{2})?\.gif$/);
    });
});

describe('getOpenedWithRowElement', () => {
    const canOpener: MhoItemSummary[] = [
        { uid: 'can_opener_#00', img: 'item/item_can_opener.gif', imgBroken: null, label: { fr: 'Ouvre-boîte', en: 'Can opener', de: 'Dosenöffner', es: 'Abrelatas' } }
    ];

    it('renders the free-to-open label when there is no tool, no cost and no chance', () => {
        const row: HTMLDivElement = getOpenedWithRowElement([], null, null, null, false);

        expect(row.textContent).toBe(getI18N(opener_relation_texts.free_to_open));
    });

    it('renders tool icons without the technician suffix when the citizen is not a technician', () => {
        const row: HTMLDivElement = getOpenedWithRowElement(canOpener, null, null, 1, false);

        expect(row.querySelectorAll('.item').length).toBe(1);
        expect(row.textContent).not.toContain(getI18N(opener_relation_texts.technician_alternative));
    });

    it('appends the technician CP alternative when it exists and the citizen is a technician', () => {
        const row: HTMLDivElement = getOpenedWithRowElement(canOpener, null, null, 1, true);

        expect(row.textContent).toContain(getI18N(opener_relation_texts.technician_alternative));
        expect(row.querySelectorAll('img').length).toBe(2);
    });

    it('renders the cost and success rate when no tool is required but opening has a cost and a chance', () => {
        const row: HTMLDivElement = getOpenedWithRowElement([], 1, 0.05, null, false);

        // La valeur du coût est affectée via `header.innerText`, pas `.textContent` : jsdom
        // n'implémente pas .innerText comme un vrai navigateur (le setter ne touche pas le DOM
        // réel), donc row.textContent ne la contiendrait pas. On relit .innerText sur l'élément
        // précis (round-trip cohérent en jsdom), jamais .textContent, pour ce morceau-là.
        const header: HTMLSpanElement | null = row.querySelector('span');
        expect(header?.innerText).toContain('1');
        expect(row.textContent).toContain('5%');
        expect(row.querySelectorAll('img').length).toBe(1);
    });
});
