import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
    ExpeditionLockDTO,
    expeditionLockKey,
    ExpeditionLockKind,
    hubLockHolder,
    RealtimeExpeditionsService
} from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import { getUserId } from '../../../_core/utilities/localstorage.util';
import { BlockLockState } from './expedition-locks.util';

/** Délai minimal entre deux signaux d'activité envoyés pour un même bloc. */
const TOUCH_INTERVAL_MS: number = 10000;

const FREE_STATE: BlockLockState = { kind: 'free' };
const MINE_STATE: BlockLockState = { kind: 'mine' };

/** État des verrous d'édition des blocs de la page Expéditions. Fourni par `ExpeditionsComponent`. */
@Injectable()
export class ExpeditionLocksStore {

    private readonly realtime: RealtimeExpeditionsService = inject(RealtimeExpeditionsService);

    private readonly locks: WritableSignal<ReadonlyMap<string, ExpeditionLockDTO>> = signal(new Map<string, ExpeditionLockDTO>());
    /** Blocs que l'utilisateur occupe (entrés, pas encore quittés). */
    private readonly entered: Set<string> = new Set<string>();
    private readonly in_flight: Map<string, Promise<BlockLockState>> = new Map<string, Promise<BlockLockState>>();
    private readonly last_touch: Map<string, number> = new Map<string, number>();
    /** Libérations différées d'une tâche : un bloc à plusieurs hôtes (cellules d'une ligne) est ré-entré aussitôt quitté. */
    private readonly pending_release: Map<string, ReturnType<typeof setTimeout>> = new Map<string, ReturnType<typeof setTimeout>>();
    /** Signal d'activité différé à la fin de la fenêtre de 10 s, pour une activité survenue pendant celle-ci. */
    private readonly trailing_touch: Map<string, ReturnType<typeof setTimeout>> = new Map<string, ReturnType<typeof setTimeout>>();

    private readonly held_keys: Signal<ReadonlySet<string>> = computed((): ReadonlySet<string> => {
        const held: Set<string> = new Set<string>();
        this.locks().forEach((lock: ExpeditionLockDTO, key: string): void => {
            if (this.isMine(lock)) {
                held.add(key);
            }
        });
        return held;
    });

    public constructor() {
        this.realtime.expedition_lock_changed$.pipe(takeUntilDestroyed()).subscribe((lock: ExpeditionLockDTO): void => this.apply(lock));
        this.realtime.reconnected$.pipe(takeUntilDestroyed()).subscribe((): void => void this.refresh());
        void this.refresh();
    }

    /** État du bloc `key` (`kind:entity_id`). */
    public stateOf(key: string): Signal<BlockLockState> {
        return computed((): BlockLockState => this.toState(this.locks().get(key)));
    }

    /** Clés des blocs tenus par cette connexion. */
    public heldKeys(): ReadonlySet<string> {
        return this.held_keys();
    }

    /** Prend le verrou du bloc ; erreur technique : résout à l'état courant. Les prises en cours sont partagées. */
    public enter(kind: ExpeditionLockKind, entity_id: number): Promise<BlockLockState> {
        const key: string = expeditionLockKey(kind, entity_id);
        this.entered.add(key);
        const pending_release: ReturnType<typeof setTimeout> | undefined = this.pending_release.get(key);
        if (pending_release !== undefined) {
            clearTimeout(pending_release);
            this.pending_release.delete(key);
        }
        const current: BlockLockState = this.toState(this.locks().get(key));
        if (current.kind === 'mine') {
            return Promise.resolve(current);
        }
        const pending: Promise<BlockLockState> | undefined = this.in_flight.get(key);
        if (pending !== undefined) {
            return pending;
        }
        const acquisition: Promise<BlockLockState> = this.acquire(kind, entity_id, key, current).finally((): void => {
            this.in_flight.delete(key);
        });
        this.in_flight.set(key, acquisition);
        return acquisition;
    }

    /** Prolonge le verrou (au plus une fois par 10 s) ; verrou perdu sur un bloc encore occupé : tente de le reprendre. */
    public activity(kind: ExpeditionLockKind, entity_id: number): void {
        const key: string = expeditionLockKey(kind, entity_id);
        if (!this.entered.has(key)) {
            return;
        }
        const state: BlockLockState = this.toState(this.locks().get(key));
        if (state.kind === 'free') {
            if (!this.in_flight.has(key)) {
                void this.enter(kind, entity_id);
            }
            return;
        }
        if (state.kind !== 'mine') {
            return;
        }
        const elapsed: number = Date.now() - (this.last_touch.get(key) ?? 0);
        if (elapsed >= TOUCH_INTERVAL_MS) {
            this.touch(kind, entity_id, key);
        } else if (!this.trailing_touch.has(key)) {
            this.trailing_touch.set(key, setTimeout((): void => {
                this.trailing_touch.delete(key);
                if (this.entered.has(key) && this.toState(this.locks().get(key)).kind === 'mine') {
                    this.touch(kind, entity_id, key);
                }
            }, TOUCH_INTERVAL_MS - elapsed));
        }
    }

    /** Envoie le signal d'activité du bloc ; refus Locked : le bloc passe à son détenteur. */
    private touch(kind: ExpeditionLockKind, entity_id: number, key: string): void {
        this.clearTrailingTouch(key);
        this.last_touch.set(key, Date.now());
        this.realtime.touchLock(kind, entity_id).catch((error: unknown): void => {
            const holder: number | null = hubLockHolder(error);
            if (holder === null) {
                console.warn('TouchLock', kind, entity_id, error);
                return;
            }
            this.apply({ kind, entityId: entity_id, holderUserId: holder, holderConnectionId: null });
        });
    }

    /** Libère le verrou du bloc s'il est tenu par cette connexion, à la tâche suivante sauf s'il est ré-entré d'ici là. */
    public leave(kind: ExpeditionLockKind, entity_id: number): void {
        const key: string = expeditionLockKey(kind, entity_id);
        this.entered.delete(key);
        this.clearTrailingTouch(key);
        if (this.pending_release.has(key) || this.toState(this.locks().get(key)).kind !== 'mine') {
            return;
        }
        this.pending_release.set(key, setTimeout((): void => {
            this.pending_release.delete(key);
            if (this.entered.has(key) || this.toState(this.locks().get(key)).kind !== 'mine') {
                return;
            }
            this.last_touch.delete(key);
            this.remove(key);
            this.realtime.releaseLock(kind, entity_id).catch((error: unknown): void => console.warn('ReleaseLock', kind, entity_id, error));
        }));
    }

    /** Remplace la carte des verrous par celle du serveur ; échec : garde la carte actuelle. */
    public async refresh(): Promise<void> {
        try {
            const locks: ExpeditionLockDTO[] = await this.realtime.getLocks();
            this.locks.set(new Map(locks.map((lock: ExpeditionLockDTO): [string, ExpeditionLockDTO] => [expeditionLockKey(lock.kind, lock.entityId), lock])));
        } catch (error: unknown) {
            console.warn('GetExpeditionLocks', error);
        }
    }

    private async acquire(kind: ExpeditionLockKind, entity_id: number, key: string, current: BlockLockState): Promise<BlockLockState> {
        try {
            const granted: ExpeditionLockDTO = await this.realtime.acquireLock(kind, entity_id);
            if (!this.entered.has(key)) {
                if (this.isMine(granted)) {
                    this.realtime.releaseLock(kind, entity_id).catch((error: unknown): void => console.warn('ReleaseLock', kind, entity_id, error));
                }
                return FREE_STATE;
            }
            this.apply(granted);
            this.last_touch.set(key, Date.now());
        } catch (error: unknown) {
            const holder: number | null = hubLockHolder(error);
            if (holder === null) {
                console.warn('AcquireLock', kind, entity_id, error);
                return current;
            }
            this.apply({ kind, entityId: entity_id, holderUserId: holder, holderConnectionId: null });
        }
        return this.toState(this.locks().get(key));
    }

    private isMine(lock: ExpeditionLockDTO): boolean {
        const connection_id: string | null = this.realtime.connectionId();
        return connection_id !== null && lock.holderConnectionId === connection_id;
    }

    private toState(lock: ExpeditionLockDTO | undefined): BlockLockState {
        if (lock === undefined || lock.holderUserId === null) {
            return FREE_STATE;
        }
        if (this.isMine(lock)) {
            return MINE_STATE;
        }
        return { kind: 'other', user_id: lock.holderUserId, same_user: lock.holderUserId === getUserId() };
    }

    private apply(lock: ExpeditionLockDTO): void {
        const key: string = expeditionLockKey(lock.kind, lock.entityId);
        if (lock.holderUserId === null) {
            this.remove(key);
            return;
        }
        if (!this.isMine(lock)) {
            this.clearTrailingTouch(key);
        }
        this.locks.update((map: ReadonlyMap<string, ExpeditionLockDTO>): ReadonlyMap<string, ExpeditionLockDTO> => new Map(map).set(key, lock));
    }

    /** Annule le signal d'activité différé du bloc. */
    private clearTrailingTouch(key: string): void {
        const timer: ReturnType<typeof setTimeout> | undefined = this.trailing_touch.get(key);
        if (timer !== undefined) {
            clearTimeout(timer);
            this.trailing_touch.delete(key);
        }
    }

    private remove(key: string): void {
        this.clearTrailingTouch(key);
        this.locks.update((map: ReadonlyMap<string, ExpeditionLockDTO>): ReadonlyMap<string, ExpeditionLockDTO> => {
            const next: Map<string, ExpeditionLockDTO> = new Map(map);
            next.delete(key);
            return next;
        });
    }
}
