import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, Subscriber } from 'rxjs';

import { CitizenDayStateRequestDTO, CitizenStateTraceDTO } from '../dto/citizen-state-trace.dto';
import { RankedOrderDTO } from '../dto/ranked-order.dto';
import { CitizenState } from '../types/citizen-state.class';
import { CitizenStateStep } from '../types/citizen-state-step.class';
import { CitizenStateTrace } from '../types/citizen-state-trace.class';
import { RankedOrder } from '../types/ranked-order.class';
import { GlobalService } from './_global.service';

@Injectable({ providedIn: 'root' })
export class CitizenDayStateService extends GlobalService {

    public simulate(starting_state: CitizenState, steps: CitizenStateStep[]): Observable<CitizenStateTrace> {
        const body: CitizenDayStateRequestDTO = {
            startingState: starting_state.modelToDto(),
            steps: steps.map((step: CitizenStateStep) => step.modelToDto()),
        };

        return new Observable((sub: Subscriber<CitizenStateTrace>) => {
            super.post<CitizenStateTraceDTO>(this.API_URL + '/CitizenState/CitizenDay', JSON.stringify(body))
                .subscribe({
                    next: (response: CitizenStateTraceDTO) => {
                        sub.next(new CitizenStateTrace(response));
                        sub.complete();
                    },
                    error: (error: HttpErrorResponse) => sub.error(error),
                });
        });
    }

    /** Uids des objets dont la consommation affecte les PA/PE ou les statuts d'un citoyen. */
    public getItemsWithStateImpact(): Observable<string[]> {
        return super.get<string[]>(`${this.API_URL}/CitizenState/ItemsWithStateImpact`)
            .pipe(map((response: HttpResponse<string[]>) => response.body ?? []));
    }

    /** Tous les ordres de consommation distincts du sac (dédupliqués), du plus optimisé au pire. */
    public rankOrders(starting_state: CitizenState, bag_item_ids: number[]): Observable<RankedOrder[]> {
        return super.post<RankedOrderDTO[]>(this.API_URL + '/CitizenState/RankOrders', JSON.stringify({
            startingState: starting_state.modelToDto(),
            bagItemIds: bag_item_ids,
        })).pipe(map((response: RankedOrderDTO[]) => response.map((dto: RankedOrderDTO) => new RankedOrder(dto))));
    }
}
