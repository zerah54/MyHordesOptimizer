import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable, Subscriber } from 'rxjs';
import { getExternalAppId, getItemsWithExpirationDate, getRuinsWithExpirationDate, getTown, getUserId, setItemsWithExpirationDate, setRuinsWithExpirationDate, setTown, setUser } from 'src/app/shared/utilities/localstorage.util';
import { Dictionary } from 'src/app/_abstract_model/types/_types';
import { environment } from 'src/environments/environment';
import { CellDTO } from '../dto/cell.dto';
import { HeroSkillDTO } from '../dto/hero-skill.dto';
import { ItemDTO } from '../dto/item.dto';
import { MeDTO } from '../dto/me.dto';
import { RecipeDTO } from '../dto/recipe.dto';
import { RegenDTO } from '../dto/regen.dto';
import { TownDTO } from '../dto/town.dto';
import { UpdateInfoDTO } from '../dto/update-info.dto';
import { Cell } from '../types/cell.class';
import { Citizen } from '../types/citizen.class';
import { HeroSkill } from '../types/hero-skill.class';
import { Me } from '../types/me.class';
import { Recipe } from '../types/recipe.class';
import { Regen } from '../types/regen.class';
import { Ruin } from '../types/ruin.class';
import { TownDetails } from '../types/town-details.class';
import { Town } from '../types/town.class';
import { UpdateInfo } from '../types/update-info.class';
import { dtoToModelArray } from '../types/_common.class';
import { ToolsToUpdate } from '../types/_types';
import { SnackbarService } from './../../shared/services/snackbar.service';
import { BankInfoDTO } from './../dto/bank-info.dto';
import { CitizenInfoDTO } from './../dto/citizen-info.dto';
import { RuinDTO } from './../dto/ruin.dto';
import { BankInfo } from './../types/bank-info.class';
import { CitizenInfo } from './../types/citizen-info.class';
import { Item } from './../types/item.class';
import { GlobalServices } from './global.services';

const API_URL: string = environment.api_url;

@Injectable()
export class ApiServices extends GlobalServices {

    /** La locale */
    private readonly locale: string = moment.locale();

    constructor(private http: HttpClient, private snackbar: SnackbarService) {
        super(http, snackbar);
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
                super.get<ItemDTO[]>(API_URL + '/myhordesfetcher/items?townId=' + getTown()?.town_id)
                    .subscribe({
                        next: (response: HttpResponse<ItemDTO[]>) => {
                            const items: Item[] = dtoToModelArray(Item, response.body).filter((item: Item) => item.id !== 302);
                            setItemsWithExpirationDate(items)
                            sub.next(items);
                        }
                    });
            }
        });
    }

    /** Récupère l'identifiant de citoyen */
    public getMe(): void {
        super.get<MeDTO>(API_URL + `/myhordesfetcher/me?userKey=${getExternalAppId()}`)
            .subscribe((response: HttpResponse<MeDTO | null>) => {
                setUser(response.body ? new Me(response.body) : null);
                setTown(response.body ? new TownDetails(response.body.townDetails) : null);
            })
    }

    /**
     * Récupère les informations de la banque
     *
     * @returns {Observable<BankInfo>}
     */
    public getBank(): Observable<BankInfo> {
        return new Observable((sub: Subscriber<BankInfo>) => {
            super.get<BankInfoDTO>(API_URL + `/myhordesfetcher/bank?userKey=${getExternalAppId()}`)
                .subscribe({
                    next: (response: HttpResponse<BankInfoDTO>) => {
                        sub.next(new BankInfo(response.body));
                    }
                });
        });
    }

    /** Met à jour les outils externes */
    public updateExternalTools(): void {
        let tools_to_update: ToolsToUpdate = {
            isBigBrothHordes: 'api',
            isFataMorgana: 'api',
            isGestHordes: 'api',
            isMyHordesOptimizer: 'api'
        };

        let town_details: {
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

        super.post<any>(API_URL + `/externaltools/update?userKey=${getExternalAppId()}&userId=${getUserId()}`, JSON.stringify({ map: {toolsToUpdate: tools_to_update}, townDetails: town_details }))
            .subscribe({
                next: () => {
                    this.snackbar.successSnackbar($localize`Les outils externes ont bien été mis à jour`);
                }
            });
    }

    /**
     * Demande l'estimation à partir des données du tableau
     * @param {Dictionary<string>} rows Les données pour l'estimation
     */
    public estimateAttack(rows: Dictionary<string>, today: boolean, day: number): Observable<string> {
        return new Observable((sub: Subscriber<string>) => {
            super.post<string>(API_URL + `:8080/${today ? 'attack' : 'planif'}.php?day=${day}&id=${getTown()?.town_id}&type=normal&debug=false`, JSON.stringify(rows))
                .subscribe({
                    next: (response) => {
                        sub.next(response);
                    }
                })
        })
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
                super.get<RuinDTO[]>(API_URL + '/myhordesfetcher/ruins')
                    .subscribe({
                        next: (response: HttpResponse<RuinDTO[]>) => {
                            let ruins: Ruin[] = dtoToModelArray(Ruin, response.body).sort((a: Ruin, b: Ruin) => {
                                if (a.label[this.locale].localeCompare(b.label[this.locale]) < 0) { return -1; }
                                if (a.label[this.locale].localeCompare(b.label[this.locale]) > 0) { return 1; }
                                return 0;
                            });
                            setRuinsWithExpirationDate(ruins)

                            sub.next(ruins);
                        }
                    })
            }
        })
    }

    /**
     * Récupère la liste des pouvoirs héro
     *
     * @returns {Observable<HeroSkill[]>}
     */
    public getHeroSkill(): Observable<HeroSkill[]> {
        return new Observable((sub: Subscriber<HeroSkill[]>) => {
            super.get<HeroSkillDTO[]>(API_URL + '/myhordesfetcher/heroSkills')
                .subscribe({
                    next: (response: HttpResponse<HeroSkillDTO[]>) => {
                        let skills: HeroSkill[] = dtoToModelArray(HeroSkill, response.body).sort((a: HeroSkill, b: HeroSkill) => {
                            if (a.days_needed < b.days_needed) { return -1; }
                            if (a.days_needed > b.days_needed) { return 1; }
                            return 0;
                        });
                        sub.next(skills);
                    }
                })
        })
    }

    /**
     * Récupère la liste des citoyens
     *
     * @returns {Observable<CitizenInfo>}
     */
    public getCitizens(): Observable<CitizenInfo> {
        return new Observable((sub: Subscriber<CitizenInfo>) => {
            super.get<CitizenInfoDTO>(API_URL + `/myhordesfetcher/citizens?townId=${getTown()?.town_id}&userId=${getUserId()}`)
                .subscribe({
                    next: (response: HttpResponse<CitizenInfoDTO>) => {
                        sub.next(new CitizenInfo(response.body));
                    }
                })
        })
    }

    /**
     * Récupère la liste des citoyens
     *
     * @returns {Observable<Recipe[]>}
     */
    public getRecipes(): Observable<Recipe[]> {
        return new Observable((sub: Subscriber<Recipe[]>) => {
            super.get<RecipeDTO[]>(API_URL + '/myhordesfetcher/recipes')
                .subscribe({
                    next: (response: HttpResponse<RecipeDTO[]>) => {
                        sub.next(dtoToModelArray(Recipe, response.body));
                    }
                })
        })
    }

    public updateBag(citizen: Citizen): Observable<UpdateInfo> {
        return new Observable((sub: Subscriber<UpdateInfo>) => {
            super.post<UpdateInfoDTO>(API_URL + `/ExternalTools/Bag?townId=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(citizen.toCitizenBagDto()))
                .subscribe({
                    next: (response: UpdateInfoDTO) => {
                        sub.next(new UpdateInfo(response));
                    }
                })
        })
    }

    public updateStatus(citizen: Citizen): Observable<UpdateInfo> {
        return new Observable((sub: Subscriber<UpdateInfo>) => {
            super.post<UpdateInfoDTO>(API_URL + `/ExternalTools/Status?townId=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(citizen.toCitizenStatusDto()))
                .subscribe({
                    next: (response: UpdateInfoDTO) => {
                        sub.next(new UpdateInfo(response));
                    }
                })
        })
    }

    public updateHome(citizen: Citizen): Observable<UpdateInfo> {
        return new Observable((sub: Subscriber<UpdateInfo>) => {
            super.post<UpdateInfoDTO>(API_URL + `/ExternalTools/home?townId=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(citizen.toCitizenHomeDto()))
                .subscribe({
                    next: (response: UpdateInfoDTO) => {
                        sub.next(new UpdateInfo(response));
                    }
                })
        })
    }

    public updateHeroicActions(citizen: Citizen): Observable<UpdateInfo> {
        return new Observable((sub: Subscriber<UpdateInfo>) => {
            super.post<UpdateInfoDTO>(API_URL + `/ExternalTools/HeroicActions?townId=${getTown()?.town_id}&userId=${getUserId()}`, JSON.stringify(citizen.toCitizenHeroicActionsDto()))
                .subscribe({
                    next: (response: UpdateInfoDTO) => {
                        sub.next(new UpdateInfo(response));
                    }
                })
        })
    }

    public getMap(): Observable<Town> {
        return new Observable((sub: Subscriber<Town>) => {
            super.get<TownDTO>(API_URL + `/myhordesfetcher/map?townId=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<TownDTO>) => {
                        sub.next(new Town(response.body));
                    }
                })
        })
    }

    public getScrutList(): Observable<Regen[]> {
        return new Observable((sub: Subscriber<Regen[]>) => {
            super.get<RegenDTO[]>(API_URL + `/myhordesfetcher/MapUpdates?townid=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<RegenDTO[]>) => {
                        sub.next(dtoToModelArray(Regen, response.body));
                    }
                })
        })
    }

    public saveCell(cell: Cell): Observable<Cell> {
        console.log('cell', cell.saveCellDTO());
        return new Observable((sub: Subscriber<Cell>) => {
            super.post<CellDTO>(API_URL + `/myhordesfetcher/cell?townid=${getTown()?.town_id}`, JSON.stringify(cell.modelToDto()))
                .subscribe({
                    next: (response: CellDTO) => {
                        sub.next(new Cell(response));
                    }
                })
        })
    }
}

