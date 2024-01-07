import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { getTown } from '../../shared/utilities/localstorage.util';
import { CitizenExpeditionDTO } from '../dto/citizen-expedition.dto';
import { ExpeditionOrderDTO } from '../dto/expedition-order.dto';
import { ExpeditionPartDTO } from '../dto/expedition-part.dto';
import { ExpeditionDTO } from '../dto/expedition.dto';
import { dtoToModelArray } from '../types/_common.class';
import { CitizenExpedition } from '../types/citizen-expedition.class';
import { ExpeditionOrder } from '../types/expedition-order.class';
import { ExpeditionPart } from '../types/expedition-part.class';
import { Expedition } from '../types/expedition.class';
import { GlobalService } from './global.service';

@Injectable({ providedIn: 'root' })
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
     */
    public createExpedition(day: number, expedition: Expedition): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.post(this.API_URL + `/expeditions/${getTown()?.town_id}/${day}`, JSON.stringify(expedition.modelToDto()))
                .subscribe({
                    next: () => {
                        sub.next();
                        this.snackbar.successSnackbar($localize`L'expédition ${expedition.label} a bien été créée`);
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Met à jour les données de l'expédition'
     *
     * @param {number} day
     * @param {Expedition} expedition
     *
     * @returns {Observable<Expedition>}
     */
    public updateExpedition(day: number, expedition: Expedition): Observable<Expedition> {
        return new Observable((sub: Subscriber<Expedition>) => {
            super.put<ExpeditionDTO>(this.API_URL + `/expeditions/${getTown()?.town_id}/${day}/${expedition.id}`, JSON.stringify(expedition.modelToDto()))
                .subscribe({
                    next: (response: HttpResponse<ExpeditionDTO>) => {
                        sub.next(new Expedition(response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Ajoute un élément à l'expédition
     * @param {number} day
     * @param {Expedition} expedition
     * @param {ExpeditionPart} expedition_part
     */
    public createExpeditionPart(day: number, expedition: Expedition, expedition_part: ExpeditionPart): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.post(this.API_URL + `/expeditions/${getTown()?.town_id}/${day}/${expedition.id}`, JSON.stringify(expedition_part.modelToDto()))
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
     * Met à jour les données de l'expédition'
     *
     * @param {number} day
     * @param {Expedition} expedition
     * @param {ExpeditionPart} expedition_part
     *
     * @returns {Observable<ExpeditionPart>}
     */
    public updateExpeditionPart(day: number, expedition: Expedition, expedition_part: ExpeditionPart): Observable<ExpeditionPart> {
        return new Observable((sub: Subscriber<ExpeditionPart>) => {
            super.put<ExpeditionPartDTO>(this.API_URL + `/expeditions/${getTown()?.town_id}/${day}/${expedition.id}?partID=${expedition_part.id}`, JSON.stringify(expedition_part.modelToDto()))
                .subscribe({
                    next: (response: HttpResponse<ExpeditionPartDTO>) => {
                        sub.next(new ExpeditionPart(response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Ajoute un élément à l'expédition
     * @param {number} day
     * @param {Expedition} expedition
     * @param {ExpeditionPart} expedition_part
     * @param {CitizenExpedition} citizen_expedition
     */
    public createCitizenExpedition(day: number, expedition: Expedition, expedition_part: ExpeditionPart, citizen_expedition: CitizenExpedition): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.post(this.API_URL + `/expeditions/${getTown()?.town_id}/${day}/${expedition.id}/${expedition_part.id}/citizen`, JSON.stringify(citizen_expedition.modelToDto()))
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
     * Met à jour les données de l'expédition'
     *
     * @param {number} day
     * @param {Expedition} expedition
     * @param {ExpeditionPart} expedition_part
     * @param {CitizenExpedition} citizen_expedition
     *
     * @returns {Observable<CitizenExpedition>}
     */
    public updateCitizenExpedition(day: number, expedition: Expedition, expedition_part: ExpeditionPart, citizen_expedition: CitizenExpedition): Observable<CitizenExpedition> {
        return new Observable((sub: Subscriber<CitizenExpedition>) => {
            super.put<CitizenExpeditionDTO>(this.API_URL + `/expeditions/${getTown()?.town_id}/${day}/${expedition.id}/${expedition_part.id}/citizen?citizenId=${citizen_expedition.id}`, JSON.stringify(citizen_expedition.modelToDto()))
                .subscribe({
                    next: (response: HttpResponse<CitizenExpeditionDTO>) => {
                        sub.next(new CitizenExpedition(response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Ajoute un élément à l'expédition
     * @param {number} day
     * @param {Expedition} expedition
     * @param {ExpeditionPart} expedition_part
     * @param {ExpeditionOrder} order
     */
    public createOrder(day: number, expedition: Expedition, expedition_part: ExpeditionPart, order: ExpeditionOrder): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.post(this.API_URL + `/expeditions/${getTown()?.town_id}/${day}/${expedition.id}/${expedition_part.id}/order`, JSON.stringify(order.modelToDto()))
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
     * Met à jour les données de l'expédition'
     *
     * @param {number} day
     * @param {Expedition} expedition
     * @param {ExpeditionPart} expedition_part
     * @param {ExpeditionOrder} order
     *
     * @returns {Observable<ExpeditionOrder>}
     */
    public updateOrder(day: number, expedition: Expedition, expedition_part: ExpeditionPart, order: ExpeditionOrder): Observable<ExpeditionOrder> {
        return new Observable((sub: Subscriber<ExpeditionOrder>) => {
            super.put<ExpeditionOrderDTO>(this.API_URL + `/expeditions/${getTown()?.town_id}/${day}/${expedition.id}/${expedition_part.id}/order?orderId=${order.id}`, JSON.stringify(order.modelToDto()))
                .subscribe({
                    next: (response: HttpResponse<ExpeditionOrderDTO>) => {
                        sub.next(new ExpeditionOrder(response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }
}

