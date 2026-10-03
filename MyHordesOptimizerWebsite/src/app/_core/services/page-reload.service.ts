import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy, Router } from '@angular/router';

/**
 * Réutilisation des routes par défaut d'Angular, sauf pendant un rechargement demandé de la page
 * ({@link PageReloadService}) : la route courante est alors recréée, et ses composants relisent
 * leurs données comme à l'ouverture de la page.
 */
@Injectable({ providedIn: 'root' })
export class ReloadableRouteReuseStrategy extends BaseRouteReuseStrategy {
    private force_reload: boolean = false;

    public override shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        return !this.force_reload && super.shouldReuseRoute(future, curr);
    }

    /** Réservé à {@link PageReloadService} : le temps d'une navigation, aucune route n'est réutilisée. */
    public setForceReload(force_reload: boolean): void {
        this.force_reload = force_reload;
    }
}

/**
 * Recharge la page affichée sans recharger l'application : même URL, composants recréés. Sert après
 * une mise à jour des données de la ville, pour que la page montre ce qui vient d'être enregistré.
 */
@Injectable({ providedIn: 'root' })
export class PageReloadService {
    private readonly router: Router = inject(Router);
    private readonly reuse_strategy: ReloadableRouteReuseStrategy = inject(ReloadableRouteReuseStrategy);

    public reloadCurrentPage(): Promise<boolean> {
        this.reuse_strategy.setForceReload(true);
        return this.router.navigateByUrl(this.router.url, { onSameUrlNavigation: 'reload' })
            .finally((): void => this.reuse_strategy.setForceReload(false));
    }
}
