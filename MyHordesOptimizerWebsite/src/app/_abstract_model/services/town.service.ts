import { HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import moment from 'moment';
import { map, Observable, Subscriber } from 'rxjs';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { getBankWithExpirationDate, getExternalAppId, getTown, getUserId, setBankWithExpirationDate, } from '../../_core/utilities/localstorage.util';
import { BankInfoDTO } from '../dto/bank-info.dto';
import { CellDTO } from '../dto/cell.dto';
import { CitizenInfoDTO } from '../dto/citizen-info.dto';
import { CitizenDTO } from '../dto/citizen.dto';
import { RuinDTO } from '../dto/ruin.dto';
import { SeasonDTO } from '../dto/season.dto';
import { SeasonPhaseDTO } from '../dto/season-phase.dto';
import { TownListItemDTO } from '../dto/town-list-item.dto';
import { TownListPageResultDTO, TownListQuery } from '../dto/town-list-page.dto';
import { TownDTO } from '../dto/town.dto';
import { UpdateInfoDTO } from '../dto/update-info.dto';
import { TownListMapper } from '../mapper/town-list-item.mapper';
import { dtoToModelArray } from '../types/_common.class';
import { ToolsToUpdate, TownState, TownTypeId } from '../types/_types';
import { BankInfo } from '../types/bank-info.class';
import { Cell } from '../types/cell.class';
import { CitizenInfo } from '../types/citizen-info.class';
import { Citizen } from '../types/citizen.class';
import { Ruin } from '../types/ruin.class';
import { TownListPageResult } from '../types/town-list-item.model';
import { Town } from '../types/town.class';
import { UpdateInfo } from '../types/update-info.class';
import { GlobalService } from './_global.service';

@Injectable({providedIn: 'root'})
export class TownService extends GlobalService {
    private snackbar: SnackbarService = inject(SnackbarService);
    private readonly town_context: TownContextService = inject(TownContextService);

    /** La locale */
    private readonly locale: string = moment.locale();

    /**
     * Récupère les informations de la banque
     *
     * @returns {Observable<BankInfo>}
     */
    public getBank(force?: boolean): Observable<BankInfo> {
        return new Observable((sub: Subscriber<BankInfo>) => {
            // Mode observateur : banque d'une ville tierce, en lecture pure côté serveur (?townId=),
            // sans passer par le cache localStorage (non indexé par ville) pour ne pas le polluer.
            if (this.town_context.isReadonly()) {
                super.get<BankInfoDTO>(this.API_URL + `/Fetcher/bank?townId=${getTown()?.town_id}`)
                    .subscribe({
                        next: (response: HttpResponse<BankInfoDTO>) => {
                            sub.next(new BankInfo(response.body));
                        },
                        error: (error: HttpErrorResponse) => {
                            sub.error(error);
                        }
                    });
                return;
            }
            const saved_bank: BankInfo | undefined = getBankWithExpirationDate();
            if (saved_bank && saved_bank.items.length > 0 && !force) {
                sub.next(saved_bank);
            } else {
                super.get<BankInfoDTO>(this.API_URL + '/Fetcher/bank')
                    .subscribe({
                        next: (response: HttpResponse<BankInfoDTO>) => {
                            const bank: BankInfo = new BankInfo(response.body);
                            setBankWithExpirationDate(bank);
                            sub.next(bank);
                        },
                        error: (error: HttpErrorResponse) => {
                            sub.error(error);
                        }
                    });
            }
        });
    }

    /** Met à jour les outils externes */
    public updateExternalTools(): void {
        const tools_to_update: ToolsToUpdate = {
            isBigBrothHordes: 'api',
            isFataMorgana: 'api',
            isGestHordes: 'api',
            isMyHordesOptimizer: 'api'
        };

        const town_details: {
            townX: number,
            townY: number,
            isChaos: boolean,
            townId: number
        } = {
            townX: getTown()?.town_x || 0,
            townY: getTown()?.town_y || 0,
            isChaos: getTown()?.is_devaste || false,
            townId: getTown()?.town_id || 0
        };

        super.post(this.API_URL + `/externaltools/update?userKey=${getExternalAppId()}&userId=${getUserId()}`,
            JSON.stringify({
                map: {toolsToUpdate: tools_to_update},
                townDetails: town_details
            })
        )
            .subscribe({
                next: () => {
                    this.snackbar.successSnackbar($localize`Les outils externes ont bien été mis à jour`);
                }
            });
    }

    public getTownRuins(): Observable<Ruin[]> {
        return new Observable((sub: Subscriber<Ruin[]>) => {

            super.get<RuinDTO[]>(this.API_URL + `/Fetcher/ruins?townId=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<RuinDTO[]>) => {
                        const ruins: Ruin[] = dtoToModelArray(Ruin, response.body).sort((a: Ruin, b: Ruin) => {
                            if (a.label[this.locale].localeCompare(b.label[this.locale]) < 0) {
                                return -1;
                            }
                            if (a.label[this.locale].localeCompare(b.label[this.locale]) > 0) {
                                return 1;
                            }
                            return 0;
                        });

                        sub.next(ruins);
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Récupère la liste des citoyens
     *
     * @returns {Observable<CitizenInfo>}
     */
    public getCitizens(): Observable<CitizenInfo> {
        return new Observable((sub: Subscriber<CitizenInfo>) => {
            super.get<CitizenInfoDTO>(this.API_URL + `/Fetcher/citizens?townId=${getTown()?.town_id}&userId=${getUserId()}`)
                .subscribe({
                    next: (response: HttpResponse<CitizenInfoDTO>) => {
                        sub.next(new CitizenInfo(response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Récupère les informations d'un unique citoyen
     *
     * @param {number} id
     */
    public getCitizen(id: number): Observable<Citizen> {
        return new Observable((sub: Subscriber<Citizen>) => {
            super.get<CitizenDTO>(this.API_URL + `/town/${getTown()?.town_id}/user/${id}`)
                .subscribe({
                    next: (response: HttpResponse<CitizenDTO>) => {
                        sub.next(new Citizen(response.body || undefined));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public getMap(): Observable<Town> {
        return new Observable((sub: Subscriber<Town>) => {
            super.get<TownDTO>(this.API_URL + `/Fetcher/map?townId=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<TownDTO>) => {
                        sub.next(new Town(response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public updateBag(citizen: Citizen): Observable<UpdateInfo> {
        return new Observable((sub: Subscriber<UpdateInfo>) => {
            super.post<UpdateInfoDTO>(this.API_URL + `/ExternalTools/Bag?townId=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(citizen.toCitizenBagDto()))
                .subscribe({
                    next: (response: UpdateInfoDTO) => {
                        sub.next(new UpdateInfo(response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public updateStatus(citizen: Citizen): Observable<UpdateInfo> {
        return new Observable((sub: Subscriber<UpdateInfo>) => {
            super.post<UpdateInfoDTO>(this.API_URL + `/ExternalTools/Status?townId=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(citizen.toCitizenStatusDto()))
                .subscribe({
                    next: (response: UpdateInfoDTO) => {
                        sub.next(new UpdateInfo(response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public updateHome(citizen: Citizen): Observable<UpdateInfo> {
        return new Observable((sub: Subscriber<UpdateInfo>) => {
            super.post<UpdateInfoDTO>(this.API_URL + `/ExternalTools/home?townId=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(citizen.toCitizenHomeDto()))
                .subscribe({
                    next: (response: UpdateInfoDTO) => {
                        sub.next(new UpdateInfo(response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public updateHeroicActions(citizen: Citizen): Observable<UpdateInfo> {
        return new Observable((sub: Subscriber<UpdateInfo>) => {
            super.post<UpdateInfoDTO>(this.API_URL + `/ExternalTools/HeroicActions?townId=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(citizen.toCitizenHeroicActionsDto()))
                .subscribe({
                    next: (response: UpdateInfoDTO) => {
                        sub.next(new UpdateInfo(response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public saveCell(cell: Cell): Observable<Cell> {
        return new Observable((sub: Subscriber<Cell>) => {
            super.post<CellDTO>(this.API_URL + `/Map/cell?townid=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(cell.toSaveCellDTO()))
                .subscribe({
                    next: (response: CellDTO) => {
                        this.snackbar.successSnackbar($localize`La cellule a bien été modifiée`);
                        sub.next(new Cell(response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public addBath(citizen: Citizen, day?: number): Observable<UpdateInfo> {
        return new Observable((sub: Subscriber<UpdateInfo>) => {
            super.post<UpdateInfoDTO>(this.API_URL + `/town/${getTown()?.town_id}/user/${citizen.id}/bath?day=${day ?? getTown()?.day}`)
                .subscribe({
                    next: (update_info: UpdateInfoDTO) => {
                        sub.next(new UpdateInfo(update_info));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public removeBath(citizen: Citizen): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.delete(this.API_URL + `/town/${getTown()?.town_id}/user/${citizen.id}/bath?day=${getTown()?.day}`)
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

    public saveChamanicDetails(citizen: Citizen): Observable<UpdateInfo> {
        return new Observable((sub: Subscriber<UpdateInfo>) => {
            super.post<UpdateInfoDTO>(this.API_URL + `/town/${getTown()?.town_id}/user/${citizen.id}/chamanicDetail`, JSON.stringify(citizen.chamanic_detail.modelToDto()))
                .subscribe({
                    next: (response: UpdateInfoDTO) => {
                        sub.next(new UpdateInfo(response));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    public getSeasons(): Observable<SeasonDTO[]> {
        return super.get<SeasonDTO[]>(`${this.API_URL}/town/seasons`, false)
            .pipe(map((response: HttpResponse<SeasonDTO[]>) => response.body ?? []));
    }

    public getSeasonPhases(): Observable<SeasonPhaseDTO[]> {
        return super.get<SeasonPhaseDTO[]>(`${this.API_URL}/town/season-phases`, false)
            .pipe(map((response: HttpResponse<SeasonPhaseDTO[]>) => response.body ?? []));
    }

    public getTownsPaged(query: TownListQuery): Observable<TownListPageResult> {
        let params: HttpParams = new HttpParams()
            .set('page', String(query.page))
            .set('pageSize', String(query.pageSize));
        if (query.season != null) {
            params = params.set('season', String(query.season));
        }
        if (query.phase != null) {
            params = params.set('phase', query.phase);
        }
        if (query.playerId != null) {
            params = params.set('playerId', String(query.playerId));
        }
        if (query.sortColumn) {
            params = params.set('sortColumn', query.sortColumn);
        }
        if (query.sortDirection) {
            params = params.set('sortDirection', query.sortDirection);
        }
        if (query.name) {
            params = params.set('name', query.name);
        }
        if (query.id) {
            params = params.set('id', query.id);
        }
        (query.types ?? []).forEach((type: TownTypeId) => params = params.append('types', type));
        (query.languages ?? []).forEach((language: string) => params = params.append('languages', language));
        (query.states ?? []).forEach((state: TownState) => params = params.append('states', state));

        return super.get<TownListPageResultDTO>(`${this.API_URL}/town/list`, false, params)
            .pipe(map((response: HttpResponse<TownListPageResultDTO>) => {
                const body: TownListPageResultDTO | null = response.body;
                return {
                    items: (body?.items ?? []).map((dto: TownListItemDTO) => TownListMapper.dtoToModel(dto)),
                    totalCount: body?.totalCount ?? 0,
                    availableTypes: body?.availableTypes ?? [],
                    availableLanguages: body?.availableLanguages ?? [],
                };
            }));
    }
}

