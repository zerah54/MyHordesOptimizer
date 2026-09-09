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

describe('getToken(true) : cooldown après un 429 (incident prod 2026-09-09)', () => {
    /**
     * `authenticateOnScriptLoad()` force un appel réseau à CHAQUE chargement de page (MyHordes
     * n'étant pas une SPA, un déplacement dans le désert en enchaîne plusieurs par seconde). Sans
     * mémoire d'un échec récent, chaque nouvelle page retente aussitôt un quota MyHordes déjà
     * dépassé (429, « Tout devrait fonctionner de nouveau d'ici quelques minutes ») : le quota ne
     * peut plus jamais se libérer. Cf. AuthenticationController.cs (rate-limiter serveur désactivé
     * le jour même pour la raison inverse : il bloquait tout le monde sans distinction).
     */
    function jsonOrTextResponse(status: number, body: string): Response {
        return { status, json: () => Promise.reject(new Error('not json')), text: () => Promise.resolve(body) } as unknown as Response;
    }

    /**
     * Horloge figée à une petite valeur (et non l'heure réelle) : le cooldown posé pendant ce test
     * (quelques dizaines de secondes après epoch) reste ainsi sans effet sur les tests suivants,
     * qui tournent en horloge réelle bien après 1970 — pas besoin d'exposer de reset pour cela.
     */
    it('ne rappelle pas /Authentication/Token juste après un 429 : la page suivante ne doit pas retenter aussitôt', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
        try {
            const fetchMock = vi.fn().mockImplementation((url: string) => {
                if (url.includes('/Authentication/Token')) {
                    return Promise.resolve(jsonOrTextResponse(429, 'Quota dépassé. Tout devrait fonctionner de nouveau d\'ici quelques minutes.'));
                }
                return Promise.reject(new Error(`unexpected fetch: ${url}`));
            });
            vi.stubGlobal('fetch', fetchMock);

            await getToken(true);
            const callsAfterFirstFailure: number = fetchMock.mock.calls.filter(([url]: [string]) => url.includes('/Authentication/Token')).length;
            expect(callsAfterFirstFailure).toBe(1);

            // Chargement de page suivant, quelques centaines de ms plus tard : toujours en cooldown.
            vi.advanceTimersByTime(500);
            await getToken(true);
            const callsAfterSecondAttempt: number = fetchMock.mock.calls.filter(([url]: [string]) => url.includes('/Authentication/Token')).length;
            expect(callsAfterSecondAttempt).toBe(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it('retente après l\'expiration du cooldown', async () => {
        vi.useFakeTimers();
        // Loin après le cooldown (60s) posé par le test précédent : `token_retry_cooldown_until`
        // n'est pas réinitialisé entre les tests (état module), cette base l'ignore de fait.
        vi.setSystemTime(1_000_000);
        try {
            const fetchMock = vi.fn().mockImplementation((url: string) => {
                if (url.includes('/Authentication/Token')) {
                    return Promise.resolve(jsonOrTextResponse(429, 'Quota dépassé.'));
                }
                return Promise.reject(new Error(`unexpected fetch: ${url}`));
            });
            vi.stubGlobal('fetch', fetchMock);

            await getToken(true);
            vi.advanceTimersByTime(65000);
            await getToken(true);

            const callCount: number = fetchMock.mock.calls.filter(([url]: [string]) => url.includes('/Authentication/Token')).length;
            expect(callCount).toBe(2);
        } finally {
            vi.useRealTimers();
        }
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
