import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { getTown } from '../../shared/utilities/localstorage.util';
import { BagDTO } from '../dto/bag.dto';
import { CitizenExpeditionDTO } from '../dto/citizen-expedition.dto';
import { ExpeditionOrderDTO } from '../dto/expedition-order.dto';
import { ExpeditionPartDTO } from '../dto/expedition-part.dto';
import { ExpeditionDTO } from '../dto/expedition.dto';
import { dtoToModelArray, modelToDtoArray } from '../types/_common.class';
import { Bag } from '../types/bag.class';
import { CitizenExpedition } from '../types/citizen-expedition.class';
import { ExpeditionOrder } from '../types/expedition-order.class';
import { ExpeditionPart } from '../types/expedition-part.class';
import { Expedition } from '../types/expedition.class';
import { GlobalService } from './global.service';

@Injectable({providedIn: 'root'})
export class ExpeditionService extends GlobalService {

    constructor(_http: HttpClient, private snackbar: SnackbarService) {
        super(_http);
    }

    /**
     * Récupère les expéditions du jour
     *
     * @param {number} day
     *
     * @returns {Observable<Expedition[]>}
     */
    public getExpeditions(day: number): Observable<Expedition[]> {
        return new Observable((sub: Subscriber<Expedition[]>) => {
            super.get<ExpeditionDTO[]>(this.API_URL + `/expeditions/${getTown()?.town_id}/${day}`)
                .subscribe({
                    next: (response: HttpResponse<ExpeditionDTO[]>) => {
                        sub.next(dtoToModelArray(Expedition, response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Ajoute une expédition
     *
     * @param {number} day
     * @param {Expedition} expedition
     * @param {Citizen[]} citizen_list
     */
    public createOrUpdateExpedition(day: number, expedition: Expedition): Observable<Expedition> {
        return new Observable((sub: Subscriber<Expedition>) => {
            super.post<ExpeditionDTO>(this.API_URL + `/expeditions/${getTown()?.town_id}/${day}`, JSON.stringify(expedition.modelToDtoShort()))
                .subscribe({
                    next: (response: ExpeditionDTO) => {
                        sub.next(new Expedition(response));
                        if (!expedition.id) {
                            this.snackbar.successSnackbar($localize`L'expédition a bien été créée`);
                        }
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public importExpeditions(from_day: number, to_day: number): Observable<Expedition[]> {
        return new Observable((sub: Subscriber<Expedition[]>) => {
            super.post<ExpeditionDTO[]>(this.API_URL + '/expeditions/copy', JSON.stringify({from: from_day, to: to_day, town_id: getTown()?.town_id}))
                .subscribe({
                    next: (response: ExpeditionDTO[]) => {
                        sub.next(dtoToModelArray(Expedition, response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Supprime l'expédition
     *
     * @param {Expedition} expedition
     */
    public deleteExpedition(expedition: Expedition): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.delete(this.API_URL + `/expeditions/${expedition.id}`)
                .subscribe({
                    next: () => {
                        sub.next();
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Ajoute un élément à l'expédition
     *
     * @param {Expedition} expedition
     * @param {ExpeditionPart} expedition_part
     */
    public createOrUpdateExpeditionPart(expedition: Expedition, expedition_part: ExpeditionPart): Observable<ExpeditionPart> {
        return new Observable((sub: Subscriber<ExpeditionPart>) => {
            super.post<ExpeditionPartDTO>(this.API_URL + `/expeditions/${expedition.id}/parts`, JSON.stringify(expedition_part.modelToDtoShort()))
                .subscribe({
                    next: (response: ExpeditionPartDTO) => {
                        sub.next(new ExpeditionPart(response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Supprime une partie de l'expédition
     *
     * @param {ExpeditionPart} expedition_part
     *
     * @returns {Observable<ExpeditionPart>}
     */
    public deleteExpeditionPart(expedition_part: ExpeditionPart): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.delete(this.API_URL + `/expeditions/parts/${expedition_part.id}`)
                .subscribe({
                    next: () => {
                        sub.next();
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Ajoute un citoyen à l'expédition
     *
     * @param {ExpeditionPart} expedition_part
     * @param {CitizenExpedition} citizen_expedition
     */
    public createOrUpdateCitizenExpedition(expedition_part: ExpeditionPart, citizen_expedition: CitizenExpedition): Observable<CitizenExpedition> {
        return new Observable((sub: Subscriber<CitizenExpedition>) => {
            super.post<CitizenExpeditionDTO>(this.API_URL + `/expeditions/parts/${expedition_part.id}/citizen`, JSON.stringify(citizen_expedition.modelToDtoShort()))
                .subscribe({
                    next: (response: CitizenExpeditionDTO) => {
                        sub.next(new CitizenExpedition(response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Supprime un citoyen d'une expédition
     *
     * @param {CitizenExpedition} citizen_expedition
     *
     * @returns {Observable<CitizenExpedition>}
     */
    public deleteCitizenExpedition(citizen_expedition: CitizenExpedition): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.delete(this.API_URL + `/expeditions/parts/citizen/${citizen_expedition.id}`)
                .subscribe({
                    next: () => {
                        sub.next();
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Ajoute une consigne à l'expédition
     *
     * @param {ExpeditionOrderExpeditionOrder[]} orders
     * @param {ExpeditionPart} expedition_part
     */
    public createOrUpdateOrdersForPart(orders: ExpeditionOrder[], expedition_part: ExpeditionPart): Observable<ExpeditionOrder[]> {
        return new Observable((sub: Subscriber<ExpeditionOrder[]>) => {
            super.post<ExpeditionOrderDTO[]>(this.API_URL + `/expeditions/parts/${expedition_part.id}/orders`, JSON.stringify(modelToDtoArray(orders)))
                .subscribe({
                    next: (response: ExpeditionOrderDTO[]) => {
                        response.sort((order_a: ExpeditionOrderDTO, order_b: ExpeditionOrderDTO) => {
                            if (order_a.position < order_b.position) return -1;
                            if (order_a.position > order_b.position) return 1;
                            return 0;
                        });
                        sub.next(dtoToModelArray(ExpeditionOrder, response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Ajoute une consigne au citoyen
     *
     * @param {ExpeditionOrder[]} orders
     * @param {CitizenExpedition} citizen
     */
    public createOrUpdateOrdersForCitizen(orders: ExpeditionOrder[], citizen: CitizenExpedition): Observable<ExpeditionOrder[]> {
        return new Observable((sub: Subscriber<ExpeditionOrder[]>) => {
            super.post<ExpeditionOrderDTO[]>(this.API_URL + `/expeditions/citizen/${citizen.id}/orders`, JSON.stringify(modelToDtoArray(orders)))
                .subscribe({
                    next: (response: ExpeditionOrderDTO[]) => {
                        response.sort((order_a: ExpeditionOrderDTO, order_b: ExpeditionOrderDTO) => {
                            if (order_a.position < order_b.position) return -1;
                            if (order_a.position > order_b.position) return 1;
                            return 0;
                        });
                        sub.next(dtoToModelArray(ExpeditionOrder, response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Modifie une consigne
     *
     * @param {ExpeditionOrder} order
     */
    public updateOrder(order: ExpeditionOrder): Observable<ExpeditionOrder> {
        return new Observable((sub: Subscriber<ExpeditionOrder>) => {
            super.post<ExpeditionOrderDTO>(this.API_URL + '/expeditions/orders', JSON.stringify(order.modelToDto()))
                .subscribe({
                    next: (response: ExpeditionOrderDTO) => {
                        sub.next(new ExpeditionOrder(response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Ajoute un sac à un citoyen
     *
     * @param {Bag} bag
     */
    public createOrUpdateBag(bag: Bag): Observable<Bag> {
        return new Observable((sub: Subscriber<Bag>) => {
            super.post<BagDTO>(this.API_URL + '/expeditions/bag', JSON.stringify(bag.modelToDtoShort()))
                .subscribe({
                    next: (response: BagDTO) => {
                        sub.next(new Bag(response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }
}

