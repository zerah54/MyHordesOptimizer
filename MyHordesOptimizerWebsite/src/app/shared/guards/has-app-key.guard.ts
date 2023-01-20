import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { TownDetails } from 'src/app/_abstract_model/types/town-details.class';
import { getTown } from '../utilities/localstorage.util';

@Injectable()
export class IsInTownGuard implements CanActivate {

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
        const town: TownDetails | null = getTown();
        let is_in_town: boolean = true;
        if (!town) {
            is_in_town = false
        } else {
            is_in_town = town.town_id !== null && town.town_id !== undefined && town.town_id !== 0
        };
        if (!is_in_town) {
            this.router.navigate(['/wiki/items']);
        }

        return is_in_town;
    }
}