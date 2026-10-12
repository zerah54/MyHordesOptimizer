import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { getTown } from '../../_core/utilities/localstorage.util';
import { CitizenExpeditionDTO } from '../dto/citizen-expedition.dto';
import { CitizenExpeditionBagDTO } from '../dto/citizen-expedition-bag.dto';
import { ExpeditionDTO } from '../dto/expedition.dto';
import { ExpeditionOrderDTO } from '../dto/expedition-order.dto';
import { ExpeditionPartDTO } from '../dto/expedition-part.dto';
import { MapRouteChangeDTO, MapRouteDTO, MapRouteRequestDTO } from '../dto/map-route.dto';
import { dtoToModelArray, modelToDtoArray } from '../types/_common.class';
import { CitizenExpedition } from '../types/citizen-expedition.class';
import { CitizenExpeditionBag } from '../types/citizen-expedition-bag.class';
import { Expedition } from '../types/expedition.class';
import { ExpeditionOrder } from '../types/expedition-order.class';
import { ExpeditionPart } from '../types/expedition-part.class';
import { MapRoute, MapRouteChange, toMapRouteChange } from '../types/map-route.class';
import { RealtimeGlobalService } from './_realtime-global.service';

/**
 * Consignes d'une partie ou d'un citoyen d'expédition après enregistrement : la liste complète (vide quand toutes
 * ont été retirées) et son propriétaire.
 */
export interface ExpeditionOrdersUpdate {
    /** Partie ou citoyen d'expédition ; `null` si l'API ne l'a pas envoyé. */
    readonly owner_id: number | null;
    readonly orders: ExpeditionOrder[];
}

/** Préfixe des refus pour version périmée (`MhoConflictException.HubMessagePrefix` côté API). */
const HUB_CONFLICT_PREFIX: string = 'Conflict:';

/**
 * L'erreur d'un appel au hub est-elle un refus pour version périmée ? Le client SignalR la reçoit sous la forme
 * « An unexpected error occurred invoking '…' on the server. HubException: Conflict: … ».
 */
export function isHubConflictError(error: unknown): boolean {
    const message: string = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    return message.startsWith(HUB_CONFLICT_PREFIX) || message.includes(`HubException: ${HUB_CONFLICT_PREFIX}`);
}

@Injectable({
    providedIn: 'root'
})
export class RealtimeExpeditionsService extends RealtimeGlobalService {

    private expedition_updated_subject: Subject<Expedition> = new Subject<Expedition>();
    public expedition_updated$: Observable<Expedition> = this.expedition_updated_subject.asObservable();

    private expeditions_updated_subject: Subject<Expedition[]> = new Subject<Expedition[]>();
    public expeditions_updated$: Observable<Expedition[]> = this.expeditions_updated_subject.asObservable();

    private expedition_deleted_subject: Subject<number> = new Subject<number>();
    public expedition_deleted$: Observable<number> = this.expedition_deleted_subject.asObservable();

    private expedition_part_updated_subject: Subject<ExpeditionPart> = new Subject<ExpeditionPart>();
    public expedition_part_updated$: Observable<ExpeditionPart> = this.expedition_part_updated_subject.asObservable();

    private expedition_part_deleted_subject: Subject<number> = new Subject<number>();
    public expedition_part_deleted$: Observable<number> = this.expedition_part_deleted_subject.asObservable();

    private expedition_citizen_updated_subject: Subject<CitizenExpedition> = new Subject<CitizenExpedition>();
    public expedition_citizen_updated$: Observable<CitizenExpedition> = this.expedition_citizen_updated_subject.asObservable();

    private expedition_citizen_deleted_subject: Subject<number> = new Subject<number>();
    public expedition_citizen_deleted$: Observable<number> = this.expedition_citizen_deleted_subject.asObservable();

    private expedition_part_orders_updated_subject: Subject<ExpeditionOrdersUpdate> = new Subject<ExpeditionOrdersUpdate>();
    public expedition_part_orders_updated$: Observable<ExpeditionOrdersUpdate> = this.expedition_part_orders_updated_subject.asObservable();

    private expedition_citizen_orders_updated_subject: Subject<ExpeditionOrdersUpdate> = new Subject<ExpeditionOrdersUpdate>();
    public expedition_citizen_orders_updated$: Observable<ExpeditionOrdersUpdate> = this.expedition_citizen_orders_updated_subject.asObservable();

    private expedition_order_deleted_subject: Subject<number> = new Subject<number>();
    public expedition_order_deleted$: Observable<number> = this.expedition_order_deleted_subject.asObservable();

    private expedition_orders_updated_subject: Subject<Expedition> = new Subject<Expedition>();
    public expedition_orders_updated$: Observable<Expedition> = this.expedition_orders_updated_subject.asObservable();

    private expedition_order_updated_subject: Subject<ExpeditionOrder> = new Subject<ExpeditionOrder>();
    public expedition_order_updated$: Observable<ExpeditionOrder> = this.expedition_order_updated_subject.asObservable();

    private expedition_bag_updated_subject: Subject<CitizenExpeditionBag> = new Subject<CitizenExpeditionBag>();
    public expedition_bag_updated$: Observable<CitizenExpeditionBag> = this.expedition_bag_updated_subject.asObservable();

    private expedition_bag_deleted_subject: Subject<number> = new Subject<number>();
    public expedition_bag_deleted$: Observable<number> = this.expedition_bag_deleted_subject.asObservable();

    /** Tracé créé ou modifié : chaque client relit le tracé (l'événement ne dit rien d'un tracé privé). */
    private map_route_changed_subject: Subject<MapRouteChange> = new Subject<MapRouteChange>();
    public map_route_changed$: Observable<MapRouteChange> = this.map_route_changed_subject.asObservable();

    private map_route_deleted_subject: Subject<number> = new Subject<number>();
    public map_route_deleted$: Observable<number> = this.map_route_deleted_subject.asObservable();

    private user_joined_subject: Subject<number[]> = new Subject<number[]>();
    public user_joined$: Observable<number[]> = this.user_joined_subject.asObservable();

    private user_left_subject: Subject<number[]> = new Subject<number[]>();
    public user_left$: Observable<number[]> = this.user_left_subject.asObservable();

    /** Connexion rétablie, ville suivie rejointe : des événements ont pu se perdre, les données sont à relire. */
    private reconnected_subject: Subject<void> = new Subject<void>();
    public reconnected$: Observable<void> = this.reconnected_subject.asObservable();

    /**
     * Ville suivie par `joinTown`. Une reconnexion ramène la connexion sur la ville du jeton (ou sur aucune pour un
     * mort) : elle est alors rejointe.
     */
    private followed_town_id: number | null = null;

    /** Page des expéditions ouverte : une reconnexion fait perdre la présence côté hub, elle est alors redéclarée. */
    private presence_requested: boolean = false;

    public constructor() {
        super();

        this.defineConnexion('expeditions').then(() => {

            this.hubConnection.on('ExpeditionUpdated', (expedition: ExpeditionDTO) => {
                console.log('receive', 'ExpeditionUpdated', expedition);
                this.expedition_updated_subject.next(new Expedition(expedition));
            });

            this.hubConnection.on('ExpeditionsUpdated', (expeditions: ExpeditionDTO[]) => {
                console.log('receive', 'ExpeditionsUpdated', expeditions);
                this.expeditions_updated_subject.next(dtoToModelArray(Expedition, expeditions));
            });

            this.hubConnection.on('ExpeditionDeleted', (expedition_id: number) => {
                console.log('receive', 'ExpeditionDeleted', expedition_id);
                this.expedition_deleted_subject.next(expedition_id);
            });

            this.hubConnection.on('ExpeditionPartUpdated', (expedition_part: ExpeditionPartDTO) => {
                console.log('receive', 'ExpeditionPartUpdated', expedition_part);
                this.expedition_part_updated_subject.next(new ExpeditionPart(expedition_part));
            });

            this.hubConnection.on('ExpeditionPartDeleted', (expedition_part_id: number) => {
                console.log('receive', 'ExpeditionPartDeleted', expedition_part_id);
                this.expedition_part_deleted_subject.next(expedition_part_id);
            });

            this.hubConnection.on('ExpeditionCitizenUpdated', (expedition_citizen: CitizenExpeditionDTO) => {
                console.log('receive', 'ExpeditionCitizenUpdated', expedition_citizen);
                this.expedition_citizen_updated_subject.next(new CitizenExpedition(expedition_citizen));
            });

            this.hubConnection.on('ExpeditionCitizenDeleted', (expedition_citizen_id: number) => {
                console.log('receive', 'ExpeditionCitizenDeleted', expedition_citizen_id);
                this.expedition_citizen_deleted_subject.next(expedition_citizen_id);
            });

            this.hubConnection.on('ExpeditionPartOrdersUpdated', (expedition_orders: ExpeditionOrderDTO[], part_id?: number) => {
                console.log('receive', 'ExpeditionPartOrdersUpdated', expedition_orders, part_id);
                this.expedition_part_orders_updated_subject.next({ owner_id: part_id ?? null, orders: dtoToModelArray(ExpeditionOrder, expedition_orders) });
            });

            this.hubConnection.on('ExpeditionCitizenOrdersUpdated', (expedition_orders: ExpeditionOrderDTO[], citizen_id?: number) => {
                console.log('receive', 'ExpeditionCitizenOrdersUpdated', expedition_orders, citizen_id);
                this.expedition_citizen_orders_updated_subject.next({ owner_id: citizen_id ?? null, orders: dtoToModelArray(ExpeditionOrder, expedition_orders) });
            });

            this.hubConnection.on('ExpeditionOrderDeleted', (expedition_order_id: number) => {
                console.log('receive', 'ExpeditionOrderDeleted', expedition_order_id);
                this.expedition_order_deleted_subject.next(expedition_order_id);
            });

            this.hubConnection.on('ExpeditionOrderUpdated', (expedition_order: ExpeditionOrderDTO) => {
                console.log('receive', 'ExpeditionOrderUpdated', expedition_order);
                this.expedition_order_updated_subject.next(new ExpeditionOrder(expedition_order));
            });

            this.hubConnection.on('ExpeditionBagUpdated', (expedition_citizen_bag: CitizenExpeditionBagDTO) => {
                console.log('receive', 'ExpeditionBagUpdated', expedition_citizen_bag);
                this.expedition_bag_updated_subject.next(new CitizenExpeditionBag(expedition_citizen_bag));
            });

            this.hubConnection.on('ExpeditionBagDeleted', (expedition_citizen_bag_id: number) => {
                console.log('receive', 'ExpeditionBagDeleted', expedition_citizen_bag_id);
                this.expedition_bag_deleted_subject.next(expedition_citizen_bag_id);
            });

            this.hubConnection.on('MapRouteChanged', (change: MapRouteChangeDTO) => {
                console.log('receive', 'MapRouteChanged', change);
                this.map_route_changed_subject.next(toMapRouteChange(change));
            });

            this.hubConnection.on('MapRouteDeleted', (route_id: number) => {
                console.log('receive', 'MapRouteDeleted', route_id);
                this.map_route_deleted_subject.next(route_id);
            });

            this.hubConnection.on('UserJoined', (user_ids: string) => {
                console.log('receive', 'UserJoined', user_ids);
                this.user_joined_subject.next(JSON.parse(user_ids));
            });

            this.hubConnection.on('UserLeft', (user_ids: string) => {
                console.log('receive', 'UserLeft', user_ids);
                this.user_left_subject.next(JSON.parse(user_ids));
            });

            this.hubConnection.onreconnected((): void => {
                void this.onReconnected();
            });
        });
    }

    /**
     * Suit les événements d'une ville dont l'utilisateur est citoyen, vivant ou mort (ancienne ville observée), ou
     * revient à la sienne. Le hub refuse une ville dont il n'est pas citoyen : l'erreur est rejetée telle quelle.
     */
    public async joinTown(map_id: number): Promise<void> {
        console.log('send', 'JoinTown', map_id);
        await this.invokeHub('JoinTown', map_id);
        this.followed_town_id = map_id;
    }

    /**
     * Déclare la présence sur les expéditions de la ville suivie (page ouverte) et publie la liste des présents.
     * La connexion seule, ou la carte, ne rend pas présent.
     */
    public async joinPresence(): Promise<void> {
        this.presence_requested = true;
        await this.declarePresence();
    }

    /** Retire la présence (page fermée) ; les événements de la ville continuent d'arriver. */
    public async leavePresence(): Promise<void> {
        console.log('send', 'LeavePresence');
        this.presence_requested = false;
        await this.invokeHub('LeavePresence');
    }

    private async declarePresence(): Promise<void> {
        console.log('send', 'JoinPresence');
        const user_ids: number[] = await this.invokeHub<number[]>('JoinPresence');
        this.user_joined_subject.next(user_ids);
    }

    private async onReconnected(): Promise<void> {
        const town_id: number | null = this.followed_town_id;
        if (town_id !== null) {
            try {
                await this.invokeHub('JoinTown', town_id);
            } catch (error: unknown) {
                console.warn('JoinTown', town_id, error);
            }
        }
        if (this.presence_requested) {
            try {
                await this.declarePresence();
            } catch (error: unknown) {
                console.warn('JoinPresence', error);
            }
        }
        this.reconnected_subject.next();
    }

    public async updateExpedition(day: number, expedition: Expedition): Promise<void> {
        console.log('send', 'PostExpedition', getTown()?.town_id, day, expedition.modelToDtoShort());
        await this.invokeHub('PostExpedition', getTown()?.town_id, day, JSON.stringify(expedition.modelToDtoShort()));
    }

    public async deleteExpedition(expedition: Expedition): Promise<void> {
        console.log('send', 'DeleteExpedition', expedition.id);
        await this.invokeHub('DeleteExpedition', expedition.id);
    }

    public async copyExpeditions(from_day: number, to_day: number): Promise<void> {
        console.log('send', 'CopyExpeditions', getTown()?.town_id, from_day, to_day);
        await this.invokeHub('CopyExpeditions', getTown()?.town_id, from_day, to_day);
    }

    public async updateExpeditionPart(expedition: Expedition, part: ExpeditionPart): Promise<void> {
        console.log('send', 'PostExpeditionPart', expedition.id, part.modelToDtoShort());
        await this.invokeHub('PostExpeditionPart', expedition.id, JSON.stringify(part.modelToDtoShort()));
    }

    public async deleteExpeditionPart(part: ExpeditionPart): Promise<void> {
        console.log('send', 'DeleteExpeditionPart', part.id);
        await this.invokeHub('DeleteExpeditionPart', part.id);
    }

    public async updateExpeditionCitizen(part: ExpeditionPart, citizen: CitizenExpedition): Promise<void> {
        console.log('send', 'PostExpeditionCitizen', part.id, citizen.modelToDtoShort());
        await this.invokeHub('PostExpeditionCitizen', part.id, JSON.stringify(citizen.modelToDtoShort()));
    }

    public async deleteExpeditionCitizen(citizen: CitizenExpedition): Promise<void> {
        console.log('send', 'DeleteExpeditionCitizen', citizen.id);
        await this.invokeHub('DeleteExpeditionCitizen', citizen.id);
    }

    public async updateExpeditionPartOrders(part: ExpeditionPart, orders: ExpeditionOrder[]): Promise<void> {
        console.log('send', 'PostPartOrders', part.id, modelToDtoArray(orders));
        await this.invokeHub('PostPartOrders', part.id, JSON.stringify(modelToDtoArray(orders)));
    }

    public async updateExpeditionCitizenOrders(citizen: CitizenExpedition, orders: ExpeditionOrder[]): Promise<void> {
        console.log('send', 'PostCitizenOrders', citizen.id, modelToDtoArray(orders));
        await this.invokeHub('PostCitizenOrders', citizen.id, JSON.stringify(modelToDtoArray(orders)));
    }

    public async deleteExpeditionOrder(order: ExpeditionOrder): Promise<void> {
        console.log('send', 'DeleteExpeditionOrder', order.id);
        await this.invokeHub('DeleteExpeditionOrder', order.id);
    }

    public async updateExpeditionOrder(order: ExpeditionOrder): Promise<void> {
        console.log('send', 'SaveExpeditionOrder', order.modelToDto());
        await this.invokeHub('SaveExpeditionOrder', JSON.stringify(order.modelToDto()));
    }

    public async updateExpeditionBag(citizen: CitizenExpedition): Promise<void> {
        console.log('send', 'SaveExpeditionBag', citizen.id, citizen.bag.modelToDtoShort());
        await this.invokeHub('SaveExpeditionBag', citizen.id, JSON.stringify(citizen.bag.modelToDtoShort()));
    }

    public async deleteExpeditionBag(bag: CitizenExpeditionBag): Promise<void> {
        console.log('send', 'DeleteExpeditionBag', bag.bag_id);
        await this.invokeHub('DeleteExpeditionBag', bag.bag_id);
    }

    /**
     * Crée ou modifie un tracé et renvoie le tracé enregistré (nouvelle version). Version périmée : rejet
     * reconnu par `isHubConflictError`.
     */
    public async saveMapRoute(map_id: number, route: MapRouteRequestDTO): Promise<MapRoute> {
        console.log('send', 'SaveMapRoute', map_id, route);
        const saved: MapRouteDTO = await this.invokeHub<MapRouteDTO>('SaveMapRoute', map_id, JSON.stringify(route));
        return new MapRoute(saved);
    }

    /** Copie un itinéraire du jeu en tracé MHO ; renvoie le tracé créé. */
    public async copyGameRoute(map_id: number, game_route_id: number): Promise<MapRoute> {
        console.log('send', 'CopyGameRoute', map_id, game_route_id);
        const saved: MapRouteDTO = await this.invokeHub<MapRouteDTO>('CopyGameRoute', map_id, game_route_id);
        return new MapRoute(saved);
    }

    public async deleteMapRoute(route_id: number): Promise<void> {
        console.log('send', 'DeleteMapRoute', route_id);
        await this.invokeHub('DeleteMapRoute', route_id);
    }
}
