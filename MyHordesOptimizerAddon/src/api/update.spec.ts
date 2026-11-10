import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mho_sent_digs_key, mho_token_key } from '../config/constants';
import { state } from '../state';
import { fetcher } from '../utils/fetch';
import { getStorageItem, setStorageItem } from '../utils/storage';
import type { SuccessfulDigValue } from '../utils/successful-digs';
import { updateExternalTools } from './update';

vi.mock('../utils/fetch', () => ({ fetcher: vi.fn() }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn(), normalizeString: (value: string): string => value }));
vi.mock('../utils/storage', () => ({ getStorageItem: vi.fn().mockResolvedValue(undefined), setStorageItem: vi.fn().mockResolvedValue(undefined) }));
vi.mock('./wishlist', () => ({ getWishlist: vi.fn() }));
vi.mock('./map', () => ({ getMap: vi.fn() }));

const fetcherMock = fetcher as unknown as ReturnType<typeof vi.fn>;
const setStorageItemMock = setStorageItem as unknown as ReturnType<typeof vi.fn>;
const getStorageItemMock: ReturnType<typeof vi.fn> = getStorageItem as unknown as ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown): Response {
    return { status, json: () => Promise.resolve(body) } as unknown as Response;
}

beforeEach(() => {
    fetcherMock.mockReset();
    setStorageItemMock.mockReset();
    setStorageItemMock.mockResolvedValue(undefined);
    getStorageItemMock.mockReset();
    getStorageItemMock.mockResolvedValue(undefined);
    document.body.innerHTML = '';
    state.api_url = 'https://api.test';
    state.external_app_id = 'app-id';
    state.mh_user = { id: 1, userName: 'Alice', jobDetails: { uid: 'none' } } as any;
    state.mho_parameters = {} as any;
    state.token = undefined;
});

describe('updateExternalTools', () => {
    it('range le token renouvelé reçu du job dans state et le persiste', async () => {
        const renewed_token = { token: { accessToken: 'renewed-jwt', validTo: new Date(Date.now() + 3600000).toISOString() }, simpleMe: { id: 1, townDetails: { townId: 42 } } };
        fetcherMock.mockResolvedValue(jsonResponse(200, {
            jobId: 'job-1', isRunning: false, tools: [], renewedToken: renewed_token
        }));

        await updateExternalTools();

        expect(state.token).toEqual(renewed_token);
        // `mh_user` (donnée de jeu) reste à jour en mémoire, mais n'est plus persisté (cf. bootstrap.ts)
        expect(state.mh_user).toEqual(renewed_token.simpleMe);
        expect(setStorageItemMock).not.toHaveBeenCalledWith(expect.stringContaining('mh_user'), expect.anything());
        expect(setStorageItemMock).toHaveBeenCalledWith(mho_token_key, renewed_token);
    });

    it('range le token renouvelé reçu pendant le polling (pas seulement à la réponse initiale)', async () => {
        const renewed_token = { token: { accessToken: 'renewed-jwt-2', validTo: new Date(Date.now() + 3600000).toISOString() }, simpleMe: { id: 1, townDetails: { townId: 43 } } };
        fetcherMock
            .mockResolvedValueOnce(jsonResponse(200, { jobId: 'job-1', isRunning: true, tools: [] }))
            .mockResolvedValueOnce(jsonResponse(200, { jobId: 'job-1', isRunning: false, tools: [], renewedToken: renewed_token }));

        await updateExternalTools();

        expect(state.token).toEqual(renewed_token);
        expect(state.mh_user).toEqual(renewed_token.simpleMe);
        expect(setStorageItemMock).not.toHaveBeenCalledWith(expect.stringContaining('mh_user'), expect.anything());
        expect(setStorageItemMock).toHaveBeenCalledWith(mho_token_key, renewed_token);
    });

    /**
     * C1 (revue finale du chantier cycle de vie de session) : ExternalTools/Update/Start refuse
     * (403) tout appel sans Bearer valide. L'attente d'un jeton frais quand isValidToken() est faux
     * n'est plus un patch local à update.ts : elle est centralisée dans fetcher()/
     * updateFetchRequestOptions() (src/utils/fetch.ts, cf. fetch.spec.ts) pour couvrir tous les
     * appelants, pas seulement Update/Start. fetcher() étant mocké ici, ce comportement n'est plus
     * observable depuis ce fichier.
     */
});

describe('updateExternalTools — fouilles réussies', () => {
    /** 15:00:20 à l'heure de la ville (UTC+2) */
    const now_ms: number = Date.UTC(2026, 8, 24, 13, 0, 20);
    let date_now_spy: MockInstance<() => number>;

    function logEntry(time: string, content: string): string {
        return `<div class="log-entry log-entry-type-0 log-entry-class-0"><span class="log-part-time">${time}</span>`
            + `<span class="log-part-content"><span class="container">${content}</span></span></div>`;
    }

    beforeEach(() => {
        window.history.pushState({}, '', '/jx/beyond/desert/cached');
        date_now_spy = vi.spyOn(Date, 'now').mockReturnValue(now_ms);
        fetcherMock.mockResolvedValue(jsonResponse(200, { jobId: 'job-1', isRunning: false, tools: [] }));
        // Jeton de la veille : jour 4 ; l'horloge de la page affiche le jour 5
        state.mh_user = { id: 1, userName: 'Hélène', jobDetails: { uid: 'dig' }, townDetails: { townId: 42, day: 4 } };
        state.mho_parameters = { update_mho: true, update_mho_digs: true };
        // Fouineuse seule sur sa case : arrivée 8:00, échecs écrits à 11:20 et 14:00, prochaine fouille à 15:30:30
        document.body.innerHTML = '<div class="game-clock" data-town-id="42"><span class="day-number">Jour 5</span>'
            + '<div class="town-time"><hordes-tooltip class="help">Heure de la ville</hordes-tooltip>15:00</div></div>'
            + `<div id="mgd-digging-note"><span x-countdown-to="${Date.UTC(2026, 8, 24, 13, 30, 30) / 1000}">...</span></div>`
            + '<hordes-log id="beyond-log"><div class="log-content"><div class="log-day-header">Jour 5 (aujourd\'hui)</div>'
            + logEntry('14:00', 'Lors de sa dernière fouille, <span  class="">Hélène</span> n’a rien trouvé…')
            + logEntry('11:20', 'Lors de sa dernière fouille, <span  class="">Hélène</span> n’a rien trouvé…')
            + logEntry('8:00', '<span  class="">Hélène</span> (<span  class=""><img alt="" /></span>) est arrivé depuis <span>le Nord</span>.')
            + '</div></hordes-log>';
    });

    afterEach(() => {
        date_now_spy.mockRestore();
        window.history.pushState({}, '', '/');
    });

    interface SentSuccessfulDigs {
        successedDig?: { cell: { day: number; x: number; y: number }; values: SuccessfulDigValue[] };
    }

    function sentBody(): SentSuccessfulDigs {
        const request: RequestInit = fetcherMock.mock.calls[0][1];
        return JSON.parse(request.body as string) as SentSuccessfulDigs;
    }

    it('envoie les réussites estimées pour le jour affiché par la page (C7)', async () => {
        await updateExternalTools();

        expect(sentBody().successedDig.cell).toEqual({ day: 5, x: 0, y: 0 });
        expect(sentBody().successedDig.values).toEqual([{ citizenId: 1, successDigs: 2, totalDigs: 5 }]);
        expect(setStorageItemMock).toHaveBeenCalledWith(mho_sent_digs_key, { town_id: 42, day: 5, values: { '0:0:1': [2, 5] } });
    });

    it('garde le maximum déjà envoyé le même jour pour la même case', async () => {
        getStorageItemMock.mockResolvedValue({ town_id: 42, day: 5, values: { '0:0:1': [3, 6] } });

        await updateExternalTools();

        expect(sentBody().successedDig.values).toEqual([{ citizenId: 1, successDigs: 3, totalDigs: 6 }]);
    });

    it('n\'envoie aucune fouille pendant l\'attaque', async () => {
        document.body.insertAdjacentHTML('beforeend', '<div class="attack-time during-attack">!!!!</div>');

        await updateExternalTools();

        expect(sentBody().successedDig).toBeUndefined();
    });
});

describe('updateExternalTools — coffre', () => {
    const known_item = { id: 42, img: 'item/known.png', label: { fr: 'Objet connu' } } as any;

    function chestItemElement(hidden = false): string {
        return `<li class="item${hidden ? ' banished_hidden' : ''}"><img src="https://cdn.example/build/images/item/known.abc123.png"></li>`;
    }

    function sentChestContents(): unknown {
        const request: RequestInit = fetcherMock.mock.calls[0][1];
        return JSON.parse(request.body as string).chest.contents;
    }

    beforeEach(() => {
        window.history.pushState({}, '', '/jx/town/house/dash');
        state.items = [known_item];
        state.mh_user = { id: 1, userName: 'Hélène', jobDetails: { uid: 'none' }, townDetails: { townId: 42 } };
        state.mho_parameters = { update_mho: true, update_mho_chest: true };
        fetcherMock.mockResolvedValue(jsonResponse(200, { jobId: 'job-1', isRunning: false, tools: [] }));
        document.body.innerHTML = `<ul class="inventory chest">${chestItemElement(false)}${chestItemElement(true)}</ul>`;
    });

    afterEach(() => {
        window.history.pushState({}, '', '/');
    });

    /**
     * La compétence héroïque « Endurant » (niveau 2) rend un objet déposé dans le coffre
     * invisible aux autres citoyens (classe `banished_hidden` côté jeu, cf. Item::hidden /
     * ChestHiddenStashLimit). Le relevé ne doit pas révéler ce stash secret à MHO/GestHordes.
     */
    it('n\'envoie pas les objets cachés du coffre (stash secret)', async () => {
        await updateExternalTools();

        expect(sentChestContents()).toEqual([{ id: 42, isBroken: false, count: 1 }]);
    });
});

describe('updateExternalTools — Zen Hordes', () => {
    const known_item = { id: 42, img: 'item/known.png', label: { fr: 'Objet connu' } } as any;

    interface SentZenMap {
        toolsToUpdate: Record<string, string>;
        cell?: unknown;
        zenHordesCell?: Record<string, unknown>;
    }

    function setDesertPage(url = '/jx/beyond/desert/cached'): void {
        window.history.pushState({}, '', url);
        document.body.innerHTML = '<div class="current-location"></div><div class="actor zombie"></div><div id="mgd-zone-note"></div>'
            + '<ul class="inventory desert"><li class="item"><img src="https://cdn.example/build/images/item/known.abc123.png"></li></ul>';
        (document.querySelector('.current-location') as HTMLElement).innerText = 'Position : 2/-1';
    }

    function setUp(parameters: Record<string, boolean>, is_chaos: boolean, job = 'none'): void {
        state.items = [known_item];
        state.mh_user = { id: 1, userName: 'Alice', jobDetails: { uid: job }, townDetails: { townId: 42, isChaos: is_chaos } } as any;
        state.mho_parameters = parameters as any;
        fetcherMock.mockResolvedValue(jsonResponse(200, { jobId: 'job-1', isRunning: false, tools: [] }));
    }

    function sentMap(): SentZenMap {
        const request: RequestInit = fetcherMock.mock.calls[0][1];
        return JSON.parse(request.body as string).map;
    }

    afterEach(() => {
        window.history.pushState({}, '', '/');
    });

    it('envoie la zone dans une case dédiée quand la ville n\'est pas en Chaos', async () => {
        setDesertPage();
        setUp({ update_zen: true }, false);

        await updateExternalTools();

        expect(sentMap().toolsToUpdate['isZenHordes']).toBe('cell');
        expect(sentMap().zenHordesCell).toEqual({ x: 2, y: -1, zombies: 1, zoneEmpty: true, objects: [{ id: 42, isBroken: false, count: 1 }] });
    });

    it('ne remplit pas la case partagée des autres outils', async () => {
        setDesertPage();
        setUp({ update_zen: true, update_mho: true }, false);

        await updateExternalTools();

        expect(sentMap().cell).toBeUndefined();
        expect(sentMap().toolsToUpdate['isMyHordesOptimizer']).toBe('api');
    });

    it('n\'envoie pas la zone en Chaos sans l\'option dédiée', async () => {
        setDesertPage();
        setUp({ update_zen: true }, true);

        await updateExternalTools();

        expect(sentMap().toolsToUpdate['isZenHordes']).toBe('none');
        expect(sentMap().zenHordesCell).toBeUndefined();
    });

    it('envoie la zone en Chaos avec l\'option dédiée', async () => {
        setDesertPage();
        setUp({ update_zen: true, update_zen_devastated: true }, true);

        await updateExternalTools();

        expect(sentMap().toolsToUpdate['isZenHordes']).toBe('cell');
        expect(sentMap().zenHordesCell?.['zombies']).toBe(1);
    });

    it('n\'envoie rien quand Zen Hordes est décoché', async () => {
        setDesertPage();
        setUp({ update_zen: false, update_zen_devastated: true, update_zen_job_markers: true }, true, 'dig');

        await updateExternalTools();

        expect(sentMap().toolsToUpdate['isZenHordes']).toBe('none');
        expect(sentMap().zenHordesCell).toBeUndefined();
    });

    it('n\'envoie rien hors de la page du désert', async () => {
        setDesertPage('/jx/town/house/dash');
        setUp({ update_zen: true }, false);

        await updateExternalTools();

        expect(sentMap().toolsToUpdate['isZenHordes']).toBe('none');
        expect(sentMap().zenHordesCell).toBeUndefined();
    });

    it('envoie les radars du fouineur en Chaos sans la zone', async () => {
        setDesertPage();
        document.body.insertAdjacentHTML('beforeend', '<div class="scavenger-sense scavenger-sense-north scavenger-sense-0"></div>');
        setUp({ update_zen: true, update_zen_job_markers: true }, true, 'dig');

        await updateExternalTools();

        expect(sentMap().toolsToUpdate['isZenHordes']).toBe('cell');
        expect(sentMap().zenHordesCell).toEqual({ x: 2, y: -1, scavNextCells: { north: true } });
    });
});

describe('updateExternalTools — sacs et marqueurs de métiers (caractérisation)', () => {
    const known_item = { id: 42, img: 'item/known.png', label: { fr: 'Objet connu' } } as any;
    const shoes_item = { id: 43, uid: 'shoe_#00', img: 'item/item_shoe.gif', label: { fr: 'Chaussures de sport usées' } } as any;

    function sentData(): any {
        const request: RequestInit = fetcherMock.mock.calls.find((call: unknown[]) => String(call[0]).includes('/externaltools/update/start'))![1];
        return JSON.parse(request.body as string);
    }

    /** Appels `fetcher` ayant déclaré les chaussures équipées. */
    function shoesCalls(): unknown[][] {
        return fetcherMock.mock.calls.filter((call: unknown[]) => String(call[0]).endsWith('/shoesEquipped'));
    }

    beforeEach(() => {
        state.items = [known_item, shoes_item];
        fetcherMock.mockResolvedValue(jsonResponse(200, { jobId: 'job-1', isRunning: false, tools: [] }));
    });

    afterEach(() => {
        window.history.pushState({}, '', '/');
    });

    it('regroupe les objets identiques du sac', async () => {
        window.history.pushState({}, '', '/jx/town/house/dash');
        state.mh_user = { id: 1, userName: 'Alice', jobDetails: { uid: 'none' }, townDetails: { townId: 42 } } as any;
        state.mho_parameters = { update_mho: true, update_mho_bags: true } as any;
        const item = '<li class="item"><img src="https://cdn.example/build/images/item/known.abc123.png"></li>';
        document.body.innerHTML = `<ul class="inventory rucksack">${item}${item}</ul>`;

        await updateExternalTools();

        expect(sentData().bags.contents).toEqual([{ userId: 1, objects: [{ id: 42, isBroken: false, count: 2 }] }]);
    });

    describe('chaussures équipées', () => {
        const known_li: string = '<li class="item"><img src="https://cdn.example/build/images/item/known.abc123.png"></li>';
        const shoes_li: string = '<li class="item locked bg-locked"><img src="https://cdn.example/build/images/item/item_shoe.abc123.gif"></li>';

        beforeEach(() => {
            window.history.pushState({}, '', '/jx/town/house/dash');
            state.mh_user = { id: 1, userName: 'Alice', jobDetails: { uid: 'none' }, townDetails: { townId: 42 } } as any;
            state.mho_parameters = { update_mho: true, update_mho_bags: true } as any;
            document.body.innerHTML = `<ul class="inventory rucksack">${shoes_li}${known_li}</ul>`;
        });

        it('déclare les chaussures équipées avec l\'envoi des sacs', async () => {
            await updateExternalTools();

            expect(shoesCalls()).toHaveLength(1);
            expect(shoesCalls()[0][0]).toBe('https://api.test/town/42/user/1/shoesEquipped');
            expect(JSON.parse((shoesCalls()[0][1] as RequestInit).body as string)).toEqual({ shoesEquipped: true });
        });

        it('ne déclare rien sans l\'option d\'envoi des sacs', async () => {
            state.mho_parameters = { update_mho: true } as any;

            await updateExternalTools();

            expect(shoesCalls()).toHaveLength(0);
        });

        it('ne déclare rien quand tout le sac est verrouillé par une requête du jeu', async () => {
            document.body.innerHTML = `<ul class="inventory rucksack">${shoes_li}<li class="item locked"><img src="https://cdn.example/build/images/item/known.abc123.png"></li></ul>`;

            await updateExternalTools();

            expect(shoesCalls()).toHaveLength(0);
        });

        it('termine la mise à jour même si la déclaration échoue', async () => {
            fetcherMock.mockImplementation((url: string) => Promise.resolve(url.endsWith('/shoesEquipped')
                ? { status: 500, text: () => Promise.resolve('boom') } as unknown as Response
                : jsonResponse(200, { jobId: 'job-1', isRunning: false, tools: [] })));

            await expect(updateExternalTools()).resolves.toMatchObject({ jobId: 'job-1' });
            expect(sentData().bags.contents).toHaveLength(1);
        });
    });

    it('envoie le radar du fouineur aux outils qui ont coché les marqueurs de métiers', async () => {
        window.history.pushState({}, '', '/jx/beyond/desert/cached');
        state.mh_user = { id: 1, userName: 'Alice', jobDetails: { uid: 'dig' }, townDetails: { townId: 42 } } as any;
        state.mho_parameters = { update_fata: true, update_fata_job_markers: true } as any;
        document.body.innerHTML = '<div class="current-location"></div><div class="scavenger-sense scavenger-sense-north scavenger-sense-0"></div>';
        (document.querySelector('.current-location') as HTMLElement).innerText = 'Position : 2/-1';

        await updateExternalTools();

        expect(sentData().map.toolsToUpdate.isFataMorgana).toBe('cell');
        expect(sentData().map.cell.scavNextCells).toEqual({ north: true });
    });

    it('envoie le radar de l\'éclaireur aux outils qui ont coché les marqueurs de métiers', async () => {
        window.history.pushState({}, '', '/jx/beyond/desert/cached');
        state.mh_user = { id: 1, userName: 'Alice', jobDetails: { uid: 'vest' }, townDetails: { townId: 42 } } as any;
        state.mho_parameters = { update_mho: true, update_mho_job_markers: true } as any;
        document.body.innerHTML = '<div class="current-location"></div><div class="scout-sense scout-sense-east"><svg><text>4</text></svg></div>';
        (document.querySelector('.current-location') as HTMLElement).innerText = 'Position : 2/-1';

        await updateExternalTools();

        expect(sentData().map.toolsToUpdate.isMyHordesOptimizer).toBe('cell');
        expect(sentData().map.cell.scoutNextCells).toEqual({ east: 4 });
    });

    describe('Gest\'Hordes', () => {
        const scav_dom: string = '<div class="current-location"></div><div class="scavenger-sense scavenger-sense-north scavenger-sense-0"></div>';
        const scout_dom: string = '<div class="current-location"></div><div class="scout-sense scout-sense-east"><svg><text>4</text></svg></div>';

        const cell_dom: string = '<div class="current-location"></div><div class="actor splatter"></div><div class="actor splatter"></div><div class="actor zombie"></div>'
            + '<div id="mgd-zone-note"></div><ul class="inventory desert"><li class="item"><img src="https://cdn.example/build/images/item/known.abc123.png"></li></ul>';

        /** Place le joueur dans le désert, au métier donné, sur la page fournie. */
        function setUp(job: string, dom: string, parameters: Record<string, boolean>, is_chaos: boolean = false): void {
            window.history.pushState({}, '', '/jx/beyond/desert/cached');
            state.mh_user = { id: 1, userName: 'Alice', jobDetails: { uid: job }, townDetails: { townId: 42, isChaos: is_chaos } } as any;
            state.mho_parameters = parameters as any;
            document.body.innerHTML = dom;
            (document.querySelector('.current-location') as HTMLElement).innerText = 'Position : 2/-1';
        }

        it('envoie le radar du fouineur dans une case dédiée, sans toucher la case partagée', async () => {
            setUp('dig', scav_dom, { update_gh: true, update_gh_job_markers: true });

            await updateExternalTools();

            expect(sentData().map.gestHordesCell).toEqual({ x: 2, y: -1, scavNextCells: { north: true } });
            expect(sentData().map.cell).toBeUndefined();
            expect(sentData().map.toolsToUpdate.isGestHordes).toBe('api');
        });

        it('envoie le radar de l\'éclaireur dans une case dédiée', async () => {
            setUp('vest', scout_dom, { update_gh: true, update_gh_job_markers: true });

            await updateExternalTools();

            expect(sentData().map.gestHordesCell).toEqual({ x: 2, y: -1, scoutNextCells: { east: 4 } });
        });

        it('n\'envoie rien à Gest\'Hordes sans son option, même quand un autre outil relève les marqueurs', async () => {
            setUp('dig', scav_dom, { update_gh: true, update_mho: true, update_mho_job_markers: true });

            await updateExternalTools();

            expect(sentData().map.gestHordesCell).toBeUndefined();
            expect(sentData().map.cell.scavNextCells).toEqual({ north: true });
        });

        it('n\'envoie rien à un métier sans marqueurs', async () => {
            setUp('none', scav_dom, { update_gh: true, update_gh_job_markers: true });

            await updateExternalTools();

            expect(sentData().map.gestHordesCell).toBeUndefined();
        });

        it('n\'envoie rien quand aucun marqueur n\'est lisible', async () => {
            setUp('dig', '<div class="current-location"></div>', { update_gh: true, update_gh_job_markers: true });

            await updateExternalTools();

            expect(sentData().map.gestHordesCell).toBeUndefined();
        });

        it('en Chaos, envoie la case dans sa propre case', async () => {
            setUp('none', cell_dom, { update_gh: true, update_gh_devastated: true }, true);

            await updateExternalTools();

            expect(sentData().map.gestHordesCell).toEqual({ x: 2, y: -1, zombies: 1, zoneEmpty: true, objects: [{ id: 42, isBroken: false, count: 1 }] });
            expect(sentData().map.cell).toBeUndefined();
            expect(sentData().map.toolsToUpdate.isGestHordes).toBe('api');
        });

        it('envoie les zombies tués dans sa propre case', async () => {
            setUp('none', cell_dom, { update_gh: true, update_gh_killed_zombies: true });

            await updateExternalTools();

            expect(sentData().map.gestHordesCell).toEqual({ x: 2, y: -1, deadZombies: 2 });
            expect(sentData().map.cell).toBeUndefined();
            expect(sentData().map.toolsToUpdate.isGestHordes).toBe('api');
        });

        it('ne reçoit pas les zombies tués relevés pour MHO seul', async () => {
            setUp('none', cell_dom, { update_gh: true, update_gh_devastated: true, update_mho: true, update_mho_killed_zombies: true }, true);

            await updateExternalTools();

            expect(sentData().map.gestHordesCell.deadZombies).toBeUndefined();
            expect(sentData().map.cell.deadZombies).toBe(2);
        });

        it('ne reçoit pas la case en Chaos relevée pour MHO seul', async () => {
            setUp('none', cell_dom, { update_gh: true, update_gh_killed_zombies: true, update_mho: true, update_mho_devastated: true }, true);

            await updateExternalTools();

            expect(sentData().map.gestHordesCell).toEqual({ x: 2, y: -1, deadZombies: 2 });
            expect(sentData().map.cell.objects).toHaveLength(1);
        });

        it('réunit zombies tués et marqueurs de métiers dans la même case', async () => {
            setUp('dig', cell_dom + '<div class="scavenger-sense scavenger-sense-north scavenger-sense-0"></div>', { update_gh: true, update_gh_killed_zombies: true, update_gh_job_markers: true });

            await updateExternalTools();

            expect(sentData().map.gestHordesCell).toEqual({ x: 2, y: -1, deadZombies: 2, scavNextCells: { north: true } });
        });
    });
});
