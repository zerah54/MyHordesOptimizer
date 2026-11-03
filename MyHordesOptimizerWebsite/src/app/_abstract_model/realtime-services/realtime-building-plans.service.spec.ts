import { TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';

import { SnackbarService } from '../../_core/services/snackbar.service';
import { setObservedTown, setTown } from '../../_core/utilities/localstorage.util';
import { BuildingPlanDTO, BuildingPlansDTO } from '../../my-town/buildings/planning/plan.types';
import { AuthenticationService } from '../services/authentication.service';
import { TownDetails } from '../types/town-details.class';
import { RealtimeGlobalService } from './_realtime-global.service';
import { PlanLockDTO, RealtimeBuildingPlansService } from './realtime-building-plans.service';

type Handler = (...args: unknown[]) => void;
type InvokeHub = Mock<(method: string, ...args: unknown[]) => Promise<unknown>>;

/** Faux `HubConnection` : mémorise les handlers pour les déclencher à la main ; `stop()` déclenche `onclose` comme le vrai client. */
interface FakeHub {
    id: string | null;
    state: string;
    handlers: Map<string, Handler>;
    reconnected: Handler | null;
    closed: Handler | null;
    start: Mock<() => Promise<void>>;
    stop: Mock<() => Promise<void>>;
    on(event: string, handler: Handler): void;
    onreconnected(handler: Handler): void;
    onclose(handler: Handler): void;
    readonly connectionId: string | null;
}

interface ServiceInternals {
    invokeHub: InvokeHub;
}

describe('RealtimeBuildingPlansService', () => {
    let service: RealtimeBuildingPlansService;
    let hub: FakeHub;
    let define_spy: Mock;

    function emit(event: string, ...args: unknown[]): void {
        (<Handler>hub.handlers.get(event))(...args);
    }

    function invokeHub(): InvokeHub {
        return (<ServiceInternals><unknown>service).invokeHub;
    }

    function flush(): Promise<void> {
        return new Promise<void>((resolve: () => void) => setTimeout(resolve));
    }

    beforeEach(async () => {
        setTown(Object.assign(new TownDetails(), { town_id: 42 }));
        hub = {
            id: 'conn-1',
            state: 'Connected',
            handlers: new Map<string, Handler>(),
            reconnected: null,
            closed: null,
            start: vi.fn((): Promise<void> => {
                hub.state = 'Connected';
                return Promise.resolve();
            }),
            stop: vi.fn((): Promise<void> => {
                hub.state = 'Disconnected';
                hub.closed?.();
                return Promise.resolve();
            }),
            on(event: string, handler: Handler): void {
                this.handlers.set(event, handler);
            },
            onreconnected(handler: Handler): void {
                this.reconnected = handler;
            },
            onclose(handler: Handler): void {
                this.closed = handler;
            },
            get connectionId(): string | null {
                return this.id;
            }
        };
        define_spy = vi.spyOn(<{ defineConnexion(part: string): Promise<void> }><unknown>RealtimeGlobalService.prototype, 'defineConnexion')
            .mockImplementation(function (this: { hubConnection: unknown }): Promise<void> {
                this.hubConnection = hub;
                return Promise.resolve();
            });
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthenticationService, useValue: {} },
                { provide: SnackbarService, useValue: {} }
            ]
        });
        service = TestBed.runInInjectionContext(() => new RealtimeBuildingPlansService());
        vi.spyOn(<ServiceInternals><unknown>service, 'invokeHub').mockResolvedValue(undefined);
        await flush();
    });

    afterEach(() => {
        setTown(null);
    });

    it('connects to the building-plans hub', () => {
        expect(define_spy).toHaveBeenCalledWith('building-plans');
    });

    it('feeds each stream from its hub event', () => {
        const received: Record<string, unknown> = {};
        const names: string[] = ['plan_saved$', 'plan_deleted$', 'plan_effective_changed$', 'settings_saved$', 'plan_lock_changed$', 'task_checks_changed$'];
        for (const name of names) {
            (<Record<string, { subscribe(cb: (v: unknown) => void): void }>><unknown>service)[name].subscribe((v: unknown) => {
                received[name] = v;
            });
        }
        const plan: BuildingPlanDTO = <BuildingPlanDTO>{ id: 1 };
        const settings: BuildingPlansDTO = <BuildingPlansDTO>{};
        const lock: PlanLockDTO = { planId: 1, holderUserId: 2, holderConnectionId: 'c' };

        emit('PlanSaved', plan);
        emit('PlanDeleted', 5);
        emit('PlanEffectiveChanged', plan);
        emit('SettingsSaved', settings);
        emit('PlanLockChanged', lock);
        emit('TaskChecksChanged', 9);

        expect(received).toEqual({
            plan_saved$: plan, plan_deleted$: 5, plan_effective_changed$: plan,
            settings_saved$: settings, plan_lock_changed$: lock, task_checks_changed$: 9
        });
    });

    it('parses the JSON user lists of UserJoined and UserLeft into users$', () => {
        const lists: number[][] = [];
        service.users$.subscribe((ids: number[]) => lists.push(ids));

        emit('UserJoined', '[1,2]');
        emit('UserLeft', '[2]');

        expect(lists).toEqual([[1, 2], [2]]);
    });

    it('exposes the hub connection id', () => {
        expect(service.connectionId()).toBe('conn-1');
        hub.id = null;
        expect(service.connectionId()).toBeNull();
    });

    it('getPlanLocks appelle GetPlanLocks et renvoie la liste', async () => {
        const locks: PlanLockDTO[] = [{ planId: 4, holderUserId: 1, holderConnectionId: 'conn-1' }];
        invokeHub().mockResolvedValueOnce(locks);

        await expect(service.getPlanLocks()).resolves.toEqual(locks);

        expect(invokeHub()).toHaveBeenCalledWith('GetPlanLocks');
    });

    it('invokes AcquirePlanLock with the plan id and returns the lock', async () => {
        const lock: PlanLockDTO = { planId: 4, holderUserId: 1, holderConnectionId: 'conn-1' };
        invokeHub().mockResolvedValueOnce(lock);

        await expect(service.acquirePlanLock(4)).resolves.toEqual(lock);

        expect(invokeHub()).toHaveBeenCalledWith('AcquirePlanLock', 4);
    });

    it('invokes the other hub methods with their arguments', async () => {
        await service.takePlanLock(4);
        await service.releasePlanLock(4);
        await service.notifyTaskChecks(8);
        await service.leavePresence();

        expect(invokeHub().mock.calls).toEqual([
            ['TakePlanLock', 4], ['ReleasePlanLock', 4], ['NotifyTaskChecks', 8], ['LeavePresence']
        ]);
    });

    it('publishes the list returned by JoinPresence on users$', async () => {
        const lists: number[][] = [];
        service.users$.subscribe((ids: number[]) => lists.push(ids));
        invokeHub().mockResolvedValueOnce([3, 7]);

        await expect(service.joinPresence()).resolves.toEqual([3, 7]);

        expect(lists).toEqual([[3, 7]]);
    });

    it('declares the presence again after a reconnection, then signals it', async () => {
        const order: string[] = [];
        service.reconnected$.subscribe(() => order.push('reconnected'));
        invokeHub().mockResolvedValue([3]);
        await service.joinPresence();
        invokeHub().mockClear();
        invokeHub().mockImplementation((method: string) => {
            order.push(method);
            return Promise.resolve([3]);
        });

        (<Handler>hub.reconnected)();
        await flush();

        expect(order).toEqual(['JoinPresence', 'reconnected']);
    });

    it('does not declare the presence after a reconnection once it is left', async () => {
        let reconnections: number = 0;
        service.reconnected$.subscribe(() => reconnections++);
        await service.joinPresence();
        await service.leavePresence();
        invokeHub().mockClear();

        (<Handler>hub.reconnected)();
        await flush();

        expect(invokeHub()).not.toHaveBeenCalled();
        expect(reconnections).toBe(1);
    });

    it('relance une connexion fermée (reconnexion automatique abandonnée), redéclare la présence puis signale la reconnexion', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        const order: string[] = [];
        service.reconnected$.subscribe(() => order.push('reconnected'));
        await service.joinPresence();
        invokeHub().mockImplementation((method: string) => {
            order.push(method);
            return Promise.resolve([3]);
        });
        hub.start.mockImplementation((): Promise<void> => {
            order.push('start');
            hub.state = 'Connected';
            return Promise.resolve();
        });
        hub.state = 'Disconnected';

        (<Handler>hub.closed)(new Error('gone'));
        await flush();

        expect(order).toEqual(['start', 'JoinPresence', 'reconnected']);
    });

    it('rouvre la connexion (nouveau jeton) quand la ville du joueur a changé depuis son ouverture, une seule fois', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        await service.ensureTown();
        expect(hub.stop).not.toHaveBeenCalled();

        setTown(Object.assign(new TownDetails(), { town_id: 43 }));
        await service.ensureTown();
        await service.ensureTown();

        expect(hub.stop).toHaveBeenCalledTimes(1);
        expect(hub.start).toHaveBeenCalledTimes(1);
        expect(hub.state).toBe('Connected');
    });

    it('ne rouvre pas la connexion quand le joueur observe une autre ville (le hub suit la ville du jeton)', async () => {
        setObservedTown(Object.assign(new TownDetails(), { town_id: 99 }));
        try {
            await service.ensureTown();
        } finally {
            setObservedTown(null);
        }

        expect(hub.stop).not.toHaveBeenCalled();
    });

    it('still signals the reconnection when declaring the presence again fails', async () => {
        let reconnections: number = 0;
        service.reconnected$.subscribe(() => reconnections++);
        await service.joinPresence();
        invokeHub().mockRejectedValueOnce(new Error('Forbidden'));
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        (<Handler>hub.reconnected)();
        await flush();

        expect(reconnections).toBe(1);
    });
});
