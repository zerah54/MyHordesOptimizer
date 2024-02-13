import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { getTown } from '../utilities/localstorage.util';

@Injectable({ providedIn: 'root' })
export class IsInTownGuard {

    /**
     * Le constructeur de la classe
     *
     * @param {Router} router
     */
    constructor(private router: Router) {
    }

    /**
     * Si l'utilisateur essaie d'accéder à une page qui nécessite d'être en ville, alors il sera redirigé
     *
     * @return {boolean}
     */
    public canActivate(): boolean {
        if (!environment.production) return true;

        const town: TownDetails | null = getTown();
        let is_in_town: boolean;
        if (!town) {
            is_in_town = false;
        } else {
            is_in_town = town.town_id !== null && town.town_id !== undefined && town.town_id !== 0;
        }
        if (!is_in_town) {
            this.router.navigate(['/wiki/items']);
        }

        return is_in_town;
    }
}
