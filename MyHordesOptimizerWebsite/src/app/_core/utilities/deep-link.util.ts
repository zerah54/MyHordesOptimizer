import { Event, NavigationEnd, Router } from '@angular/router';
import { filter, map, Observable, startWith } from 'rxjs';

/**
 * Paramètres de requête des liens profonds : une page ouverte avec `?item=42` montre l'objet 42
 * (fiche ouverte, ligne surlignée…). La recherche globale de l'en-tête les emploie, et n'importe
 * quel lien partagé peut en faire autant.
 */
export const DEEP_LINK_PARAMS: Readonly<{ item: string; building: string; ruin: string; citizen: string }> = {
    item: 'item',
    building: 'building',
    ruin: 'ruin',
    citizen: 'citizen'
};

/** Identifiant porté par un paramètre de lien profond, ou `null` s'il est absent ou invalide. */
export function parseDeepLinkId(value: string | null | undefined): number | null {
    if (value === null || value === undefined || value.trim() === '') {
        return null;
    }
    const id: number = Number(value);
    return Number.isInteger(id) ? id : null;
}

/**
 * Cibles successives d'un lien profond, pour une page déjà affichée comme pour une page qui s'ouvre.
 *
 * Relu à CHAQUE fin de navigation, et pas seulement quand le paramètre change : rechercher deux
 * fois de suite le même objet ramène à la même URL, que le routeur retraite (`onSameUrlNavigation:
 * 'reload'`) sans que la valeur du paramètre bouge. La page doit pourtant resurligner l'élément,
 * que l'utilisateur a pu quitter entre-temps.
 *
 * Lu sur l'état du routeur et non sur une `ActivatedRoute` : les paramètres de requête sont
 * communs à toute l'URL, et les pages restent instanciables sans route (tests).
 */
export function deepLinkTargets(router: Router, param: string): Observable<number> {
    return router.events.pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd),
        // La page est créée pendant la navigation qui l'ouvre : sa fin a pu être émise avant
        // l'abonnement. Une cible lue deux fois est sans effet, une cible manquée ne l'est pas.
        startWith(null),
        map((): number | null => parseDeepLinkId(router.routerState.snapshot.root.queryParamMap.get(param))),
        filter((id: number | null): id is number => id !== null)
    );
}
