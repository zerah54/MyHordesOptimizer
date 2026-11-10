import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { getOwnTown } from '../../_core/utilities/localstorage.util';
import { BuildingPlanDTO, BuildingPlansDTO } from '../../my-town/buildings/planning/plan.types';
import { RealtimeGlobalService } from './_realtime-global.service';

/** Verrou d'édition d'un plan ; `holderUserId` et `holderConnectionId` sont `null` quand le plan est libre. */
export interface PlanLockDTO {
    planId: number;
    holderUserId: number | null;
    holderConnectionId: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class RealtimeBuildingPlansService extends RealtimeGlobalService {

    private plan_saved_subject: Subject<BuildingPlanDTO> = new Subject<BuildingPlanDTO>();
    public plan_saved$: Observable<BuildingPlanDTO> = this.plan_saved_subject.asObservable();

    private plan_deleted_subject: Subject<number> = new Subject<number>();
    public plan_deleted$: Observable<number> = this.plan_deleted_subject.asObservable();

    private plan_effective_changed_subject: Subject<BuildingPlanDTO> = new Subject<BuildingPlanDTO>();
    public plan_effective_changed$: Observable<BuildingPlanDTO> = this.plan_effective_changed_subject.asObservable();

    private settings_saved_subject: Subject<BuildingPlansDTO> = new Subject<BuildingPlansDTO>();
    public settings_saved$: Observable<BuildingPlansDTO> = this.settings_saved_subject.asObservable();

    private plan_lock_changed_subject: Subject<PlanLockDTO> = new Subject<PlanLockDTO>();
    public plan_lock_changed$: Observable<PlanLockDTO> = this.plan_lock_changed_subject.asObservable();

    private task_checks_changed_subject: Subject<number> = new Subject<number>();
    public task_checks_changed$: Observable<number> = this.task_checks_changed_subject.asObservable();

    /** Ids des utilisateurs présents : émis à chaque arrivée, départ ou déclaration de présence. */
    private users_subject: Subject<number[]> = new Subject<number[]>();
    public users$: Observable<number[]> = this.users_subject.asObservable();

    /** Connexion rétablie (présence redéclarée si besoin) : des événements ont pu se perdre, les données sont à relire. */
    private reconnected_subject: Subject<void> = new Subject<void>();
    public reconnected$: Observable<void> = this.reconnected_subject.asObservable();

    /** Page ouverte : une reconnexion fait perdre la présence côté hub, elle est alors redéclarée. */
    private presence_requested: boolean = false;

    /** Ville du jeton avec lequel la connexion a été ouverte : le hub en tire le groupe et les droits. */
    private connected_town_id: number | null = getOwnTown()?.town_id ?? null;

    public constructor() {
        super();

        this.defineConnexion('building-plans').then(() => {

            this.hubConnection.on('PlanSaved', (plan: BuildingPlanDTO) => {
                this.plan_saved_subject.next(plan);
            });

            this.hubConnection.on('PlanDeleted', (plan_id: number) => {
                this.plan_deleted_subject.next(plan_id);
            });

            this.hubConnection.on('PlanEffectiveChanged', (plan: BuildingPlanDTO) => {
                this.plan_effective_changed_subject.next(plan);
            });

            this.hubConnection.on('SettingsSaved', (settings: BuildingPlansDTO) => {
                this.settings_saved_subject.next(settings);
            });

            this.hubConnection.on('PlanLockChanged', (lock: PlanLockDTO) => {
                this.plan_lock_changed_subject.next(lock);
            });

            this.hubConnection.on('TaskChecksChanged', (user_id: number) => {
                this.task_checks_changed_subject.next(user_id);
            });

            this.hubConnection.on('UserJoined', (user_ids: string) => {
                this.users_subject.next(JSON.parse(user_ids));
            });

            this.hubConnection.on('UserLeft', (user_ids: string) => {
                this.users_subject.next(JSON.parse(user_ids));
            });

            this.hubConnection.onreconnected((): void => {
                void this.onReconnected();
            });

            // Reconnexion automatique abandonnée (ou ville changée) : relance sans fin, en espaçant les essais.
            this.hubConnection.onclose((): void => {
                void this.ensureConnected().then((): Promise<void> => this.onReconnected());
            });
        });
    }

    /** Identifiant de la connexion au hub, `null` hors connexion. */
    public connectionId(): string | null {
        return this.hubConnection?.connectionId ?? null;
    }

    /** Rouvre la connexion, avec le jeton courant, si la ville du joueur a changé depuis son ouverture. */
    public async ensureTown(): Promise<void> {
        const town_id: number | null = getOwnTown()?.town_id ?? null;
        if (town_id === this.connected_town_id) {
            return;
        }
        this.connected_town_id = town_id;
        await this.hubConnection.stop();
        await this.ensureConnected();
    }

    /** Déclare la présence (page ouverte), publie et renvoie la liste des présents. */
    public async joinPresence(): Promise<number[]> {
        this.presence_requested = true;
        return await this.declarePresence();
    }

    /** Retire la présence (page fermée). */
    public async leavePresence(): Promise<void> {
        this.presence_requested = false;
        await this.invokeHub('LeavePresence');
    }

    /** Prend le verrou d'édition d'un plan s'il est libre ; renvoie le verrou résultant. */
    public async acquirePlanLock(plan_id: number): Promise<PlanLockDTO> {
        return await this.invokeHub<PlanLockDTO>('AcquirePlanLock', plan_id);
    }

    /** Renvoie les verrous actifs de la ville, sans rien diffuser. */
    public async getPlanLocks(): Promise<PlanLockDTO[]> {
        return await this.invokeHub<PlanLockDTO[]>('GetPlanLocks');
    }

    /** Reprend de force le verrou d'un plan ; renvoie le verrou résultant. */
    public async takePlanLock(plan_id: number): Promise<PlanLockDTO> {
        return await this.invokeHub<PlanLockDTO>('TakePlanLock', plan_id);
    }

    /** Libère le verrou d'un plan détenu par cette connexion. */
    public async releasePlanLock(plan_id: number): Promise<void> {
        await this.invokeHub('ReleasePlanLock', plan_id);
    }

    /** Prévient les autres clients que les cases cochées d'un utilisateur ont changé. */
    public async notifyTaskChecks(user_id: number): Promise<void> {
        await this.invokeHub('NotifyTaskChecks', user_id);
    }

    /** Déclare la présence au hub et publie la liste des présents. */
    private async declarePresence(): Promise<number[]> {
        const user_ids: number[] = await this.invokeHub<number[]>('JoinPresence');
        this.users_subject.next(user_ids);
        return user_ids;
    }

    /** Redéclare la présence si elle était demandée, puis signale la reconnexion (même en cas d'échec). */
    private async onReconnected(): Promise<void> {
        if (this.presence_requested) {
            try {
                await this.declarePresence();
            } catch (error: unknown) {
                console.warn('JoinPresence', error);
            }
        }
        this.reconnected_subject.next();
    }
}
