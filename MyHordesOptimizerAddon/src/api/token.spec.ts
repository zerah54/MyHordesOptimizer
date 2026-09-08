import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { state } from '../state';
import { isValidToken } from '../utils/misc';
import { authenticateOnScriptLoad, getToken, isTokenRequestInFlight } from './token';

// `getWishlist` mocké : seul `getItems()` (non mocké) doit passer par le vrai `fetcher()`, pour
// prouver que l'attente de `getToken()` dans `fetcher()` (src/utils/fetch.ts) ne bloque pas un
// appel imbriqué déclenché par `tokenReceived()` lui-même (`getItems`/`getWishlist`).
vi.mock('./wishlist', () => ({ getWishlist: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../utils/storage', () => ({ setStorageItem: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../utils/notifications', () => ({ addError: vi.fn() }));

function jsonResponse(status: number, body: unknown): Response {
    return { status, json: () => Promise.resolve(body), text: () => Promise.resolve(JSON.stringify(body)) } as unknown as Response;
}

/**
 * Place `state.token`/`state.mh_user`/le DOM dans l'état exact où `isValidToken()` renvoie
 * `true` (token non expiré, horloge de jeu complète et concordante) — le cas que `force` doit
 * court-circuiter. jsdom ne calcule pas `.innerText` depuis le HTML analysé : l'affecter en JS,
 * comme le ferait le rendu réel du jeu (cf. reference_jsdom_innertext_gotcha).
 */
function setUpValidCachedToken(): void {
    document.body.innerHTML = '<div class="game-clock" data-town-id="5"><span class="day-number"></span></div>';
    (document.querySelector('.day-number') as HTMLElement).innerText = '3';
    state.token = {
        token: { accessToken: 'still-valid', validTo: new Date(Date.now() + 3600000).toISOString() },
        simpleMe: { id: 1, townDetails: { townId: 5, day: 3 } }
    } as any;
    state.mh_user = state.token.simpleMe;
}

function stubAuthenticationFetch(): ReturnType<typeof vi.fn> {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/Authentication/Token')) {
            return Promise.resolve(jsonResponse(200, {
                token: { accessToken: 'fresh-jwt', validTo: new Date(Date.now() + 3600000).toISOString() },
                simpleMe: { id: 1, townDetails: { townId: 5, day: 3 } }
            }));
        }
        if (url.includes('/Fetcher/items')) {
            return Promise.resolve(jsonResponse(200, []));
        }
        return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

beforeEach(() => {
    // .game-clock présent mais sans .day-number : shouldRefreshMe() (utils/page.ts) reste vrai
    // (« horloge incomplète »), donc isValidToken() reste faux juste après que getToken() a
    // rafraîchi state.token/state.mh_user — le cas qui expose un éventuel blocage circulaire.
    document.body.innerHTML = '<div class="game-clock" data-town-id="5"></div>';
    state.api_url = 'https://api.test';
    state.external_app_id = 'app-id';
    state.token = undefined;
    state.mh_user = undefined;
    state.items = undefined;
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('getToken(true) : bootstrap systématique (chantier cycle de vie de session)', () => {
    it('déclenche un appel réseau MÊME QUAND un token valide (et une horloge de jeu complète et concordante) existe déjà', async () => {
        setUpValidCachedToken();

        // `isValidToken()` doit renvoyer true avec cet état : c'est justement le cas que `force` doit court-circuiter
        expect(isValidToken()).toBe(true);

        const fetchMock = stubAuthenticationFetch();

        await expect(getToken(true)).resolves.toBeUndefined();

        expect(fetchMock.mock.calls.some(([url]: [string]) => url.includes('/Authentication/Token'))).toBe(true);
        expect(state.token.token.accessToken).toBe('fresh-jwt');
    });

    /**
     * Régression ciblée par la revue (mutation-testing) : `main.ts` appelle `authenticateOnScriptLoad()`
     * (pas `getToken()` directement) au chargement du script — `main.ts` étant une IIFE top-level
     * non testable directement, c'est cette fonction extraite qui porte le `force=true` et doit
     * donc rester couverte. Sans `force=true` dans son corps, ce test échoue (même état "token
     * déjà valide" que le test ci-dessus).
     */
    it('authenticateOnScriptLoad() (câblée au chargement du script dans main.ts) force elle aussi un appel réseau alors qu\'un token valide existe déjà', async () => {
        setUpValidCachedToken();
        expect(isValidToken()).toBe(true);

        const fetchMock = stubAuthenticationFetch();

        await expect(authenticateOnScriptLoad()).resolves.toBeUndefined();

        expect(fetchMock.mock.calls.some(([url]: [string]) => url.includes('/Authentication/Token'))).toBe(true);
        expect(state.token.token.accessToken).toBe('fresh-jwt');
    });
});

describe('getToken() / fetcher() : pas de blocage circulaire', () => {
    it('un appel fetcher() imbriqué (getItems() dans tokenReceived()) se termine même quand isValidToken() reste faux après le renouvellement', async () => {
        const fetchMock = vi.fn().mockImplementation((url: string) => {
            if (url.includes('/Authentication/Token')) {
                return Promise.resolve(jsonResponse(200, {
                    token: { accessToken: 'fresh-jwt', validTo: new Date(Date.now() + 3600000).toISOString() },
                    simpleMe: { id: 1, townDetails: { townId: 5, day: 1 } }
                }));
            }
            if (url.includes('/Fetcher/items')) {
                return Promise.resolve(jsonResponse(200, []));
            }
            return Promise.reject(new Error(`unexpected fetch: ${url}`));
        });
        vi.stubGlobal('fetch', fetchMock);

        // Sans le garde-fou isTokenRequestInFlight() (src/utils/fetch.ts), cette assertion
        // n'aboutit jamais : getItems() → fetcher() → await getToken() réattendrait la même
        // authentification en cours, qui ne se résout qu'une fois getItems() terminé.
        await expect(getToken()).resolves.toBeUndefined();

        expect(isTokenRequestInFlight()).toBe(false);
        expect(fetchMock.mock.calls.some(([url]: [string]) => url.includes('/Fetcher/items'))).toBe(true);
        expect(state.items).toEqual([]);
    });
});
