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

    private expeditionUpdatedSubject: Subject<Expedition> = new Subject<Expedition>();
    public expeditionUpdated$: Observable<Expedition> = this.expeditionUpdatedSubject.asObservable();

    private expeditionsUpdatedSubject: Subject<Expedition[]> = new Subject<Expedition[]>();
    public expeditionsUpdated$: Observable<Expedition[]> = this.expeditionsUpdatedSubject.asObservable();

    private expeditionDeletedSubject: Subject<number> = new Subject<number>();
    public expeditionDeleted$: Observable<number> = this.expeditionDeletedSubject.asObservable();

    private expeditionPartUpdatedSubject: Subject<ExpeditionPart> = new Subject<ExpeditionPart>();
    public expeditionPartUpdated$: Observable<ExpeditionPart> = this.expeditionPartUpdatedSubject.asObservable();

    private expeditionPartDeletedSubject: Subject<number> = new Subject<number>();
    public expeditionPartDeleted$: Observable<number> = this.expeditionPartDeletedSubject.asObservable();

    private expeditionCitizenUpdatedSubject: Subject<CitizenExpedition> = new Subject<CitizenExpedition>();
    public expeditionCitizenUpdated$: Observable<CitizenExpedition> = this.expeditionCitizenUpdatedSubject.asObservable();

    private expeditionCitizenDeletedSubject: Subject<number> = new Subject<number>();
    public expeditionCitizenDeleted$: Observable<number> = this.expeditionCitizenDeletedSubject.asObservable();

    private expeditionPartOrdersUpdatedSubject: Subject<ExpeditionOrder[]> = new Subject<ExpeditionOrder[]>();
    public expeditionPartOrdersUpdated$: Observable<ExpeditionOrder[]> = this.expeditionPartOrdersUpdatedSubject.asObservable();

    private expeditionCitizenOrdersUpdatedSubject: Subject<ExpeditionOrder[]> = new Subject<ExpeditionOrder[]>();
    public expeditionCitizenOrdersUpdated$: Observable<ExpeditionOrder[]> = this.expeditionCitizenOrdersUpdatedSubject.asObservable();

    private expeditionOrderDeletedSubject: Subject<number> = new Subject<number>();
    public expeditionOrderDeleted$: Observable<number> = this.expeditionOrderDeletedSubject.asObservable();

    private expeditionOrdersUpdatedSubject: Subject<Expedition> = new Subject<Expedition>();
    public expeditionOrdersUpdated$: Observable<Expedition> = this.expeditionOrdersUpdatedSubject.asObservable();

    private expeditionOrderUpdatedSubject: Subject<ExpeditionOrder> = new Subject<ExpeditionOrder>();
    public expeditionOrderUpdated$: Observable<ExpeditionOrder> = this.expeditionOrderUpdatedSubject.asObservable();

    private expeditionBagUpdatedSubject: Subject<CitizenExpeditionBag> = new Subject<CitizenExpeditionBag>();
    public expeditionBagUpdated$: Observable<CitizenExpeditionBag> = this.expeditionBagUpdatedSubject.asObservable();

    private expeditionBagDeletedSubject: Subject<number> = new Subject<number>();
    public expeditionBagDeleted$: Observable<number> = this.expeditionBagDeletedSubject.asObservable();

    private userJoinedSubject: Subject<number[]> = new Subject<number[]>();
    public userJoined$: Observable<number[]> = this.userJoinedSubject.asObservable();

    private userLeftSubject: Subject<number[]> = new Subject<number[]>();
    public userLeft$: Observable<number[]> = this.userLeftSubject.asObservable();

    constructor() {
        super();

        this.startConnexion('expeditions').then(() => {

            this.hubConnection.on('ExpeditionUpdated', (expedition: ExpeditionDTO) => {
                console.log('receive', 'ExpeditionUpdated', expedition);
                this.expeditionUpdatedSubject.next(new Expedition(expedition));
            });

            this.hubConnection.on('ExpeditionsUpdated', (expeditions: ExpeditionDTO[]) => {
                console.log('receive', 'ExpeditionsUpdated', expeditions);
                this.expeditionsUpdatedSubject.next(dtoToModelArray(Expedition, expeditions));
            });

            this.hubConnection.on('ExpeditionDeleted', (expedition_id: number) => {
                console.log('receive', 'ExpeditionDeleted', expedition_id);
                this.expeditionDeletedSubject.next(expedition_id);
            });

            this.hubConnection.on('ExpeditionPartUpdated', (expedition_part: ExpeditionPartDTO) => {
                console.log('receive', 'ExpeditionPartUpdated', expedition_part);
                this.expeditionPartUpdatedSubject.next(new ExpeditionPart(expedition_part));
            });

            this.hubConnection.on('ExpeditionPartDeleted', (expedition_part_id: number) => {
                console.log('receive', 'ExpeditionPartDeleted', expedition_part_id);
                this.expeditionPartDeletedSubject.next(expedition_part_id);
            });

            this.hubConnection.on('ExpeditionCitizenUpdated', (expedition_citizen: CitizenExpeditionDTO) => {
                console.log('receive', 'ExpeditionCitizenUpdated', expedition_citizen);
                this.expeditionCitizenUpdatedSubject.next(new CitizenExpedition(expedition_citizen));
            });

            this.hubConnection.on('ExpeditionCitizenDeleted', (expedition_citizen_id: number) => {
                console.log('receive', 'ExpeditionCitizenDeleted', expedition_citizen_id);
                this.expeditionCitizenDeletedSubject.next(expedition_citizen_id);
            });

            this.hubConnection.on('ExpeditionPartOrdersUpdated', (expedition_orders: ExpeditionOrderDTO[]) => {
                console.log('receive', 'ExpeditionPartOrdersUpdated', expedition_orders);
                this.expeditionPartOrdersUpdatedSubject.next(dtoToModelArray(ExpeditionOrder, expedition_orders));
            });

            this.hubConnection.on('ExpeditionCitizenOrdersUpdated', (expedition_orders: ExpeditionOrderDTO[]) => {
                console.log('receive', 'ExpeditionCitizenOrdersUpdated', expedition_orders);
                this.expeditionCitizenOrdersUpdatedSubject.next(dtoToModelArray(ExpeditionOrder, expedition_orders));
            });

            this.hubConnection.on('ExpeditionOrderDeleted', (expedition_order_id: number) => {
                console.log('receive', 'ExpeditionOrderDeleted', expedition_order_id);
                this.expeditionOrderDeletedSubject.next(expedition_order_id);
            });

            this.hubConnection.on('ExpeditionOrderUpdated', (expedition_order: ExpeditionOrderDTO) => {
                console.log('receive', 'ExpeditionOrderUpdated', expedition_order);
                this.expeditionOrderUpdatedSubject.next(new ExpeditionOrder(expedition_order));
            });

            this.hubConnection.on('ExpeditionBagUpdated', (expedition_citizen_bag: CitizenExpeditionBagDTO) => {
                console.log('receive', 'ExpeditionBagUpdated', expedition_citizen_bag);
                this.expeditionBagUpdatedSubject.next(new CitizenExpeditionBag(expedition_citizen_bag));
            });

            this.hubConnection.on('ExpeditionBagDeleted', (expedition_citizen_bag_id: number) => {
                console.log('receive', 'ExpeditionBagDeleted', expedition_citizen_bag_id);
                this.expeditionBagDeletedSubject.next(expedition_citizen_bag_id);
            });

            this.hubConnection.on('UserJoined', (user_ids: string) => {
                console.log('receive', 'UserJoined', user_ids);
                this.userJoinedSubject.next(JSON.parse(user_ids));
            });

            this.hubConnection.on('UserLeft', (user_ids: string) => {
                console.log('receive', 'UserLeft', user_ids);
                this.userLeftSubject.next(JSON.parse(user_ids));
            });
        });
    }

    public async updateExpedition(day: number, expedition: Expedition): Promise<void> {
        console.log('send', 'PostExpedition', getTown()?.town_id, day, expedition.modelToDtoShort());
        await this.hubConnection.invoke('PostExpedition', getTown()?.town_id, day, JSON.stringify(expedition.modelToDtoShort()));
    }

    public async deleteExpedition(expedition: Expedition): Promise<void> {
        console.log('send', 'DeleteExpedition', expedition.id);
        await this.hubConnection.invoke('DeleteExpedition', expedition.id);
    }

    public async copyExpeditions(from_day: number, to_day: number): Promise<void> {
        console.log('send', 'CopyExpeditions', getTown()?.town_id, from_day, to_day);
        await this.hubConnection.invoke('CopyExpeditions', getTown()?.town_id, from_day, to_day);
    }

    public async updateExpeditionPart(expedition: Expedition, part: ExpeditionPart): Promise<void> {
        console.log('send', 'PostExpeditionPart', expedition.id, part.modelToDtoShort());
        await this.hubConnection.invoke('PostExpeditionPart', expedition.id, JSON.stringify(part.modelToDtoShort()));
    }

    public async deleteExpeditionPart(part: ExpeditionPart): Promise<void> {
        console.log('send', 'DeleteExpeditionPart', part.id);
        await this.hubConnection.invoke('DeleteExpeditionPart', part.id);
    }

    public async updateExpeditionCitizen(part: ExpeditionPart, citizen: CitizenExpedition): Promise<void> {
        console.log('send', 'PostExpeditionCitizen', part.id, citizen.modelToDtoShort());
        await this.hubConnection.invoke('PostExpeditionCitizen', part.id, JSON.stringify(citizen.modelToDtoShort()));
    }

    public async deleteExpeditionCitizen(citizen: CitizenExpedition): Promise<void> {
        console.log('send', 'DeleteExpeditionCitizen', citizen.id);
        await this.hubConnection.invoke('DeleteExpeditionCitizen', citizen.id);
    }

    public async updateExpeditionPartOrders(part: ExpeditionPart, orders: ExpeditionOrder[]): Promise<void> {
        console.log('send', 'PostPartOrders', part.id, modelToDtoArray(orders));
        await this.hubConnection.invoke('PostPartOrders', part.id, JSON.stringify(modelToDtoArray(orders)));
    }

    public async updateExpeditionCitizenOrders(citizen: CitizenExpedition, orders: ExpeditionOrder[]): Promise<void> {
        console.log('send', 'PostCitizenOrders', citizen.id, modelToDtoArray(orders));
        await this.hubConnection.invoke('PostCitizenOrders', citizen.id, JSON.stringify(modelToDtoArray(orders)));
    }

    public async deleteExpeditionOrder(order: ExpeditionOrder): Promise<void> {
        console.log('send', 'DeleteExpeditionOrder', order.id);
        await this.hubConnection.invoke('DeleteExpeditionOrder', order.id);
    }

    public async updateExpeditionOrder(order: ExpeditionOrder): Promise<void> {
        console.log('send', 'SaveExpeditionOrder', order.modelToDto());
        await this.hubConnection.invoke('SaveExpeditionOrder', JSON.stringify(order.modelToDto()));
    }

    public async updateExpeditionBag(citizen: CitizenExpedition): Promise<void> {
        console.log('send', 'SaveExpeditionBag', citizen.id, citizen.bag.modelToDtoShort());
        await this.hubConnection.invoke('SaveExpeditionBag', citizen.id, JSON.stringify(citizen.bag.modelToDtoShort()));
    }

    public async deleteExpeditionBag(bag: CitizenExpeditionBag): Promise<void> {
        console.log('send', 'SaveExpeditionBag', bag.bag_id);
        await this.hubConnection.invoke('SaveExpeditionBag', bag.bag_id);
    }
}
