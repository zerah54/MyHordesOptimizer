import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { Imports } from '../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule, RouterOutlet];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatCardModule];

@Component({
    selector: 'mho-wiki',
    templateUrl: './wiki.component.html',
    styleUrls: ['./wiki.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WikiComponent {

    /** Mêmes entrées, même ordre que `wiki.routes.ts`. Ne sert plus qu'à nommer la page : la
     *  navigation entre sections passe par le menu, qui porte aussi les badges « Spoil ». */
    private readonly links: WikiLink[] = [
        { label: $localize`Objets`, link: 'items' },
        { label: $localize`Recettes`, link: 'recipes' },
        { label: $localize`Pouvoirs`, link: 'hero-skills' },
        { label: $localize`Bâtiments`, link: 'ruins' },
        { label: $localize`Chantiers`, link: 'buildings' },
        { label: $localize`Informations diverses`, link: 'miscellaneous-info' },
        { label: $localize`Villes privées`, link: 'private-towns' }
    ];

    private readonly router: Router = inject(Router);

    /** Titre de page : celui de la section ouverte. Sans lui, les sept pages perdaient leur nom
     *  en même temps que leur en-tête. */
    protected readonly current_label: Signal<string> = toSignal(
        this.router.events.pipe(
            filter((event: Event): boolean => event instanceof NavigationEnd),
            map((): string => this.labelForUrl(this.router.url))
        ),
        { initialValue: this.labelForUrl(this.router.url) }
    );

    private labelForUrl(url: string): string {
        const segments: string[] = url.split('?')[0].split('/');
        const found: WikiLink | undefined = this.links.find((link: WikiLink): boolean => segments.includes(link.link));
        return found?.label ?? $localize`Wiki`;
    }

}

interface WikiLink {
    label: string;
    link: string;
}
