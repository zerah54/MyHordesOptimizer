import { Location } from '@angular/common';
import { Directive, inject, input, InputSignal } from '@angular/core';
import { Router } from '@angular/router';

/** Commandes de navigation du routeur (même format que `Router.navigate`). */
export type RouteCommands = readonly (string | number)[];

/** Valeur de `MouseEvent.button` pour le bouton central (molette). */
const MIDDLE_BUTTON: number = 1;

/**
 * Ouvre une route de l'application dans un nouvel onglet au clic molette sur l'hôte, comme le
 * ferait un lien. Destiné aux éléments cliquables qui ne sont pas des `<a>` (lignes de tableau…),
 * dont le clic simple reste géré par le composant.
 *
 * `null` désactive le comportement (élément non ouvrable). Les descendants qui ne doivent pas
 * ouvrir la route arrêtent la propagation de `auxclick`, comme ils le font pour `click`.
 */
@Directive({
    selector: '[mhoMiddleClickLink]',
    host: {
        '(mousedown)': 'onMouseDown($event)',
        '(auxclick)': 'onAuxClick($event)'
    }
})
export class MiddleClickLinkDirective {

    public readonly mhoMiddleClickLink: InputSignal<RouteCommands | null> = input.required<RouteCommands | null>();

    private readonly router: Router = inject(Router);
    private readonly location: Location = inject(Location);

    /** Bloque le défilement automatique (Windows) et le collage (Linux) déclenchés par l'appui molette. */
    protected onMouseDown(event: MouseEvent): void {
        if (event.button === MIDDLE_BUTTON && this.mhoMiddleClickLink() !== null) {
            event.preventDefault();
        }
    }

    protected onAuxClick(event: MouseEvent): void {
        const commands: RouteCommands | null = this.mhoMiddleClickLink();
        if (event.button !== MIDDLE_BUTTON || commands === null) {
            return;
        }
        event.preventDefault();
        // `prepareExternalUrl` ajoute le base href (préfixe de langue des builds localisés).
        const url: string = this.location.prepareExternalUrl(this.router.serializeUrl(this.router.createUrlTree(commands)));
        window.open(url, '_blank', 'noopener');
    }
}
