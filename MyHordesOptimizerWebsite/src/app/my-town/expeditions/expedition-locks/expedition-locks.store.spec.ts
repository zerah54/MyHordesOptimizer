import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import type { Mock } from 'vitest';

import { ExpeditionLockDTO, RealtimeExpeditionsService } from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import { Me } from '../../../_abstract_model/types/me.class';
import { setUser } from '../../../_core/utilities/localstorage.util';
import { ExpeditionLocksStore } from './expedition-locks.store';

const CONNECTION: string = 'c1';

function lock(holder: number | null, connection: string | null, id: number = 5): ExpeditionLockDTO {
    return { kind: 'citizen', entityId: id, holderUserId: holder, holderConnectionId: connection };
}

describe('ExpeditionLocksStore', () => {
    let changed: Subject<ExpeditionLockDTO>;
    let reconnected: Subject<void>;
    let acquire: Mock<() => Promise<ExpeditionLockDTO>>;
    let touch: Mock<() => Promise<void>>;
    let release: Mock<() => Promise<void>>;
    let get_locks: Mock<() => Promise<ExpeditionLockDTO[]>>;
    let store: ExpeditionLocksStore;

    beforeEach(async () => {
        setUser({ id: 7 } as Me);
        changed = new Subject<ExpeditionLockDTO>();
        reconnected = new Subject<void>();
        acquire = vi.fn();
        touch = vi.fn((): Promise<void> => Promise.resolve());
        release = vi.fn((): Promise<void> => Promise.resolve());
        get_locks = vi.fn((): Promise<ExpeditionLockDTO[]> => Promise.resolve([]));
        TestBed.configureTestingModule({
            providers: [ExpeditionLocksStore, {
                provide: RealtimeExpeditionsService,
                useValue: {
                    expedition_lock_changed$: changed.asObservable(),
                    reconnected$: reconnected.asObservable(),
                    connectionId: (): string => CONNECTION,
                    acquireLock: acquire,
                    touchLock: touch,
                    releaseLock: release,
                    getLocks: get_locks
                }
            }]
        });
        store = TestBed.inject(ExpeditionLocksStore);
        await store.refresh();
    });

    afterEach(() => {
        setUser(null);
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('enter accordé : mine', async () => {
        acquire.mockResolvedValue(lock(7, CONNECTION));
        await store.enter('citizen', 5);
        expect(store.stateOf('citizen:5')()).toEqual({ kind: 'mine' });
        expect(store.heldKeys().has('citizen:5')).toBe(true);
    });

    it('enter refusé par un autre : other', async () => {
        acquire.mockRejectedValue(new Error('HubException: Locked:9'));
        await store.enter('citizen', 5);
        expect(store.stateOf('citizen:5')()).toEqual({ kind: 'other', user_id: 9, same_user: false });
    });

    it('enter refusé par soi-même sur une autre connexion : same_user', async () => {
        acquire.mockRejectedValue(new Error('HubException: Locked:7'));
        await store.enter('citizen', 5);
        expect(store.stateOf('citizen:5')()).toEqual({ kind: 'other', user_id: 7, same_user: true });
    });

    it('enter sur erreur technique : état courant', async () => {
        vi.spyOn(console, 'warn').mockImplementation((): void => undefined);
        acquire.mockRejectedValue(new Error('boom'));
        expect(await store.enter('citizen', 5)).toEqual({ kind: 'free' });
    });

    it('activity : un seul touchLock en 10 s', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        acquire.mockResolvedValue(lock(7, CONNECTION));
        await store.enter('citizen', 5);
        vi.advanceTimersByTime(11000);
        store.activity('citizen', 5);
        vi.advanceTimersByTime(5000);
        store.activity('citizen', 5);
        expect(touch).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(6000);
        store.activity('citizen', 5);
        expect(touch).toHaveBeenCalledTimes(2);
    });

    it('activity dans la fenêtre de 10 s : un touchLock différé à la fin de la fenêtre', async () => {
        vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
        acquire.mockResolvedValue(lock(7, CONNECTION));
        await store.enter('citizen', 5);
        vi.advanceTimersByTime(11000);
        store.activity('citizen', 5);
        vi.advanceTimersByTime(2000);
        store.activity('citizen', 5);
        store.activity('citizen', 5);
        vi.advanceTimersByTime(7999);
        expect(touch).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(1);
        expect(touch).toHaveBeenCalledTimes(2);
        vi.advanceTimersByTime(20000);
        expect(touch).toHaveBeenCalledTimes(2);
    });

    it('activity dans la fenêtre puis leave : aucun touchLock différé', async () => {
        vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
        acquire.mockResolvedValue(lock(7, CONNECTION));
        await store.enter('citizen', 5);
        store.activity('citizen', 5);
        store.leave('citizen', 5);
        vi.advanceTimersByTime(20000);
        expect(touch).not.toHaveBeenCalled();
    });

    it('activity sur verrou perdu : relance enter', async () => {
        acquire.mockResolvedValue(lock(7, CONNECTION));
        await store.enter('citizen', 5);
        changed.next(lock(null, null));
        store.activity('citizen', 5);
        expect(acquire).toHaveBeenCalledTimes(2);
    });

    it('activity après leave : pas de prise', async () => {
        acquire.mockResolvedValue(lock(7, CONNECTION));
        await store.enter('citizen', 5);
        store.leave('citizen', 5);
        store.activity('citizen', 5);
        expect(acquire).toHaveBeenCalledTimes(1);
    });

    it('activity sur bloc jamais entré : pas de prise', () => {
        store.activity('citizen', 5);
        expect(acquire).not.toHaveBeenCalled();
    });

    it('deux enter concurrents : une seule prise', async () => {
        acquire.mockResolvedValue(lock(7, CONNECTION));
        await Promise.all([store.enter('citizen', 5), store.enter('citizen', 5)]);
        expect(acquire).toHaveBeenCalledTimes(1);
    });

    it('touchLock refusé Locked : état other', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        acquire.mockResolvedValue(lock(7, CONNECTION));
        await store.enter('citizen', 5);
        vi.advanceTimersByTime(11000);
        touch.mockRejectedValue(new Error('HubException: Locked:9'));
        store.activity('citizen', 5);
        await vi.waitFor((): void => expect(store.stateOf('citizen:5')()).toEqual({ kind: 'other', user_id: 9, same_user: false }));
    });

    it('leave pendant une prise : libération dès l’octroi', async () => {
        let grant: (lock: ExpeditionLockDTO) => void = (): void => undefined;
        acquire.mockReturnValue(new Promise<ExpeditionLockDTO>((resolve: (lock: ExpeditionLockDTO) => void): void => {
            grant = resolve;
        }));
        const pending: Promise<unknown> = store.enter('citizen', 5);
        store.leave('citizen', 5);
        grant(lock(7, CONNECTION));
        await pending;
        expect(release).toHaveBeenCalledTimes(1);
        expect(store.stateOf('citizen:5')()).toEqual({ kind: 'free' });
    });

    it('leave : releaseLock à la tâche suivante', async () => {
        acquire.mockResolvedValue(lock(7, CONNECTION));
        await store.enter('citizen', 5);
        vi.useFakeTimers();
        store.leave('citizen', 5);
        expect(release).not.toHaveBeenCalled();
        vi.runAllTimers();
        expect(release).toHaveBeenCalledWith('citizen', 5);
        expect(store.stateOf('citizen:5')()).toEqual({ kind: 'free' });
    });

    it('leave puis enter dans la même tâche (autre cellule du bloc) : verrou gardé, aucun appel', async () => {
        acquire.mockResolvedValue(lock(7, CONNECTION));
        await store.enter('citizen', 5);
        vi.useFakeTimers();
        store.leave('citizen', 5);
        expect(await store.enter('citizen', 5)).toEqual({ kind: 'mine' });
        vi.runAllTimers();
        expect(release).not.toHaveBeenCalled();
        expect(acquire).toHaveBeenCalledTimes(1);
        expect(store.stateOf('citizen:5')()).toEqual({ kind: 'mine' });
        store.activity('citizen', 5);
        expect(acquire).toHaveBeenCalledTimes(1);
    });

    it('reconnected$ : getLocks rappelé', () => {
        get_locks.mockClear();
        reconnected.next();
        expect(get_locks).toHaveBeenCalledTimes(1);
    });

    it('refresh en échec : garde la carte', async () => {
        vi.spyOn(console, 'warn').mockImplementation((): void => undefined);
        acquire.mockResolvedValue(lock(7, CONNECTION));
        await store.enter('citizen', 5);
        get_locks.mockRejectedValue(new Error('no town'));
        await store.refresh();
        expect(store.stateOf('citizen:5')()).toEqual({ kind: 'mine' });
    });

    it('expedition_lock_changed$ : pose puis libère', () => {
        changed.next(lock(9, 'x'));
        expect(store.stateOf('citizen:5')()).toEqual({ kind: 'other', user_id: 9, same_user: false });
        changed.next(lock(null, null));
        expect(store.stateOf('citizen:5')()).toEqual({ kind: 'free' });
    });
});
