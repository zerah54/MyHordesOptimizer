import type { Mock, MockInstance } from 'vitest';

import { RealtimeExpeditionsService } from './realtime-expeditions.service';

/** Membres non publics manipulés par les tests. */
interface GlobalInternals {
    hubConnection: unknown;
    invokeHub(method: string, ...args: unknown[]): Promise<unknown>;
    startConnexion(): Promise<void>;
    sleep(ms: number): Promise<void>;
}

/**
 * Accès aux membres non publics du service.
 * @param {RealtimeExpeditionsService} service Service.
 * @returns {GlobalInternals} Même objet, vu par ses membres non publics.
 */
function internals(service: RealtimeExpeditionsService): GlobalInternals {
    return <GlobalInternals><unknown>service;
}

describe('RealtimeGlobalService.invokeHub', () => {
    let service: RealtimeExpeditionsService;
    let hubConnection: {
        state: string;
        invoke: Mock;
    };

    beforeEach(() => {
        service = Object.create(RealtimeExpeditionsService.prototype);
        hubConnection = {
            state: 'Connected',
            invoke: vi.fn().mockImplementation(() => hubConnection.state === 'Connected'
                ? Promise.resolve()
                : Promise.reject(new Error(`Cannot invoke while state is ${hubConnection.state}`)))
        };
        internals(service).hubConnection = hubConnection;
    });

    it('invokes directly when already connected', async () => {
        await internals(service).invokeHub('PostExpedition', 1);

        expect(hubConnection.invoke).toHaveBeenCalledWith('PostExpedition', 1);
    });

    it('does not resolve until the invoke call made after reconnecting completes', async () => {
        hubConnection.state = 'Disconnected';
        vi.spyOn(internals(service), 'startConnexion').mockImplementation((): Promise<void> => {
            hubConnection.state = 'Connected';
            return Promise.resolve();
        });
        let resolveInvoke!: () => void;
        hubConnection.invoke.mockReturnValue(new Promise<void>((resolve: () => void): void => {
            resolveInvoke = resolve;
        }));

        let resolved: boolean = false;
        const invokePromise: Promise<void> = internals(service).invokeHub('PostExpedition', 1).then((): void => {
            resolved = true;
        });

        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        expect(resolved).toBe(false);

        resolveInvoke();
        await invokePromise;

        expect(resolved).toBe(true);
    });

    it('propagates a failure from the invoke call made after reconnecting', async () => {
        hubConnection.state = 'Disconnected';
        vi.spyOn(internals(service), 'startConnexion').mockImplementation((): Promise<void> => {
            hubConnection.state = 'Connected';
            return Promise.resolve();
        });
        hubConnection.invoke.mockReturnValue(Promise.reject(new Error('boom')));

        await expect(internals(service).invokeHub('PostExpedition', 1)).rejects.toThrowError('boom');
    });

    it('waits without restarting the connection while reconnecting, then invokes once connected', async () => {
        hubConnection.state = 'Reconnecting';
        const start_connexion_spy: MockInstance<() => Promise<void>> = vi.spyOn(internals(service), 'startConnexion');
        vi.spyOn(internals(service), 'sleep').mockImplementation((): Promise<void> => {
            hubConnection.state = 'Connected';
            return Promise.resolve();
        });

        await internals(service).invokeHub('PostExpedition', 1);

        expect(start_connexion_spy).not.toHaveBeenCalled();
        expect(hubConnection.invoke).toHaveBeenCalledWith('PostExpedition', 1);
    });
});

describe('RealtimeGlobalService : relance après un échec de connexion', () => {
    let service: RealtimeExpeditionsService;
    let hubConnection: {
        state: string;
        start: Mock;
        invoke: Mock;
    };
    let snackbar: { errorSnackbar: Mock };
    let delays: number[];

    /**
     * `start()` qui échoue `failures` fois puis réussit ; l'état passe par 'Connecting' comme le vrai client.
     * @param {number} failures Nombre d'échecs avant la réussite.
     */
    function failStarts(failures: number): void {
        let calls: number = 0;
        hubConnection.start.mockImplementation((): Promise<void> => {
            calls++;
            hubConnection.state = 'Connecting';
            const failed: boolean = calls <= failures;
            return Promise.resolve().then((): void => {
                hubConnection.state = failed ? 'Disconnected' : 'Connected';
                if (failed) {
                    throw new Error('negotiate 503');
                }
            });
        });
    }

    function invokeHub(method: string): Promise<unknown> {
        return internals(service).invokeHub(method);
    }

    beforeEach(() => {
        service = Object.create(RealtimeExpeditionsService.prototype);
        hubConnection = { state: 'Disconnected', start: vi.fn(), invoke: vi.fn().mockResolvedValue(undefined) };
        snackbar = { errorSnackbar: vi.fn() };
        // Object.create ne lance pas les initialiseurs de champs.
        Object.assign(service, { hubConnection, snackbar, failed_starts: 0, connecting: null });
        delays = [];
        vi.spyOn(internals(service), 'sleep').mockImplementation((ms: number): Promise<void> => {
            delays.push(ms);
            return Promise.resolve();
        });
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('espace les essais ratés de 1 s, 2 s, 5 s puis 10 s au plus, puis appelle le hub une fois connecté', async () => {
        failStarts(5);

        await invokeHub('JoinPresence');

        expect(delays).toEqual([1000, 2000, 5000, 10000, 10000]);
        expect(hubConnection.start).toHaveBeenCalledTimes(6);
        expect(hubConnection.invoke).toHaveBeenCalledWith('JoinPresence');
    });

    it('n\'affiche qu\'un message d\'erreur par série d\'échecs, de nouveau après une connexion réussie', async () => {
        failStarts(3);
        await invokeHub('JoinPresence');
        expect(snackbar.errorSnackbar).toHaveBeenCalledTimes(1);

        hubConnection.state = 'Disconnected';
        failStarts(2);
        await invokeHub('JoinPresence');

        expect(snackbar.errorSnackbar).toHaveBeenCalledTimes(2);
        expect(delays).toEqual([1000, 2000, 5000, 1000, 2000]);
    });

    it('des appels simultanés partagent la même série d\'essais', async () => {
        failStarts(2);

        await Promise.all([invokeHub('JoinPresence'), invokeHub('GetPlanLocks')]);

        expect(hubConnection.start).toHaveBeenCalledTimes(3);
        expect(delays).toEqual([1000, 2000]);
        expect(snackbar.errorSnackbar).toHaveBeenCalledTimes(1);
        expect(hubConnection.invoke).toHaveBeenCalledTimes(2);
    });
});
