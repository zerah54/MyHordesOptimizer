import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { getItemFromImg, resolveInventoryObjects } from './item-lookup';

const known_item = { id: 42, img: 'item/known.png', label: { fr: 'Objet connu' } } as any;

beforeEach(() => {
    state.items = [known_item];
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('getItemFromImg', () => {
    it('journalise le chemin d\'image quand aucun objet du référentiel ne correspond', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        const result = getItemFromImg('https://cdn.example/build/images/item/unknown.abc123.png');

        expect(result).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0].join(' ')).toContain('item/unknown.png');
    });

    it('ne journalise rien quand l\'objet est résolu', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        const result = getItemFromImg('https://cdn.example/build/images/item/known.abc123.png');

        expect(result).toBe(known_item);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('ne journalise rien tant que le référentiel local n\'est pas chargé', () => {
        state.items = undefined;
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        const result = getItemFromImg('https://cdn.example/build/images/item/unknown.abc123.png');

        expect(result).toBeUndefined();
        expect(warnSpy).not.toHaveBeenCalled();
    });
});

describe('resolveInventoryObjects', () => {
    function itemElement(src: string, broken = false): HTMLLIElement {
        const li = document.createElement('li');
        if (broken) li.classList.add('broken');
        const img = document.createElement('img');
        img.src = src;
        li.appendChild(img);
        return li;
    }

    it('écarte les éléments dont l\'icône est absente du référentiel, en gardant les autres', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const elements = [
            itemElement('https://cdn.example/build/images/item/known.abc123.png', true),
            itemElement('https://cdn.example/build/images/item/unknown.abc123.png')
        ];

        const result = resolveInventoryObjects(elements);

        expect(result).toEqual([{ id: 42, isBroken: true }]);
        expect(warnSpy).toHaveBeenCalledTimes(1);
    });
});
