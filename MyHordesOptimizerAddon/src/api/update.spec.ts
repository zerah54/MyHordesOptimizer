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
