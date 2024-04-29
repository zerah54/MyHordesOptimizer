import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { getTown } from '../../shared/utilities/localstorage.util';
import { CitizenExpeditionBagDTO } from '../dto/citizen-expedition-bag.dto';
import { CitizenExpeditionDTO } from '../dto/citizen-expedition.dto';
import { ExpeditionOrderDTO } from '../dto/expedition-order.dto';
import { ExpeditionPartDTO } from '../dto/expedition-part.dto';
import { ExpeditionDTO } from '../dto/expedition.dto';
import { dtoToModelArray, modelToDtoArray } from '../types/_common.class';
import { CitizenExpeditionBag } from '../types/citizen-expedition-bag.class';
import { CitizenExpedition } from '../types/citizen-expedition.class';
import { ExpeditionOrder } from '../types/expedition-order.class';
import { ExpeditionPart } from '../types/expedition-part.class';
import { Expedition } from '../types/expedition.class';
import { RealtimeGlobalService } from './_realtime-global.service';

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

    private expedition_part_orders_updated_subject: Subject<ExpeditionOrder[]> = new Subject<ExpeditionOrder[]>();
    public expedition_part_orders_updated$: Observable<ExpeditionOrder[]> = this.expedition_part_orders_updated_subject.asObservable();

    private expedition_citizen_orders_updated_subject: Subject<ExpeditionOrder[]> = new Subject<ExpeditionOrder[]>();
    public expedition_citizen_orders_updated$: Observable<ExpeditionOrder[]> = this.expedition_citizen_orders_updated_subject.asObservable();

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

    private user_joined_subject: Subject<number[]> = new Subject<number[]>();
    public user_joined$: Observable<number[]> = this.user_joined_subject.asObservable();

    private user_left_subject: Subject<number[]> = new Subject<number[]>();
    public user_left$: Observable<number[]> = this.user_left_subject.asObservable();

    constructor() {
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

            this.hubConnection.on('ExpeditionPartOrdersUpdated', (expedition_orders: ExpeditionOrderDTO[]) => {
                console.log('receive', 'ExpeditionPartOrdersUpdated', expedition_orders);
                this.expedition_part_orders_updated_subject.next(dtoToModelArray(ExpeditionOrder, expedition_orders));
            });

            this.hubConnection.on('ExpeditionCitizenOrdersUpdated', (expedition_orders: ExpeditionOrderDTO[]) => {
                console.log('receive', 'ExpeditionCitizenOrdersUpdated', expedition_orders);
                this.expedition_citizen_orders_updated_subject.next(dtoToModelArray(ExpeditionOrder, expedition_orders));
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

            this.hubConnection.on('UserJoined', (user_ids: string) => {
                console.log('receive', 'UserJoined', user_ids);
                this.user_joined_subject.next(JSON.parse(user_ids));
            });

            this.hubConnection.on('UserLeft', (user_ids: string) => {
                console.log('receive', 'UserLeft', user_ids);
                this.user_left_subject.next(JSON.parse(user_ids));
            });
        });
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
        console.log('send', 'SaveExpeditionBag', bag.bag_id);
        await this.invokeHub('SaveExpeditionBag', bag.bag_id);
    }
}
