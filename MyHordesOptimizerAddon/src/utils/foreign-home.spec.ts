import { afterEach, describe, expect, it } from 'vitest';

import { readForeignChestItems, readForeignHomeUserId, readForeignHomeValues } from './foreign-home';

/** Reprend la structure de `home_foreign.html.twig` (citoyen vivant). */
function foreignHome(options: { house?: string; upgrades?: string; chest?: string } = {}): string {
    return `
        <div class="lightbox"><div class="row"><div class="cell rw-9"><div class="row">
            <div class="cell rw-5"><span class="highlight">Maison :</span></div>
            <div class="cell rw-7"><img src="/build/images/home/house4.a1b2.gif" /> ${options.house ?? 'Maison'} [ + 3 <img src="/build/images/icons/def.gif" /> ]</div>
        </div><div class="row">
            <div class="cell rw-5"><span class="highlight">Métier :</span></div><div class="cell rw-7">Fouineur</div>
        </div><div class="row">
            <div class="cell rw-5"><span class="highlight">Présence :</span></div><div class="cell rw-7">En ligne</div>
        </div><div class="row">
            <div class="cell rw-5"><span class="highlight">Travaux :</span></div>
            <div class="cell rw-7">${options.upgrades ?? '<b>Cuisine 2</b>, <b>Gros rideau 1</b>, <b>Rangements 3</b>'}</div>
        </div><div class="row">
            <div class="cell rw-5"><span class="highlight">Décoration :</span></div><div class="cell rw-7"><img src="/build/images/icons/deco.gif"> 4</div>
        </div></div></div></div>
        <div class="row">
            <div class="padded cell rw-6 citizen-home"><button x-ajax-href="/jx/soul/321">Voir son âme</button></div>
            <div class="padded cell rw-6 citizen-chest">${options.chest ?? ''}</div>
        </div>`;
}

const loaded_chest: string = `
    <hordes-inventory id="foreign-home-inventory-55">
        <ul class="inventory inventory-react chest">
            <li class="item locked"><span class="item-icon"><img src="/a.gif"></span></li>
            <li class="item locked broken"><span class="item-icon"><img src="/b.gif"></span></li>
            <li class="item locked banished_hidden"><span class="item-icon"><img src="/c.gif"></span></li>
        </ul>
        <ul class="inventory inventory-react chest"><li class="item"><span class="item-icon"><img src="/mine.gif"></span></li></ul>
    </hordes-inventory>`;

describe('readForeignHomeUserId', (): void => {
    afterEach((): void => {
        document.body.innerHTML = '';
    });

    it('lit l\'id du User dans le bouton de l\'âme, pas l\'id du Citizen de l\'URL', (): void => {
        document.body.innerHTML = foreignHome();
        expect(readForeignHomeUserId()).toBe(321);
    });

    it('rend undefined hors d\'une maison de citoyen vivant', (): void => {
        document.body.innerHTML = '<div class="citizen-home"></div>';
        expect(readForeignHomeUserId()).toBeUndefined();
    });
});

describe('readForeignHomeValues', (): void => {
    afterEach((): void => {
        document.body.innerHTML = '';
    });

    it('relève l\'habitation et toutes les améliorations, absentes comprises', (): void => {
        document.body.innerHTML = foreignHome();
        expect(readForeignHomeValues('fr')).toEqual({
            houseLevel: 4,
            hasAlarm: false,
            chestLevel: 3,
            hasCurtain: true,
            renfortLevel: 0,
            kitchenLevel: 2,
            laboLevel: 0,
            restLevel: 0,
            hasLock: false,
            hasFence: false
        });
    });

    it('met tout à zéro quand la maison n\'a aucun travaux', (): void => {
        document.body.innerHTML = foreignHome({ upgrades: 'Aucun' });
        expect(readForeignHomeValues('fr')).toMatchObject({ houseLevel: 4, kitchenLevel: 0, hasCurtain: false });
    });

    it('distingue « Maison » de « Maison clôturée »', (): void => {
        document.body.innerHTML = foreignHome({ house: 'Maison clôturée' });
        expect(readForeignHomeValues('fr')?.houseLevel).toBe(5);
    });

    it('lit les libellés officiels du jeu dans la langue demandée', (): void => {
        document.body.innerHTML = foreignHome({ house: 'Castle', upgrades: '<b>More Storage 2</b>, <b>Home Laboratory 1</b>' });
        expect(readForeignHomeValues('en')).toMatchObject({ houseLevel: 8, chestLevel: 2, laboLevel: 1 });
    });

    it('refuse tout le relevé si un libellé est inconnu, plutôt que d\'écraser des données réelles', (): void => {
        document.body.innerHTML = foreignHome({ upgrades: '<b>Cuisine 2</b>, <b>Piscine 1</b>' });
        expect(readForeignHomeValues('fr')).toBeUndefined();
    });

    it('refuse le relevé si l\'habitation est inconnue', (): void => {
        document.body.innerHTML = foreignHome({ house: 'Igloo' });
        expect(readForeignHomeValues('fr')).toBeUndefined();
    });

    it('rend undefined sans ligne de travaux (citoyen mort)', (): void => {
        document.body.innerHTML = '<div class="lightbox"><div class="row"><div class="cell"><img src="/build/images/home/house1.gif" /> Tente</div></div></div>';
        expect(readForeignHomeValues('fr')).toBeUndefined();
    });
});

describe('readForeignChestItems', (): void => {
    afterEach((): void => {
        document.body.innerHTML = '';
    });

    it('lit le coffre du citoyen visité (objets verrouillés compris) sans les objets cachés ni mon propre coffre', (): void => {
        document.body.innerHTML = foreignHome({ chest: loaded_chest });
        const items: Element[] | undefined = readForeignChestItems();
        expect(items?.map((item: Element): string | null | undefined => item.querySelector('img')?.getAttribute('src'))).toEqual(['/a.gif', '/b.gif']);
    });

    it('rend un coffre vide quand la page n\'affiche aucun objet', (): void => {
        document.body.innerHTML = foreignHome({ chest: '<p>Rien d\'intéressant.</p>' });
        expect(readForeignChestItems()).toEqual([]);
    });

    it('rend undefined derrière un gros rideau', (): void => {
        document.body.innerHTML = foreignHome({ chest: '<p class="curtain-text">Un grand rideau…</p>' });
        expect(readForeignChestItems()).toBeUndefined();
    });

    it('rend undefined tant que l\'inventaire n\'est pas chargé', (): void => {
        document.body.innerHTML = foreignHome({ chest: '<hordes-inventory><ul class="inventory inventory-react chest"><li class="placeholder"></li></ul></hordes-inventory>' });
        expect(readForeignChestItems()).toBeUndefined();
    });

    it('rend undefined hors d\'une maison de citoyen vivant', (): void => {
        document.body.innerHTML = '<div></div>';
        expect(readForeignChestItems()).toBeUndefined();
    });
});
