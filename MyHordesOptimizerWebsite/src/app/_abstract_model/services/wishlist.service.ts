import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import moment from 'moment';
import { Observable, of, Subscriber } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { SnackbarService } from '../../_core/services/snackbar.service';
import { getTown, getUserId } from '../../_core/utilities/localstorage.util';
import { ShortWishlistItemDTO } from '../dto/short-wishlist-item.dto';
import { WishlistInfoDTO } from '../dto/wishlist-info.dto';
import { WishlistDepot } from '../enum/wishlist-depot.enum';
import { Item } from '../types/item.class';
import { WishlistInfo } from '../types/wishlist-info.class';
import { WishlistItem } from '../types/wishlist-item.class';
import { GlobalService } from './_global.service';

@Injectable({ providedIn: 'root' })
export class WishlistService extends GlobalService {
    private snackbar: SnackbarService = inject(SnackbarService);

    /** La locale */
    private readonly locale: string = moment.locale();

    /**
     * Récupère les informations de liste de course
     *
     * @returns {Observable<WishlistInfo>}
     */
    public getWishlist(): Observable<WishlistInfo> {
        return new Observable((sub: Subscriber<WishlistInfo>) => {
            super.get<WishlistInfoDTO>(this.API_URL + `/wishlist?townId=${getTown()?.town_id}`)
                .subscribe({
                    next: (response: HttpResponse<WishlistInfoDTO>) => {
                        const wishlist: WishlistInfo = new WishlistInfo(response.body);
                        sub.next(wishlist);
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
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
            super.put<WishlistInfoDTO>(this.API_URL + `/wishlist?townId=${getTown()?.town_id}&userId=${getUserId()}`, wishlist_info.toListItem())
                .subscribe({
                    next: (response: HttpResponse<WishlistInfoDTO>) => {
                        sub.next(new WishlistInfo(response.body));
                        this.snackbar.successSnackbar($localize`La liste de courses a bien été enregistrée`);
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

    /**
     * Inscrit à la liste de courses les objets qui n'y figurent pas encore, en zone ∞ et en
     * quantité ∞. Un objet déjà inscrit, quelle que soit sa zone, n'est pas touché : rien n'est
     * remplacé.
     *
     * L'ajout unitaire de l'API ne prend qu'un objet par appel et ne vérifie pas qu'il est absent
     * (la clé ville, objet, zone fait échouer un doublon). La liste est donc relue juste avant
     * d'être réécrite en entier, en un seul appel. Dépôt et priorité sont ceux que l'ajout
     * unitaire donne à un nouvel objet.
     *
     * @param {readonly number[]} item_ids les objets à inscrire
     *
     * @returns {Observable<WishlistInfo>} la liste enregistrée, ou relue si rien n'y manquait
     */
    public addMissingItems(item_ids: readonly number[]): Observable<WishlistInfo> {
        return this.getWishlist().pipe(
            switchMap((current: WishlistInfo): Observable<WishlistInfo> => {
                const current_items: WishlistItem[] = current.wishlist_items ?? [];
                const present: Set<number> = new Set(current_items.map((wishlist_item: WishlistItem): number => wishlist_item.item.id));
                const missing: number[] = [...new Set(item_ids)].filter((item_id: number): boolean => !present.has(item_id));
                if (missing.length === 0) {
                    return of(current);
                }
                const body: ShortWishlistItemDTO[] = [
                    ...current_items.map((wishlist_item: WishlistItem): ShortWishlistItemDTO => wishlist_item.toShortDto()),
                    ...missing.map((item_id: number): ShortWishlistItemDTO => ({
                        id: item_id,
                        priority: 0,
                        count: -1,
                        depot: WishlistDepot.BANK.value.count,
                        zoneXPa: 0,
                        shouldSignal: false
                    }))
                ];
                return super.put<WishlistInfoDTO>(this.API_URL + `/wishlist?townId=${getTown()?.town_id}&userId=${getUserId()}`, body)
                    .pipe(
                        map((response: HttpResponse<WishlistInfoDTO>): WishlistInfo => new WishlistInfo(response.body)),
                        tap((): void => {
                            this.snackbar.successSnackbar(missing.length === 1
                                ? $localize`Un objet a été ajouté à la liste de courses`
                                : $localize`${missing.length}:count: objets ont été ajoutés à la liste de courses`);
                        })
                    );
            })
        );
    }

    /**
     * Ajoute un élément à la wishlist
     * @param {Item} item l'élément à ajouter à la wishlist
     */
    public addItemToWishlist(item: Item, zone: number): Observable<void> {
        return new Observable((sub: Subscriber<void>) => {
            super.post(this.API_URL + `/wishlist/add/${item.id}?townId=${getTown()?.town_id}&userId=${getUserId()}&zoneXPa=${zone}`, undefined)
                .subscribe({
                    next: () => {
                        sub.next();
                        this.snackbar.successSnackbar($localize`L'objet ${item.label[this.locale]} a bien été ajouté à la liste de courses`);
                    },
                    error: (error: HttpErrorResponse) => {
                        sub.error(error);
                    }
                });
        });
    }

}

