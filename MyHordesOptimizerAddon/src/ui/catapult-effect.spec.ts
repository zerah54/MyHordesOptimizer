import { describe, expect, it } from 'vitest';

import { catapult_effect_texts } from '../i18n/texts';
import type { MhoCatapultEffect, MhoItem } from '../types';
import { getI18N } from '../utils/i18n';
import { getCatapultEffectElement } from './catapult-effect';

function baseItem(overrides: Partial<MhoItem> = {}): MhoItem {
    return {
        id: 1,
        img: 'item/item_wood2.gif',
        label: { en: 'Wood', fr: 'Bois', de: 'Holz', es: 'Madera' },
        ...overrides
    };
}

describe('getCatapultEffectElement', () => {
    it('renvoie null pour un objet intact sans effet de zone', () => {
        const effect: MhoCatapultEffect = { fate: 'Intact' };
        expect(getCatapultEffectElement(baseItem({ catapultEffect: effect }))).toBeNull();
    });

    it('renvoie null si l\'objet ne porte aucun effet catapulte', () => {
        expect(getCatapultEffectElement(baseItem())).toBeNull();
    });

    it('affiche catapulte + flèche + objet obtenu (icône + title) pour un objet intact avec effet de zone', () => {
        const effect: MhoCatapultEffect = { fate: 'Intact', killMin: 0, killMax: 3, radius: 'Target' };
        const el = getCatapultEffectElement(baseItem({ catapultEffect: effect }));

        const images = el!.querySelectorAll('img');
        expect(images[0].src).toContain('roles/cata.gif');
        expect(images[1].src).toContain('emotes/arrowright.gif');

        const result_badge = el!.querySelector('.item img');
        expect(result_badge).not.toBeNull();
        expect(result_badge!.getAttribute('src')).toContain('item/item_wood2.gif');
        expect((result_badge as HTMLImageElement).title).toBe(getI18N({ en: 'Wood', fr: 'Bois', de: 'Holz', es: 'Madera' }));
    });

    it('affiche l\'objet transformé (icône + title), sans bordure cassée', () => {
        const morph_label = { en: 'Bad metal', fr: 'Mauvais métal', de: 'Schlechtes Metall', es: 'Metal malo' };
        const effect: MhoCatapultEffect = {
            fate: 'Transformed',
            morphTarget: { uid: 'metal_bad_#00', img: 'item/item_metal_bad.gif', label: morph_label }
        };
        const el = getCatapultEffectElement(baseItem({ catapultEffect: effect }));

        const result_badge = el!.querySelector('.item img') as HTMLImageElement;
        expect(result_badge.src).toContain('item/item_metal_bad.gif');
        expect(result_badge.title).toBe(getI18N(morph_label));
        expect(result_badge.style.border).toBe('');
    });

    it('affiche l\'objet cassé (icône cassée + bordure rouge en pointillés)', () => {
        const effect: MhoCatapultEffect = { fate: 'Broken' };
        const el = getCatapultEffectElement(baseItem({ catapultEffect: effect, imgBroken: 'item/item_wood2.b.gif' }));

        const result_badge = el!.querySelector('.item img') as HTMLImageElement;
        expect(result_badge.src).toContain('item/item_wood2.b.gif');
        expect(result_badge.style.border).toBe('1px dashed red');
    });

    it('n\'affiche aucun objet obtenu pour un objet détruit', () => {
        const effect: MhoCatapultEffect = { fate: 'Destroyed' };
        const el = getCatapultEffectElement(baseItem({ catapultEffect: effect }));

        expect(el!.querySelector('.item')).toBeNull();
    });

    it('affiche l\'icône zombie avec la plage de kills, et le rayon à côté', () => {
        const effect: MhoCatapultEffect = { fate: 'Destroyed', killMin: 11, killMax: 20, radius: 'Cross' };
        const el = getCatapultEffectElement(baseItem({ catapultEffect: effect }));

        const zombie_icon = el!.querySelector('img[src*="icons/small_zombie.gif"]');
        expect(zombie_icon).not.toBeNull();
        expect(el!.textContent).toContain('11-20');
        expect(el!.textContent).toContain(getI18N(catapult_effect_texts.radius_cross));
    });

    it('affiche la répulsion en minutes sans icône zombie', () => {
        const effect: MhoCatapultEffect = { fate: 'Destroyed', repelSeconds: 300, radius: 'Cross' };
        const el = getCatapultEffectElement(baseItem({ catapultEffect: effect }));

        expect(el!.querySelector('img[src*="icons/small_zombie.gif"]')).toBeNull();
        const expected_repel = getI18N(catapult_effect_texts.repel).replace('$minutes$', '5');
        expect(el!.textContent).toContain(expected_repel);
    });
});
