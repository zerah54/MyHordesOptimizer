import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';



/**
 * Ce guard permet le routing de l'extension de navigateur, afin d'appeler les bons composants aux bons endroits
 * En effet, une extension de navigateur n'a pas de page ni de route à proprement parler, donc on la simule.
 */
@Injectable()
export class RoutingGuard implements CanActivate {

    constructor(private router: Router) { }

    /**
     * Si aucune page n'est passée en paramètre, alors on redirige vers la toolbox
     * Sinon on redirige vers la page passée en paramètre
     *
     * @param {ActivatedRouteSnapshot} route
     * @returns {Observable<boolean> | boolean}
     */
    canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | boolean {

        const page: string = route.queryParams['page'];

        if (!page) {
            this.router.navigate(['/toolbox']);
        } else {
            this.router.navigate([page])
        }
        return false;
    }

}
