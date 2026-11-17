import { TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';

import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { setTown } from '../../_core/utilities/localstorage.util';
import { NightwatchPlanDTO } from '../../my-town/nightwatch/nightwatch.types';
import { AuthenticationService } from '../services/authentication.service';
import { TownDetails } from '../types/town-details.class';
import { RealtimeGlobalService } from './_realtime-global.service';
import { PlanLockDTO } from './realtime-building-plans.service';
import { RealtimeNightwatchPlansService } from './realtime-nightwatch-plans.service';

type Handler = (...args: unknown[]) => void;
type InvokeHub = Mock<(method: string, ...args: unknown[]) => Promise<unknown>>;

/** Faux `HubConnection` : mémorise les handlers pour les déclencher à la main. */
interface FakeHub {
    handlers: Map<string, Handler>;
    reconnected: Handler | null;
    closed: Handler | null;
    on(event: string, handler: Handler): void;
    onreconnected(handler: Handler): void;
    onclose(handler: Handler): void;
    readonly connectionId: string | null;
}

interface ServiceInternals {
    invokeHub: InvokeHub;
}

describe('RealtimeNightwatchPlansService', () => {
    let service: RealtimeNightwatchPlansService;
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
            handlers: new Map<string, Handler>(),
            reconnected: null,
            closed: null,
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
                return 'conn-1';
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
        service = TestBed.runInInjectionContext(() => new RealtimeNightwatchPlansService());
        vi.spyOn(<ServiceInternals><unknown>service, 'invokeHub').mockResolvedValue(undefined);
        await flush();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        setTown(null);
    });

    it('se connecte au hub nightwatch-plans', () => {
        expect(define_spy).toHaveBeenCalledWith('nightwatch-plans');
    });

    it('alimente chaque flux depuis son événement du hub', () => {
        const received: Record<string, unknown> = {};
        const names: string[] = ['plan_saved$', 'plan_deleted$', 'plan_effective_changed$', 'plan_lock_changed$'];
        for (const name of names) {
            (<Record<string, { subscribe(cb: (v: unknown) => void): void }>><unknown>service)[name].subscribe((v: unknown) => {
                received[name] = v;
            });
        }
        const plan: NightwatchPlanDTO = <NightwatchPlanDTO>{ id: 1 };
        const lock: PlanLockDTO = { planId: 1, holderUserId: 2, holderConnectionId: 'c' };

        emit('PlanSaved', plan);
        emit('PlanDeleted', 5);
        emit('PlanEffectiveChanged', plan);
        emit('PlanLockChanged', lock);

        expect(received).toEqual({ plan_saved$: plan, plan_deleted$: 5, plan_effective_changed$: plan, plan_lock_changed$: lock });
    });

    it('n\'écoute ni TaskChecksChanged ni SettingsSaved', () => {
        expect(hub.handlers.has('TaskChecksChanged')).toBe(false);
        expect(hub.handlers.has('SettingsSaved')).toBe(false);
    });

    it('lit les listes JSON de UserJoined et UserLeft dans users$', () => {
        const lists: number[][] = [];
        service.users$.subscribe((ids: number[]) => lists.push(ids));

        emit('UserJoined', '[1,2]');
        emit('UserLeft', '[2]');

        expect(lists).toEqual([[1, 2], [2]]);
    });

    it('expose l\'identifiant de connexion', () => {
        expect(service.connectionId()).toBe('conn-1');
    });

    it('appelle les méthodes du hub avec leurs arguments', async () => {
        await service.acquirePlanLock(4);
        await service.takePlanLock(4);
        await service.getPlanLocks();
        await service.releasePlanLock(4);
        await service.leavePresence();

        expect(invokeHub().mock.calls).toEqual([
            ['AcquirePlanLock', 4], ['TakePlanLock', 4], ['GetPlanLocks'], ['ReleasePlanLock', 4], ['LeavePresence']
        ]);
    });

    it('publie sur users$ la liste de JoinPresence, la redéclare après reconnexion puis signale reconnected$', async () => {
        const order: string[] = [];
        service.users$.subscribe((ids: number[]) => order.push(`users:${ids.join()}`));
        service.reconnected$.subscribe(() => order.push('reconnected'));
        invokeHub().mockResolvedValue([3]);
        await service.joinPresence();

        (<Handler>hub.reconnected)();
        await flush();

        expect(order).toEqual(['users:3', 'users:3', 'reconnected']);
    });

    describe('pré-ville (UseTown)', () => {
        const PRE_TOWN_MAP_ID: number = 1_000_000_005;
        let context: TownContextService;

        function enterPreTown(editable: boolean): void {
            context.setObservedTown(Object.assign(new TownDetails(), { town_id: PRE_TOWN_MAP_ID }), 'PV');
            context.setPreTownEditable(editable);
        }

        function methods(): string[] {
            return invokeHub().mock.calls.map((call: unknown[]): string => `${call[0]}${call[1] === undefined ? '' : ':' + String(call[1])}`);
        }

        beforeEach(() => {
            context = TestBed.inject(TownContextService);
            context.clear();
            invokeHub().mockClear();
        });

        afterEach(() => context.clear());

        it('sans pré-ville : aucun UseTown', async () => {
            await service.ensureTown();
            await service.joinPresence();
            await service.getPlanLocks();

            expect(methods().some((m: string): boolean => m.startsWith('UseTown'))).toBe(false);
        });

        it('pré-ville modifiable : UseTown(pseudo-mapId) précède JoinPresence', async () => {
            enterPreTown(true);
            await service.joinPresence();

            expect(methods()).toEqual([`UseTown:${PRE_TOWN_MAP_ID}`, 'JoinPresence']);
        });

        it('UseTown n\'est pas répété sur la même connexion', async () => {
            enterPreTown(true);
            await service.joinPresence();
            await service.getPlanLocks();

            expect(methods().filter((m: string): boolean => m.startsWith('UseTown')).length).toBe(1);
        });

        it('UseTown refusé : la présence n\'est pas déclarée sur la ville du jeton', async () => {
            enterPreTown(true);
            invokeHub().mockRejectedValueOnce(new Error('HubException: Forbidden'));

            await expect(service.joinPresence()).rejects.toThrow();
            expect(methods()).toEqual([`UseTown:${PRE_TOWN_MAP_ID}`]);
        });

        it('après une reconnexion (nouvelle connexion), UseTown est rejoué avant la présence', async () => {
            enterPreTown(true);
            await service.joinPresence();
            invokeHub().mockClear();
            vi.spyOn(hub, 'connectionId', 'get').mockReturnValue('conn-2');

            (<Handler>hub.reconnected)();
            await flush();

            expect(methods()).toEqual([`UseTown:${PRE_TOWN_MAP_ID}`, 'JoinPresence']);
        });

        it('pré-ville liée (gelée) : ensureTown ne lit ni n\'écrit les verrous, et getPlanLocks ne contacte pas le hub', async () => {
            enterPreTown(false);
            await service.ensureTown();

            expect(await service.getPlanLocks()).toEqual([]);
            expect(methods()).toEqual([`UseTown:${PRE_TOWN_MAP_ID}`]);
        });

        it('pré-ville gelée : un UseTown refusé ne lève pas dans ensureTown (pas de boucle d\'erreurs)', async () => {
            enterPreTown(false);
            invokeHub().mockRejectedValueOnce(new Error('HubException: Forbidden'));
            vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            await expect(service.ensureTown()).resolves.toBeUndefined();
        });

        it('retour à la ville du jeton : UseTown(ville du jeton) restaure le défaut', async () => {
            enterPreTown(true);
            await service.joinPresence();
            invokeHub().mockClear();
            context.clear();

            await service.ensureTown();

            expect(methods()).toEqual(['UseTown:42']);
        });
    });
});
