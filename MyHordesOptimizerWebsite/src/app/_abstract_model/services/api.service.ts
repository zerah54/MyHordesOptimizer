import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable, Subscriber } from 'rxjs';
import { SnackbarService } from '../../shared/services/snackbar.service';
import {
    getExternalAppId,
    getItemsWithExpirationDate,
    getRuinsWithExpirationDate,
    getTown,
    getUserId,
    setItemsWithExpirationDate,
    setRuinsWithExpirationDate,
} from '../../shared/utilities/localstorage.util';
import { BankInfoDTO } from '../dto/bank-info.dto';
import { CellDTO } from '../dto/cell.dto';
import { CitizenInfoDTO } from '../dto/citizen-info.dto';
import { EstimationsDTO } from '../dto/estimations.dto';
import { HeroSkillDTO } from '../dto/hero-skill.dto';
import { ItemDTO } from '../dto/item.dto';
import { RecipeDTO } from '../dto/recipe.dto';
import { RegenDTO } from '../dto/regen.dto';
import { RuinDTO } from '../dto/ruin.dto';
import { TownDTO } from '../dto/town.dto';
import { UpdateInfoDTO } from '../dto/update-info.dto';
import { MinMax } from '../interfaces';
import { dtoToModelArray } from '../types/_common.class';
import { ToolsToUpdate } from '../types/_types';
import { BankInfo } from '../types/bank-info.class';
import { Cell } from '../types/cell.class';
import { CitizenInfo } from '../types/citizen-info.class';
import { Citizen } from '../types/citizen.class';
import { Estimations } from '../types/estimations.class';
import { HeroSkill } from '../types/hero-skill.class';
import { Item } from '../types/item.class';
import { Recipe } from '../types/recipe.class';
import { Regen } from '../types/regen.class';
import { Ruin } from '../types/ruin.class';
import { Town } from '../types/town.class';
import { UpdateInfo } from '../types/update-info.class';
import { GlobalService } from './global.service';

@Injectable({ providedIn: 'root' })
export class ApiService extends GlobalService {

    /** La locale */
    private readonly locale: string = moment.locale();

    constructor(_http: HttpClient, private snackbar: SnackbarService) {
        super(_http);
    }

    /**
     * Récupère la liste des objets existants
     *
     * @returns {Observable<Item[]>}
     */
    public getItems(force?: boolean): Observable<Item[]> {
        return new Observable((sub: Subscriber<Item[]>) => {
            const saved_items: Item[] = getItemsWithExpirationDate();
            if (saved_items && saved_items.length > 0 && !force) {
                sub.next(saved_items);
            } else {
                super.get<ItemDTO[]>(this.API_URL + `/Fetcher/items?${getTown()?.town_id ? 'townId=' + getTown()?.town_id : ''}`)
                    .subscribe({
                        next: (response: HttpResponse<ItemDTO[]>) => {
                            const items: Item[] = dtoToModelArray(Item, response.body).filter((item: Item) => item.id !== 302);
                            setItemsWithExpirationDate(items);
                            sub.next(items);
                        },
                        error: (error: HttpErrorResponse) => {
                            sub.error(error);
                        }
                    });
            }
        });
    }

    /**
     * Récupère les informations de la banque
     *
     * @returns {Observable<BankInfo>}
     */
    public getBank(): Observable<BankInfo> {
        return new Observable((sub: Subscriber<BankInfo>) => {
            super.get<BankInfoDTO>(this.API_URL + `/Fetcher/bank?userKey=${getExternalAppId()}`)
                .subscribe({
                    next: (response: HttpResponse<BankInfoDTO>) => {
                        sub.next(new BankInfo(response.body));
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
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
            isDevaste: boolean,
            townId: number
        } = {
            townX: getTown()?.town_x || 0,
            townY: getTown()?.town_y || 0,
            isDevaste: getTown()?.is_devaste || false,
            townId: getTown()?.town_id || 0
        };

        super.post(this.API_URL + `/externaltools/update?userKey=${getExternalAppId()}&userId=${getUserId()}`,
            JSON.stringify({
                map: { toolsToUpdate: tools_to_update },
                townDetails: town_details
            })
        )
            .subscribe({
                next: () => {
                    this.snackbar.successSnackbar($localize`Les outils externes ont bien été mis à jour`);
                }
            });
    }

    public getApofooAttackCalculation(day: number, beta: boolean): Observable<MinMax | null> {
        return new Observable((sub: Subscriber<MinMax | null>) => {
            super.get<MinMax>(this.API_URL + `/attaqueEstimation/apofooAttackCalculation${beta ? '/beta' : ''}?day=${day}&townId=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<MinMax>) => {
                        sub.next(response.body);
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Récupère la liste des bâtiments
     *
     * @returns {Observable<Ruin[]>}
     */
    public getRuins(force?: boolean): Observable<Ruin[]> {
        return new Observable((sub: Subscriber<Ruin[]>) => {
            const saved_ruins: Ruin[] = getRuinsWithExpirationDate();
            if (saved_ruins && saved_ruins.length > 0 && !force) {
                sub.next(saved_ruins);
            } else {
                super.get<RuinDTO[]>(this.API_URL + '/Fetcher/ruins')
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
                            setRuinsWithExpirationDate(ruins);

                            sub.next(ruins);
                        },
                        error: (error: HttpErrorResponse) => {
                            sub.error(error);
                        }
                    });
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
     * Récupère la liste des pouvoirs héro
     *
     * @returns {Observable<HeroSkill[]>}
     */
    public getHeroSkill(): Observable<HeroSkill[]> {
        return new Observable((sub: Subscriber<HeroSkill[]>) => {
            super.get<HeroSkillDTO[]>(this.API_URL + '/Fetcher/heroSkills')
                .subscribe({
                    next: (response: HttpResponse<HeroSkillDTO[]>) => {
                        const skills: HeroSkill[] = dtoToModelArray(HeroSkill, response.body).sort((a: HeroSkill, b: HeroSkill) => {
                            if (a.days_needed < b.days_needed) {
                                return -1;
                            }
                            if (a.days_needed > b.days_needed) {
                                return 1;
                            }
                            return 0;
                        });
                        sub.next(skills);
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
     * Récupère la liste des citoyens
     *
     * @returns {Observable<Recipe[]>}
     */
    public getRecipes(): Observable<Recipe[]> {
        return new Observable((sub: Subscriber<Recipe[]>) => {
            super.get<RecipeDTO[]>(this.API_URL + '/Fetcher/recipes')
                .subscribe({
                    next: (response: HttpResponse<RecipeDTO[]>) => {
                        sub.next(dtoToModelArray(Recipe, response.body));
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
}

