import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getToken, isTokenRequestInFlight } from '../api/token';
import { state } from '../state';
import { fetch_timeout_ms, fetcher, fetcherWithoutBearer } from './fetch';

vi.mock('../api/token', () => ({ getToken: vi.fn(), isTokenRequestInFlight: vi.fn() }));

const getTokenMock = getToken as unknown as ReturnType<typeof vi.fn>;
const isTokenRequestInFlightMock = isTokenRequestInFlight as unknown as ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown): Response {
    return { status, json: () => Promise.resolve(body) } as unknown as Response;
}

function validToken(access_token: string): any {
    return { token: { accessToken: access_token, validTo: new Date(Date.now() + 3600000).toISOString() } };
}

beforeEach(() => {
    document.body.innerHTML = '';
    getTokenMock.mockReset();
    getTokenMock.mockResolvedValue(undefined);
    isTokenRequestInFlightMock.mockReset();
    isTokenRequestInFlightMock.mockReturnValue(false);
    state.token = undefined;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, {})));
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

/** Simule le comportement de fetch() : rejette dès que son AbortSignal se déclenche, sinon ne répond jamais. */
function neverSettlingFetchMock(): ReturnType<typeof vi.fn> {
    return vi.fn((_url: string, options?: { signal?: AbortSignal }) => new Promise<Response>((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
}

/**
 * C1 (revue finale du chantier cycle de vie de session) : isValidToken() redevient faux à chaque
 * changement de jour/ville (shouldRefreshMe()), pas seulement à l'expiration du JWT. Toute requête
 * lancée dans cette fenêtre doit attendre un jeton frais avant de partir, quel que soit l'appelant
 * de fetcher() — pas seulement Update/Start (cf. update.ts, ancien patch local retiré).
 */
describe('fetcher', () => {
    it('appelle getToken() avant fetch() quand le token est invalide', async () => {
        await fetcher('https://api.test/x');

        expect(getTokenMock).toHaveBeenCalled();
        const getTokenOrder = getTokenMock.mock.invocationCallOrder[0];
        const fetchOrder = (fetch as unknown as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
        expect(getTokenOrder).toBeLessThan(fetchOrder);
    });

    it('attend la résolution de getToken() avant d\'appeler fetch() (pas seulement son déclenchement)', async () => {
        let resolveGetToken: () => void = () => undefined;
        getTokenMock.mockImplementation(() => new Promise<void>((resolve) => {
            resolveGetToken = resolve;
        }));
        const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

        const fetcher_promise = fetcher('https://api.test/x');
        await Promise.resolve();
        await Promise.resolve();
        expect(fetchMock).not.toHaveBeenCalled();

        resolveGetToken();
        await fetcher_promise;
        expect(fetchMock).toHaveBeenCalled();
    });

    it('ajoute le Bearer avec le token obtenu par getToken() une fois résolu', async () => {
        getTokenMock.mockImplementation(async () => {
            state.token = validToken('fresh-jwt');
        });

        await fetcher('https://api.test/x');

        const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
        const options = fetchMock.mock.calls[0][1];
        expect(options.headers.Authorization).toBe('Bearer fresh-jwt');
    });

    it('ne redemande pas de jeton quand isValidToken() est déjà vrai', async () => {
        state.token = validToken('still-valid');

        await fetcher('https://api.test/x');

        expect(getTokenMock).not.toHaveBeenCalled();
        const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
        const options = fetchMock.mock.calls[0][1];
        expect(options.headers.Authorization).toBe('Bearer still-valid');
    });

    /**
     * `getToken()` charge lui-même objets/liste de courses/carte/ruines une fois le token reçu
     * (`tokenReceived()`, `api/token.ts`), et ces chargements passent par `fetcher()`. Si
     * `isValidToken()` reste faux juste après ce renouvellement (horloge du jeu incomplète),
     * un appel imbriqué qui attendrait `getToken()` réattendrait la même authentification en
     * cours — qui ne se résout qu'une fois ces chargements terminés : blocage circulaire.
     * `isTokenRequestInFlight()` évite ce cas : part sans Bearer plutôt que de bloquer.
     * Cf. `token.spec.ts` pour la preuve avec les modules réels (bout en bout, sans mock).
     */
    it('n\'attend pas getToken() quand une authentification est déjà en cours (évite un blocage circulaire)', async () => {
        isTokenRequestInFlightMock.mockReturnValue(true);

        await fetcher('https://api.test/x');

        expect(getTokenMock).not.toHaveBeenCalled();
        const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
        const options = fetchMock.mock.calls[0][1];
        expect(options.headers.Authorization).toBeUndefined();
    });

    /**
     * Incident : bouton MHO (`ui/update-button.ts`) resté bloqué sur "…" indéfiniment, y compris
     * au-delà du plafond de 2 minutes de `followUpdateJob` — plafond vérifié seulement entre deux
     * itérations, jamais à l'intérieur d'un `await fetcher(...)` qui ne se résout jamais. Sans
     * timeout ici, une requête qui ne répond jamais (lenteur serveur, connexion qui traîne) fige
     * la boucle pour de bon (signalé sur Discord le 2026-09-09). Ce timeout est le seul point par
     * lequel passent tous les appelants (POST initial ET polling `/status`).
     */
    it('abandonne une requête qui ne répond jamais, au lieu de rester bloquée indéfiniment', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', neverSettlingFetchMock());

        const fetcher_promise = fetcher('https://api.test/x');
        const assertion = expect(fetcher_promise).rejects.toThrow();
        await vi.advanceTimersByTimeAsync(fetch_timeout_ms);

        await assertion;
    });
});

describe('fetcherWithoutBearer', () => {
    it('abandonne une requête qui ne répond jamais, au lieu de rester bloquée indéfiniment (même garde-fou que fetcher)', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', neverSettlingFetchMock());

        const fetcher_promise = fetcherWithoutBearer('https://api.test/x');
        const assertion = expect(fetcher_promise).rejects.toThrow();
        await vi.advanceTimersByTimeAsync(fetch_timeout_ms);

        await assertion;
    });
});
