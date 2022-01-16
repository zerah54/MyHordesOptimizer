import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable, Subscriber } from 'rxjs';
import { getExternalAppId, getUserId, setUserId } from 'src/app/shared/utilities/localstorage.util';
import { ItemDTO } from '../dto/item.dto';
import { ToolsToUpdate } from '../types/_types';
import { SnackbarService } from './../../shared/services/snackbar.service';
import { BankInfoDTO, BankInfoDtoTransform } from './../dto/bank-info.dto';
import { ItemDtoTransform } from './../dto/item.dto';
import { WishlistInfoDTO, WishlistInfoDtoTransform } from './../dto/wishlist-info.dto';
import { BankInfo } from './../types/bank-info.class';
import { Item } from './../types/item.class';
import { WishlistInfo } from './../types/wishlist-info.class';
import { WishlistItem } from './../types/wishlist-item.class';
import { GlobalServices } from './global.services';

const API_URL: string = 'https://myhordesoptimizerapi.azurewebsites.net/';

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
            super.get<ItemDTO[]>(API_URL + 'myhordesfetcher/item?userKey=' + getExternalAppId())
                .subscribe({
                    next: (response: HttpResponse<ItemDTO[]>) => {
                        sub.next(ItemDtoTransform.transformDtoArray(response.body));
                    }
                });
        });
    }

    /** Récupère l'identifiant de citoyen */
    public getMe(): void {
        super.get<{ id: number }>(API_URL + 'myhordesfetcher/me?userKey=' + getExternalAppId())
            .subscribe((response: HttpResponse<{ id: number } | null>) => {
                setUserId(response.body ? response.body.id : null);
            })
    }

    /**
     * Récupère les informations de la banque
     *
     * @returns {Observable<BankInfo>}
     */
    public getBank(): Observable<BankInfo> {
        return new Observable((sub: Subscriber<BankInfo>) => {
            super.get<BankInfoDTO>(API_URL + 'myhordesfetcher/bank?userKey=' + getExternalAppId())
                .subscribe({
                    next: (response: HttpResponse<BankInfoDTO>) => {
                        sub.next(BankInfoDtoTransform.dtoToClass(response.body));
                    }
                });
        });
    }

    /** Met à jour les outils externes */
    public updateExternalTools(): void {
        let tools_to_update: ToolsToUpdate = {
            isBigBrothHordes: true,
            isFataMorgana: true,
            isGestHordes: true
        };

        super.post<any>(API_URL + 'externaltools/update?userKey=' + getExternalAppId() + '&userId=' + getUserId(), JSON.stringify(tools_to_update))
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
            super.get<WishlistInfoDTO>(API_URL + 'wishlist?userKey=' + getExternalAppId())
                .subscribe({
                    next: (response: HttpResponse<WishlistInfoDTO>) => {
                        sub.next(WishlistInfoDtoTransform.dtoToClass(response.body));
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
                    return { id: wishlist_item.item.xml_id, priority: wishlist_item.priority, count: wishlist_item.count };
                });
            super.put<WishlistInfoDTO>(API_URL + 'wishlist?userKey=' + getExternalAppId(), item_list)
                .subscribe({
                    next: (response: HttpResponse<WishlistInfoDTO>) => {
                        sub.next(WishlistInfoDtoTransform.dtoToClass(response.body));
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
            super.post(API_URL + 'wishlist/add/' + item.xml_id + '?userKey=' + getExternalAppId(), undefined)
                .subscribe({
                    next: () => {
                        sub.next();
                        this.snackbar.successSnackbar(`L'objet ${item.label[this.locale]} a bien été ajouté à la liste de courses`);
                    }
                })
        })
    }
}

