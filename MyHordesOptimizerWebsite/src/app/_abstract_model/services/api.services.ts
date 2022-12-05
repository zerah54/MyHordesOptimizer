import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable, Subscriber } from 'rxjs';
import { getExternalAppId, getTown, getUserId, setTown, setUser } from 'src/app/shared/utilities/localstorage.util';
import { Dictionary } from 'src/app/_abstract_model/types/_types';
import { HeroSkillDTO } from '../dto/hero-skill.dto';
import { ItemDTO } from '../dto/item.dto';
import { MeDTO } from '../dto/me.dto';
import { RecipeDTO } from '../dto/recipe.dto';
import { UpdateInfoDTO } from '../dto/update-info.dto';
import { Citizen } from '../types/citizen.class';
import { HeroSkill } from '../types/hero-skill.class';
import { ItemCount } from '../types/item-count.class';
import { Me } from '../types/me.class';
import { Recipe } from '../types/recipe.class';
import { Ruin } from '../types/ruin.class';
import { TownDetails } from '../types/town-details.class';
import { UpdateInfo } from '../types/update-info.class';
import { dtoToModelArray } from '../types/_common.class';
import { ToolsToUpdate } from '../types/_types';
import { SnackbarService } from './../../shared/services/snackbar.service';
import { BankInfoDTO } from './../dto/bank-info.dto';
import { CitizenInfoDTO } from './../dto/citizen-info.dto';
import { RuinDTO } from './../dto/ruin.dto';
import { WishlistInfoDTO } from './../dto/wishlist-info.dto';
import { BankInfo } from './../types/bank-info.class';
import { CitizenInfo } from './../types/citizen-info.class';
import { Item } from './../types/item.class';
import { WishlistInfo } from './../types/wishlist-info.class';
import { WishlistItem } from './../types/wishlist-item.class';
import { GlobalServices } from './global.services';

const API_URL: string = 'https://api.myhordesoptimizer.fr';
const API_URL_2: string = 'https://myhordesoptimizerapi.azurewebsites.net';

@Injectable()
export class ApiServices extends GlobalServices {

    /** La locale */
    private locale: string = moment.locale();

    constructor(private http: HttpClient, private snackbar: SnackbarService) {
        super(http, snackbar);
    }

    /**
     * Récupère la liste des objets existants
     *
     * @returns {Observable<Item[]>}
     */
    public getItems(): Observable<Item[]> {
        return new Observable((sub: Subscriber<Item[]>) => {
            super.get<ItemDTO[]>(API_URL + '/myhordesfetcher/items?townId=' + getUserId())
                .subscribe({
                    next: (response: HttpResponse<ItemDTO[]>) => {
                        sub.next(dtoToModelArray(Item, response.body).filter((item: Item) => item.id !== 302));
                    }
                });
        });
    }

    /** Récupère l'identifiant de citoyen */
    public getMe(): void {
        super.get<MeDTO>(API_URL + '/myhordesfetcher/me?userKey=' + getExternalAppId())
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
            super.get<BankInfoDTO>(API_URL + '/myhordesfetcher/bank?userKey=' + getExternalAppId())
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
            isGestHordes: 'api'
        };

        super.post<any>(API_URL + '/externaltools/update?userKey=' + getExternalAppId() + '&userId=' + getUserId(), JSON.stringify({ tools: tools_to_update }))
            .subscribe({
                next: () => {
                    this.snackbar.successSnackbar(`Les outils externes ont bien été mis à jour`);
                }
            });
    }

    /**
     * Récupère les informations de liste de course
     *
     * @returns {Observable<WishlistInfo>}
     */
    public getWishlist(): Observable<WishlistInfo> {
        return new Observable((sub: Subscriber<WishlistInfo>) => {
            super.get<WishlistInfoDTO>(API_URL + `/wishlist?townId=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<WishlistInfoDTO>) => {
                        sub.next(new WishlistInfo(response.body));
                    }
                });
        });
    }

    /**
     * Met à jour les données de la wishlist
     *
     * @param {WishlistInfo} wishlist_info
     *
     * @returns {Observable<WishlistInfo>}
     */
    public updateWishlist(wishlist_info: WishlistInfo): Observable<WishlistInfo> {
        return new Observable((sub: Subscriber<WishlistInfo>) => {
            let item_list: { id: number, priority: number, count: number }[] = wishlist_info.wishlist_items
                .filter((wishlist_item: WishlistItem) => wishlist_item.count)
                .map((wishlist_item: WishlistItem) => {
                    return { id: wishlist_item.item.id, priority: wishlist_item.priority, count: wishlist_item.count };
                });
            super.put<WishlistInfoDTO>(API_URL + `/wishlist?townId=${getTown()?.town_id}&userId=${getUserId()}`, item_list)
                .subscribe({
                    next: (response: HttpResponse<WishlistInfoDTO>) => {
                        sub.next(new WishlistInfo(response.body));
                        this.snackbar.successSnackbar(`La liste de courses a bien été enregistrée`);
                    }
                })
        })
    }

    /**
     * Ajoute un élément à la wishlist
     * @param {Item} item l'élément à ajouter à la wishlist
     */
    public addItemToWishlist(item: Item): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.post(API_URL + `/wishlist/add/${item.id}?townId=${getTown()?.town_id}&userId=${getUserId()}`, undefined)
                .subscribe({
                    next: () => {
                        sub.next();
                        this.snackbar.successSnackbar(`L'objet ${item.label[this.locale]} a bien été ajouté à la liste de courses`);
                    }
                })
        })
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
    public getRuins(): Observable<Ruin[]> {
        return new Observable((sub: Subscriber<Ruin[]>) => {
            super.get<RuinDTO[]>(API_URL + '/myhordesfetcher/ruins')
                .subscribe({
                    next: (response: HttpResponse<RuinDTO[]>) => {
                        let ruins: Ruin[] = dtoToModelArray(Ruin, response.body).sort((a: Ruin, b: Ruin) => {
                            if (a.label[this.locale] < b.label[this.locale]) { return -1; }
                            if (a.label[this.locale] > b.label[this.locale]) { return 1; }
                            return 0;
                        });
                        sub.next(ruins);
                    }
                })
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
            super.post<UpdateInfoDTO>(API_URL + `/ExternalTools/Bag?townId=${getTown()?.town_id}&userId=${citizen.id}`, JSON.stringify(citizen.bag.items.map((item: ItemCount) => item.toShortItemCount())))
                .subscribe({
                    next: (response: UpdateInfoDTO) => {
                        sub.next(new UpdateInfo(response));
                    }
                })
        })
    }
}

