import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable, Subscriber } from 'rxjs';
import { getTown, getUserId } from 'src/app/shared/utilities/localstorage.util';
import { environment } from 'src/environments/environment';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { WishlistInfoDTO } from '../dto/wishlist-info.dto';
import { Item } from '../types/item.class';
import { WishlistInfo } from '../types/wishlist-info.class';
import { GlobalServices } from './global.services';

const API_URL: string = environment.api_url;

@Injectable()
export class WishlistServices extends GlobalServices {

    /** La locale */
    private readonly locale: string = moment.locale();

    constructor(private http: HttpClient, private snackbar: SnackbarService) {
        super(http, snackbar);
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
            super.put<WishlistInfoDTO>(API_URL + `/wishlist?townId=${getTown()?.town_id}&userId=${getUserId()}`, wishlist_info.toListItem())
                .subscribe({
                    next: (response: HttpResponse<WishlistInfoDTO>) => {
                        sub.next(new WishlistInfo(response.body));
                        this.snackbar.successSnackbar($localize`La liste de courses a bien été enregistrée`);
                    }
                })
        })
    }

    /**
     * Ajoute un élément à la wishlist
     * @param {Item} item l'élément à ajouter à la wishlist
     */
    public addItemToWishlist(item: Item, zone: string): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.post(API_URL + `/wishlist/add/${item.id}?townId=${getTown()?.town_id}&userId=${getUserId()}&zoneXPa=${zone}`, undefined)
                .subscribe({
                    next: () => {
                        sub.next();
                        this.snackbar.successSnackbar($localize`L'objet ${item.label[this.locale]} a bien été ajouté à la liste de courses`);
                    }
                })
        })
    }

}
