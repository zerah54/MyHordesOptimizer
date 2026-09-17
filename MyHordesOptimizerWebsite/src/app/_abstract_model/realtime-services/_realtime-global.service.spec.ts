import type { Mock } from 'vitest';

import { RealtimeExpeditionsService } from './realtime-expeditions.service';

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
        (service as any).hubConnection = hubConnection;
    });

    it('invokes directly when already connected', async () => {
        await (service as any).invokeHub('PostExpedition', 1);

        expect(hubConnection.invoke).toHaveBeenCalledWith('PostExpedition', 1);
    });

    it('does not resolve until the invoke call made after reconnecting completes', async () => {
        hubConnection.state = 'Disconnected';
        vi.spyOn(service as any, 'startConnexion').mockImplementation(() => {
            hubConnection.state = 'Connected';
            return Promise.resolve();
        });
        let resolveInvoke!: () => void;
        hubConnection.invoke.mockReturnValue(new Promise<void>((resolve) => {
            resolveInvoke = resolve;
        }));

        let resolved = false;
        const invokePromise = (service as any).invokeHub('PostExpedition', 1).then(() => {
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
        vi.spyOn(service as any, 'startConnexion').mockImplementation(() => {
            hubConnection.state = 'Connected';
            return Promise.resolve();
        });
        hubConnection.invoke.mockReturnValue(Promise.reject(new Error('boom')));

        await expect((service as any).invokeHub('PostExpedition', 1)).rejects.toThrowError('boom');
    });

    it('waits without restarting the connection while reconnecting, then invokes once connected', async () => {
        hubConnection.state = 'Reconnecting';
        const start_connexion_spy = vi.spyOn(service as any, 'startConnexion');
        vi.spyOn(service as any, 'sleep').mockImplementation(() => {
            hubConnection.state = 'Connected';
            return Promise.resolve();
        });

        await (service as any).invokeHub('PostExpedition', 1);

        expect(start_connexion_spy).not.toHaveBeenCalled();
        expect(hubConnection.invoke).toHaveBeenCalledWith('PostExpedition', 1);
    });
});
