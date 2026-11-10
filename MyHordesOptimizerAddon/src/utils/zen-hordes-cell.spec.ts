import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { state } from '../state';
import type { MhoItem, MhoParameters } from '../types';
import type { ZenHordesCell, ZenHordesScope } from './zen-hordes-cell';
import { collectZenHordesCell, resolveZenHordesScope } from './zen-hordes-cell';

const known_item: MhoItem = { id: 42, img: 'item/known.png', label: { fr: 'Objet connu' } } as unknown as MhoItem;

function params(overrides: MhoParameters): MhoParameters {
    return { update_zen: true, ...overrides };
}

describe('resolveZenHordesScope', () => {
    it('envoie la zone quand la ville n\'est pas en Chaos', () => {
        expect(resolveZenHordesScope(params({}), false, 'none')).toEqual({ zone: true, radars: false });
    });

    it('considère une ville dont le Chaos est inconnu comme hors Chaos', () => {
        expect(resolveZenHordesScope(params({}), undefined, 'none').zone).toBe(true);
    });

    it('n\'envoie pas la zone en Chaos sans l\'option dédiée', () => {
        expect(resolveZenHordesScope(params({}), true, 'none').zone).toBe(false);
    });

    it('envoie la zone en Chaos avec l\'option dédiée', () => {
        expect(resolveZenHordesScope(params({ update_zen_devastated: true }), true, 'none').zone).toBe(true);
    });

    it('n\'envoie rien quand Zen Hordes est décoché, même avec ses options', () => {
        const scope: ZenHordesScope = resolveZenHordesScope({ update_zen: false, update_zen_devastated: true, update_zen_job_markers: true }, true, 'dig');

        expect(scope).toEqual({ zone: false, radars: false });
    });

    it.each(['dig', 'vest'])('envoie les radars du métier %s avec l\'option des marqueurs, en Chaos comme hors Chaos', (job: string) => {
        const with_markers: MhoParameters = params({ update_zen_job_markers: true });

        expect(resolveZenHordesScope(with_markers, false, job).radars).toBe(true);
        expect(resolveZenHordesScope(with_markers, true, job)).toEqual({ zone: false, radars: true });
    });

    it('n\'envoie pas les radars sans l\'option des marqueurs ni pour un autre métier', () => {
        expect(resolveZenHordesScope(params({}), false, 'dig').radars).toBe(false);
        expect(resolveZenHordesScope(params({ update_zen_job_markers: true }), false, 'none').radars).toBe(false);
    });
});

describe('collectZenHordesCell', () => {
    beforeEach(() => {
        state.items = [known_item];
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    const known_src: string = 'https://cdn.example/build/images/item/known.abc123.png';

    function desertPage(inventory: boolean = true): void {
        document.body.innerHTML = '<div class="actor zombie"></div><div class="actor zombie"></div><div class="actor splatter"></div>'
            + '<div id="mgd-zone-note"></div>'
            + (inventory
                ? `<ul class="inventory desert"><li class="item"><img src="${known_src}"></li><li class="item broken"><img src="${known_src}"></li>`
                + '<li class="item"><img src="https://cdn.example/build/images/item/unknown.abc123.png"></li></ul>'
                : '');
    }

    it('relève la zone : zombies, case épuisée et objets connus regroupés', () => {
        desertPage();

        const cell: ZenHordesCell | undefined = collectZenHordesCell(['-2', '3'], { zone: true, radars: false }, 'none');

        expect(cell).toEqual({
            x: -2,
            y: 3,
            zombies: 2,
            zoneEmpty: true,
            objects: [{ id: 42, isBroken: false, count: 1 }, { id: 42, isBroken: true, count: 1 }]
        });
    });

    it('ne touche à aucune donnée de zone quand la zone n\'est pas demandée', () => {
        desertPage();

        const cell: ZenHordesCell | undefined = collectZenHordesCell(['1', '2'], { zone: false, radars: false }, 'none');

        expect(cell).toEqual({ x: 1, y: 2 });
        expect(JSON.parse(JSON.stringify(cell))).toEqual({ x: 1, y: 2 });
    });

    it('n\'annonce pas un sol vide quand l\'inventaire du désert est absent de la page', () => {
        desertPage(false);

        const cell: ZenHordesCell | undefined = collectZenHordesCell(['1', '2'], { zone: true, radars: false }, 'none');

        expect(cell.objects).toBeUndefined();
        expect(cell.zombies).toBe(2);
    });

    it('relève le radar du fouineur', () => {
        document.body.innerHTML = '<div class="scavenger-sense scavenger-sense-north scavenger-sense-0"></div>';

        const cell: ZenHordesCell | undefined = collectZenHordesCell(['0', '0'], { zone: false, radars: true }, 'dig');

        expect(cell.scavNextCells.north).toBe(true);
        expect(cell.scoutNextCells).toBeUndefined();
    });

    it('relève le radar de l\'éclaireur', () => {
        document.body.innerHTML = '<div class="scout-sense scout-sense-east"><svg><text>4</text></svg></div>';

        const cell: ZenHordesCell | undefined = collectZenHordesCell(['0', '0'], { zone: false, radars: true }, 'vest');

        expect(cell.scoutNextCells.east).toBe(4);
        expect(cell.scavNextCells).toBeUndefined();
    });

    it('ne rend aucune case quand la position n\'est pas lisible : un null ferait refuser la requête entière', () => {
        desertPage();

        expect(collectZenHordesCell([Number.NaN as unknown as string, '2'], { zone: true, radars: false }, 'none')).toBeUndefined();
        expect(collectZenHordesCell(['x', 'y'], { zone: true, radars: false }, 'none')).toBeUndefined();
    });
});
