import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { saveCitizenChest, saveCitizenHome } from '../api/foreign-home';
import { mho_foreign_home_update_id } from '../config/constants';
import { state } from '../state';
import { createForeignHomeUpdateButton } from './foreign-home-update';

vi.mock('../utils/version', () => ({ getScriptInfo: (): { name: string; version: string } => ({ name: 'MHO Addon', version: '0.0.0' }), convertResponsePromiseToError: vi.fn() }));
vi.mock('../config/constants', async (importOriginal: () => Promise<object>): Promise<object> => ({ ...await importOriginal(), lang: 'fr' }));
vi.mock('../api/foreign-home',() => ({ saveCitizenHome: vi.fn(), saveCitizenChest: vi.fn() }));
vi.mock('../utils/item-lookup', () => ({
    resolveInventoryObjects: vi.fn((elements: Element[]): { id: number; isBroken: boolean }[] => elements.map((): { id: number; isBroken: boolean } => ({ id: 7, isBroken: false }))),
    countInventoryObjects: vi.fn((objects: { id: number; isBroken: boolean }[]): { id: number; isBroken: boolean; count: number }[] => objects.length ? [{ ...objects[0], count: objects.length }] : [])
}));

const saveCitizenHomeMock: Mock = saveCitizenHome as unknown as Mock;
const saveCitizenChestMock: Mock = saveCitizenChest as unknown as Mock;

/** Maison d'un citoyen vivant, réduite à ce que lit le relevé. */
function foreignHome(chest: string): string {
    return `
        <div class="lightbox">
            <div class="row"><div class="cell"></div><div class="cell"><img src="/build/images/home/house1.gif" /> Tente [ + 1 ]</div></div>
            <div class="row"><div class="cell"></div><div class="cell"><b>Cuisine 1</b></div></div>
            <div class="row"><div class="cell"></div><div class="cell"><img src="/build/images/icons/deco.gif"> 0</div></div>
        </div>
        <div class="row">
            <div class="padded cell rw-6 citizen-home"><button x-ajax-href="/jx/soul/321">Âme</button></div>
            <div class="padded cell rw-6 citizen-chest">${chest}</div>
        </div>`;
}

const chest_with_two_items: string = '<hordes-inventory><ul class="inventory chest"><li class="item locked"><img src="/a.gif"></li><li class="item locked"><img src="/a.gif"></li></ul></hordes-inventory>';

/** Laisse les promesses du clic se résoudre. */
const flush = (): Promise<void> => new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve);
});

/** Clique sur le bouton de mise à jour de la maison visitée. */
function clickButton(): void {
    (document.getElementById(mho_foreign_home_update_id) as HTMLButtonElement).click();
}

describe('createForeignHomeUpdateButton', (): void => {
    beforeEach((): void => {
        window.history.pushState({}, '', '/jx/town/visit/55');
        state.mho_parameters = { update_mho: true, update_mho_house: true, update_mho_chest: true };
        saveCitizenHomeMock.mockReset().mockResolvedValue(undefined);
        saveCitizenChestMock.mockReset().mockResolvedValue(undefined);
    });

    afterEach((): void => {
        document.body.innerHTML = '';
        window.history.pushState({}, '', '/');
    });

    it('n\'ajoute qu\'un bouton, même rejoué', (): void => {
        document.body.innerHTML = foreignHome(chest_with_two_items);
        createForeignHomeUpdateButton();
        createForeignHomeUpdateButton();
        expect(document.querySelectorAll(`#${mho_foreign_home_update_id}`).length).toBe(1);
    });

    it('se place sous les actions du coffre', (): void => {
        document.body.innerHTML = foreignHome(`${chest_with_two_items}<button x-action-id="enablesneak">Déposer</button>`);
        createForeignHomeUpdateButton();
        const chest: Element = document.querySelector('.citizen-chest') as Element;
        expect(chest.lastElementChild?.contains(document.getElementById(mho_foreign_home_update_id))).toBe(true);
    });

    it('n\'ajoute rien hors de la page de visite', (): void => {
        window.history.pushState({}, '', '/jx/town/house/dash');
        document.body.innerHTML = foreignHome(chest_with_two_items);
        createForeignHomeUpdateButton();
        expect(document.getElementById(mho_foreign_home_update_id)).toBeNull();
    });

    it('n\'ajoute rien quand ni la maison ni le coffre ne sont envoyés à MHO', (): void => {
        state.mho_parameters = { update_mho: false, update_mho_house: true, update_mho_chest: true };
        document.body.innerHTML = foreignHome(chest_with_two_items);
        createForeignHomeUpdateButton();
        expect(document.getElementById(mho_foreign_home_update_id)).toBeNull();
    });

    it('n\'ajoute rien chez un citoyen mort', (): void => {
        document.body.innerHTML = '<div class="citizen-home"></div><div class="citizen-chest"></div>';
        createForeignHomeUpdateButton();
        expect(document.getElementById(mho_foreign_home_update_id)).toBeNull();
    });

    it('envoie les travaux et le coffre du User visité', async (): Promise<void> => {
        document.body.innerHTML = foreignHome(chest_with_two_items);
        createForeignHomeUpdateButton();
        clickButton();
        await flush();

        expect(saveCitizenHomeMock).toHaveBeenCalledWith(321, expect.objectContaining({ houseLevel: 1, kitchenLevel: 1, hasCurtain: false }));
        expect(saveCitizenChestMock).toHaveBeenCalledWith(321, [{ id: 7, isBroken: false, count: 2 }]);
    });

    it('n\'envoie pas le coffre derrière un rideau, mais envoie les travaux', async (): Promise<void> => {
        document.body.innerHTML = foreignHome('<p class="curtain-text">Rideau</p>');
        createForeignHomeUpdateButton();
        clickButton();
        await flush();

        expect(saveCitizenHomeMock).toHaveBeenCalledTimes(1);
        expect(saveCitizenChestMock).not.toHaveBeenCalled();
    });

    it('respecte les options : coffre seul', async (): Promise<void> => {
        state.mho_parameters = { update_mho: true, update_mho_house: false, update_mho_chest: true };
        document.body.innerHTML = foreignHome(chest_with_two_items);
        createForeignHomeUpdateButton();
        clickButton();
        await flush();

        expect(saveCitizenHomeMock).not.toHaveBeenCalled();
        expect(saveCitizenChestMock).toHaveBeenCalledTimes(1);
    });
});
