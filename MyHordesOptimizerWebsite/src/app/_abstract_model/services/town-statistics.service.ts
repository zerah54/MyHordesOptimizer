import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';

import { getTown, getUserId, } from '../../_core/utilities/localstorage.util';
import { EstimationsDTO } from '../dto/estimations.dto';
import { EstimationsResultDTO } from '../dto/estimations-result.dto';
import { AttackSettingsDTO, RefinementInputDTO, RefinementViewDTO } from '../dto/refinement.dto';
import { RegenDTO } from '../dto/regen.dto';
import { dtoToModelArray } from '../types/_common.class';
import { Estimations } from '../types/estimations.class';
import { EstimationsResult } from '../types/estimations-result.class';
import { Regen } from '../types/regen.class';
import { GlobalService } from './_global.service';

@Injectable({ providedIn: 'root' })
export class TownStatisticsService extends GlobalService {

    /**
     * Calcule la fenêtre d'attaque du jour `day` (âmes lues en base par l'API).
     * @param day Jour attaqué.
     * @param beta Endpoint bêta.
     */
    public getAttackCalculation(day: number, beta: boolean): Observable<EstimationsResult> {
        return new Observable((sub: Subscriber<EstimationsResult>) => {
            super.get<EstimationsResultDTO>(this.API_URL + `/attaqueEstimation/AttackCalculation${beta ? '/beta' : ''}?day=${day}&townId=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<EstimationsResultDTO>) => {
                        sub.next(new EstimationsResult(response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public getScrutList(): Observable<Regen[]> {
        return new Observable((sub: Subscriber<Regen[]>) => {
            super.get<RegenDTO[]>(this.API_URL + `/Fetcher/MapUpdates?townid=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<RegenDTO[]>) => {
                        sub.next(dtoToModelArray(Regen, response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public getEstimations(day: number): Observable<Estimations> {
        return new Observable((sub: Subscriber<Estimations>) => {
            super.get<EstimationsDTO>(this.API_URL + `/AttaqueEstimation/Estimations/${day}?townid=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<EstimationsDTO>) => {
                        sub.next(new Estimations(response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public saveEstimations(estimations: Estimations): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.post<EstimationsDTO>(this.API_URL + `/AttaqueEstimation/Estimations?townid=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(estimations.modelToDto()))
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
     * Réglages de l'attaque du jour `day`.
     * @param day Jour attaqué.
     */
    public getAttackSettings(day: number): Observable<AttackSettingsDTO> {
        return new Observable((sub: Subscriber<AttackSettingsDTO>) => {
            super.get<AttackSettingsDTO>(this.API_URL + `/AttaqueEstimation/AttackSettings/${day}?townId=${getTown()?.town_id}`)
                .subscribe({ next: (response: HttpResponse<AttackSettingsDTO>): void => this.emit(sub, response.body!), error: (error: HttpErrorResponse): void => sub.error(error) });
        });
    }

    /**
     * Enregistre les réglages de l'attaque du jour `day`.
     * @param day Jour attaqué.
     * @param settings Âmes, niveau SPA (null = défaut) et feux d'artifice.
     */
    public saveAttackSettings(day: number, settings: AttackSettingsDTO): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.put<void>(this.API_URL + `/AttaqueEstimation/AttackSettings/${day}?townId=${getTown()?.town_id}`, settings)
                .subscribe({ next: (): void => this.emit(sub, undefined), error: (error: HttpErrorResponse): void => sub.error(error) });
        });
    }

    /**
     * Affinage partagé de l'attaque du jour `day`.
     * @param day Jour attaqué.
     */
    public getRefinement(day: number): Observable<RefinementViewDTO> {
        return new Observable((sub: Subscriber<RefinementViewDTO>) => {
            super.get<RefinementViewDTO>(this.API_URL + `/AttaqueEstimation/Refinement/${day}?townId=${getTown()?.town_id}`, true)
                .subscribe({ next: (response: HttpResponse<RefinementViewDTO>): void => this.emit(sub, response.body!), error: (error: HttpErrorResponse): void => sub.error(error) });
        });
    }

    /**
     * Entrées du scan de l'attaque du jour `day` (400 si aucune estimation n'est saisie).
     * @param day Jour attaqué.
     */
    public getRefinementInput(day: number): Observable<RefinementInputDTO> {
        return new Observable((sub: Subscriber<RefinementInputDTO>) => {
            super.get<RefinementInputDTO>(this.API_URL + `/AttaqueEstimation/Refinement/${day}/input?townId=${getTown()?.town_id}`, false, undefined, true)
                .subscribe({ next: (response: HttpResponse<RefinementInputDTO>): void => this.emit(sub, response.body!), error: (error: HttpErrorResponse): void => sub.error(error) });
        });
    }

    /**
     * Envoie les seeds candidats d'un scan (409 si les saisies ont changé pendant le scan).
     * @param day Jour attaqué.
     * @param input Entrées reçues de `getRefinementInput`, renvoyées telles quelles.
     * @param seeds Seeds candidats (uint32).
     */
    public postRefinement(day: number, input: RefinementInputDTO, seeds: number[]): Observable<RefinementViewDTO> {
        const body: string = JSON.stringify({ input, candidates: TownStatisticsService.seedsToBase64(seeds) });
        return super.post<RefinementViewDTO>(this.API_URL + `/AttaqueEstimation/Refinement/${day}?townId=${getTown()?.town_id}`, body, true);
    }

    /**
     * Émet puis termine : `forkJoin` (enregistrements groupés du composant) attend la complétion.
     * @param sub Abonné.
     * @param value Valeur émise.
     */
    private emit<T>(sub: Subscriber<T>, value: T): void {
        sub.next(value);
        sub.complete();
    }

    /**
     * Encode des seeds uint32 en base64 petit-boutiste, par tranches (pas de saturation de la pile d'appels).
     * @param seeds Seeds à encoder.
     */
    private static seedsToBase64(seeds: number[]): string {
        const view: DataView = new DataView(new ArrayBuffer(seeds.length * 4));
        seeds.forEach((seed: number, index: number): void => view.setUint32(index * 4, seed, true));
        const bytes: Uint8Array = new Uint8Array(view.buffer);
        const chunk_size: number = 0x8000;
        let binary: string = '';
        for (let offset: number = 0; offset < bytes.length; offset += chunk_size) {
            binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk_size));
        }
        return btoa(binary);
    }

}

