import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, DOCUMENT, inject, LOCALE_ID, model, ModelSignal, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavContainer } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import moment from 'moment';

import { environment } from '../../../environments/environment';
import { Theme } from '../../_abstract_model/interfaces';
import { AdminService } from '../../_abstract_model/services/admin.service';
import { Imports } from '../../_abstract_model/types/_types';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { ChartsThemingService } from '../../_core/services/charts-theming.service';
import { TownContextService } from '../../_core/services/town-context.service';
import { getTown, getUser } from '../../_core/utilities/localstorage.util';

const angular_common: Imports = [CommonModule, NgTemplateOutlet, RouterLink, RouterLinkActive];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatDividerModule, MatIconModule, MatListModule, MatMenuModule, MatTooltipModule];

@Component({
    selector: 'mho-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class MenuComponent implements OnInit {
    public sidenavContainer: ModelSignal<MatSidenavContainer> = model.required();
    protected readonly adminService: AdminService = inject(AdminService);
    protected themes: Theme[] = [
        { label: $localize`Par défaut`, class: '' },
        { label: $localize`Rose`, class: 'pink' },
        { label: $localize`Brun`, class: 'brown' },
    ];
    protected selected_theme: Theme | undefined = this.themes.find((theme: Theme) => theme.class === localStorage.getItem('theme'));
    /** La liste des langues disponibles */
    protected language_list: Language[] = [
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français', default: true },
        { code: 'es', label: 'Español' },
        { code: 'de', label: 'Deutsch' }
    ];
    /** La langue sélectionnée pour l'affichage de l'application */
    protected site_language: Language | undefined;
    protected routes: SidenavLinks[] = [
        {
            label: $localize`Ma ville`, lvl: 0, displayed: true, isTownRoot: true, authorized: (): boolean => this.isInTown(), expanded: true, children: [
                { label: $localize`Revenir à ma ville`, returnHome: true, displayed: true, lvl: 1, authorized: (): boolean => this.isReadonly(), spoil: false },
                { label: $localize`Carte des fouilles`, townSuffix: 'map', displayed: true, lvl: 1, authorized: (): boolean => this.isInTown(), spoil: false },
                { label: $localize`Banque`, townSuffix: 'bank', displayed: true, lvl: 1, authorized: (): boolean => this.isInTown(), spoil: false },
                { label: $localize`Citoyens`, townSuffix: 'citizens', displayed: true, lvl: 1, authorized: (): boolean => this.isInTown(), spoil: false },
                {
                    label: $localize`Liste de courses`,
                    townSuffix: 'wishlist',
                    displayed: true,
                    lvl: 1,
                    authorized: (): boolean => this.isInTown(),
                    spoil: false
                },
                { label: $localize`Statistiques`, townSuffix: 'stats', displayed: true, lvl: 1, authorized: (): boolean => this.isInTown(), spoil: false },
                { label: $localize`Expéditions`, townSuffix: 'expeditions', displayed: true, lvl: 1, authorized: (): boolean => this.isInTown(), spoil: false },
                {
                    label: $localize`Chantiers`,
                    townSuffix: 'buildings',
                    displayed: true,
                    lvl: 1,
                    authorized: (): boolean => this.isInTown() && !environment.production,
                    spoil: false
                },
                {
                    label: $localize`Veilles`,
                    townSuffix: 'nightwatch',
                    displayed: true,
                    lvl: 1,
                    authorized: (): boolean => this.isInTown() && !environment.production,
                    spoil: false
                },
                {
                    label: $localize`Campings`,
                    townSuffix: 'campings',
                    displayed: true,
                    lvl: 1,
                    authorized: (): boolean => this.isInTown() && !environment.production,
                    spoil: false
                },
            ], spoil: false
        },
        {
            label: $localize`Outils`, lvl: 0, displayed: true, authorized: (): boolean => true, expanded: true, children: [
                { label: $localize`Camping`, path: 'tools/camping', displayed: true, lvl: 1, authorized: (): boolean => true, spoil: false },
                { label: $localize`Chances de survie`, path: 'tools/probabilities', displayed: true, lvl: 1, authorized: (): boolean => true, spoil: false },
                { label: $localize`Simulateur de débordement`, path: 'tools/overflow', displayed: true, lvl: 1, authorized: (): boolean => true, spoil: false },
            ], spoil: false
        },
        {
            label: $localize`Annuaire`, lvl: 0, displayed: true, authorized: (): boolean => true, expanded: false, children: [
                { label: $localize`Citoyens`, path: 'directory/citizens', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: false },
                { label: $localize`Villes`, path: 'directory/towns', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: false },
            ], spoil: false
        },
        {
            label: $localize`Wiki`, lvl: 0, displayed: true, authorized: (): boolean => true, expanded: false, children: [
                { label: $localize`Objets`, path: 'wiki/items', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: true },
                { label: $localize`Recettes`, path: 'wiki/recipes', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: true },
                { label: $localize`Pouvoirs`, path: 'wiki/hero-skills', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: false },
                { label: $localize`Bâtiments`, path: 'wiki/ruins', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: true },
                {
                    label: $localize`Informations diverses`,
                    path: 'wiki/miscellaneous-info',
                    displayed: false,
                    lvl: 1,
                    authorized: (): boolean => true,
                    spoil: false
                },
                {
                    label: $localize`Villes privées`,
                    path: 'wiki/private-towns',
                    displayed: false,
                    lvl: 1,
                    authorized: (): boolean => true,
                    spoil: false
                }
            ], spoil: false
        },
        {
            label: $localize`Tutoriels`, lvl: 0, displayed: true, authorized: (): boolean => true, expanded: false, children: [
                {
                    label: $localize`Script / Extension`, displayed: false, lvl: 1, authorized: (): boolean => true, expanded: false, children: [
                        {
                            label: $localize`Installation`,
                            path: 'tutorials/script-extension/installation',
                            displayed: false,
                            lvl: 2,
                            authorized: (): boolean => true,
                            spoil: false
                        },
                        {
                            label: $localize`Outils`,
                            path: 'tutorials/script-extension/tools',
                            displayed: false,
                            lvl: 2,
                            authorized: (): boolean => true,
                            spoil: false
                        },
                        {
                            label: $localize`Wiki`,
                            path: 'tutorials/script-extension/wiki',
                            displayed: false,
                            lvl: 2,
                            authorized: (): boolean => true,
                            spoil: false
                        },
                        {
                            label: $localize`Outils Externes`,
                            path: 'tutorials/script-extension/external-tools',
                            displayed: false,
                            lvl: 2,
                            authorized: (): boolean => true,
                            spoil: false
                        },
                        {
                            label: $localize`Affichage`,
                            path: 'tutorials/script-extension/display',
                            displayed: false,
                            lvl: 2,
                            authorized: (): boolean => true,
                            spoil: false
                        },
                        {
                            label: $localize`Notifications`,
                            path: 'tutorials/script-extension/alerts',
                            displayed: false,
                            lvl: 2,
                            authorized: (): boolean => true,
                            spoil: false
                        },
                    ], spoil: false
                },
                {
                    label: $localize`Site`, displayed: false, lvl: 1, authorized: (): boolean => true, expanded: false, children: [
                        {
                            label: $localize`Première utilisation`,
                            path: 'tutorials/site/first-use',
                            displayed: false,
                            lvl: 2,
                            authorized: (): boolean => true,
                            spoil: false
                        },
                    ], spoil: false
                },
                {
                    label: $localize`Bot Discord`, displayed: false, lvl: 1, authorized: (): boolean => true, expanded: false, children: [
                        {
                            label: $localize`Installation`,
                            path: 'tutorials/discord-bot/installation',
                            displayed: false,
                            lvl: 2,
                            authorized: (): boolean => true,
                            spoil: false
                        },
                    ], spoil: false
                },
            ], spoil: false
        },
        {
            label: $localize`Mini-Jeux`, lvl: 0, displayed: true, authorized: (): boolean => true, expanded: false, children: [
                { label: $localize`368 Pictos`, path: 'games/368-pictos', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: false },
                { label: $localize`Démineur`, path: 'games/minesweeper', displayed: false, lvl: 1, authorized: (): boolean => true, spoil: false },
            ], spoil: false
        },
    ];
    private readonly locale_id: string = inject(LOCALE_ID);
    private readonly document: Document = inject<Document>(DOCUMENT);
    private readonly town_context: TownContextService = inject(TownContextService);
    private charts_theming_service: ChartsThemingService = inject(ChartsThemingService);

    public ngOnInit(): void {
        /** Si il y a une langue enregistrée, on l'utilise, sinon on utilise le français */
        const used_locale: string = this.locale_id;
        /** Si dans la liste des langues supportées on trouve la langue ci-dessus, on l'utilise, sinon on utilise le français */
        this.site_language = this.language_list.some((language: Language) => used_locale === language.code)
            ? this.language_list.find((language: Language) => used_locale === language.code)
            : this.language_list.find((language: Language) => language.default);

        this.defineThemes();
        this.adminService.checkIsAdmin().subscribe();

        setTimeout(() => {
            this.resizeSidenav();
        });
    }

    protected toggleDisplayChildren(route: SidenavLinks): void {
        if (route.children && route.children.length > 0) {
            route.children?.forEach((child: SidenavLinks) => {
                child.displayed = route.expanded || false;
                if (!child.displayed) {
                    child.expanded = child.displayed;
                }
                this.toggleDisplayChildren(child);
            });
            this.resizeSidenav();
        }
    }

    protected changeTheme(new_theme: Theme): void {
        this.selected_theme = new_theme;
        localStorage.setItem('theme', new_theme.class);
        setTimeout(() => {
            this.document.location.reload();
        });
    }

    /**
     * Change la langue sélectionnée
     *
     * @param {Language} new_language
     */
    protected changeLanguage(new_language: Language): void {
        this.site_language = new_language;
        localStorage.setItem('mho-locale', new_language.code);
        setTimeout(() => {
            this.document.location.reload();
        });
    }

    /** Résout le lien d'une entrée en tenant compte du contexte d'observation. */
    protected resolvePath(route: SidenavLinks): string | undefined {
        if (route.returnHome) return this.returnPath();
        if (route.townSuffix) return `${this.townBasePath()}/${route.townSuffix}`;
        return route.path;
    }

    /** Résout le libellé : la section ville prend le nom de la ville observée en mode observateur. */
    protected resolveLabel(route: SidenavLinks): string {
        if (route.isTownRoot && this.isReadonly()) {
            return this.town_context.observedTownName() ?? $localize`Ville observée`;
        }
        return route.label;
    }

    private isInTown(): boolean {
        if (!environment.production) return true;
        const town: TownDetails | null = getTown();
        if (!town) return false;
        return town.town_id !== null && town.town_id !== undefined && town.town_id !== 0;
    }

    /** Vrai quand on observe une ville tierce : la section « Ma ville » cible alors cette ville. */
    private isReadonly(): boolean {
        return this.town_context.isReadonly();
    }

    /** Base des liens de la section ville : la ville observée en mode observateur, sinon la sienne. */
    private townBasePath(): string {
        const observed: TownDetails | null = this.town_context.observedTown();
        return observed ? `town/${observed.town_id}` : 'my-town';
    }

    /** Destination du bouton retour : sa propre ville si elle existe, sinon la liste des villes. */
    private returnPath(): string {
        return getUser()?.town_details?.town_id ? 'my-town' : 'directory/towns';
    }

    private resizeSidenav(): void {
        const sidenavContainer: MatSidenavContainer = this.sidenavContainer();
        sidenavContainer.autosize = true;
        this.sidenavContainer.set(sidenavContainer);
        setTimeout((): void => {
            this.sidenavContainer.set(sidenavContainer);
        });
    }

    private defineThemes(): void {
        /** Noël */
        if (this.isNoel() || !environment.production) {
            this.themes.push({ label: $localize`Noël`, class: 'noel' });
            if (environment.production) {
                this.themes.splice(0, 1);
                this.useEventTheme();
            }
        } else if (this.isNothing() && (this.selected_theme?.class === 'noel' || !this.selected_theme)) {
            setTimeout(() => {
                this.changeTheme(this.themes[0]);
            });
        }

        /** Halloween */
        if (this.isHalloween() || !environment.production) {
            this.themes.push({ label: $localize`Halloween`, class: 'halloween' });
            if (environment.production) {
                this.themes.splice(0, 1);
                this.useEventTheme();
            }
        } else if (this.isNothing() && (this.selected_theme?.class === 'halloween' || !this.selected_theme)) {
            setTimeout(() => {
                this.changeTheme(this.themes[0]);
            });
        }


        this.selected_theme = this.themes.find((theme: Theme) => theme.class === localStorage.getItem('theme'))
            || this.themes.find((theme: Theme) => theme.class === '');


        this.charts_theming_service.defineColorsWithTheme();
    }

    private isNoel(): boolean {
        return moment().isSameOrAfter(moment(`01-12-${moment().year()} 00:00:00`, 'DD-MM-YYYY HH:mm:ss'))
            && moment().isSameOrBefore(moment(`25-12-${moment().year()} 23:59:59`, 'DD-MM-YYYY HH:mm:ss'));
    }

    private isHalloween(): boolean {
        return moment().isSameOrAfter(moment(`15-10-${moment().year()} 00:00:00`, 'DD-MM-YYYY HH:mm:ss'))
            && moment().isSameOrBefore(moment(`01-11-${moment().year()} 23:59:59`, 'DD-MM-YYYY HH:mm:ss'));
    }

    private isNothing(): boolean {
        return !this.isNoel() && !this.isHalloween();
    }

    private useEventTheme(): void {
        this.selected_theme = this.themes.find((theme: Theme) => theme.class === localStorage.getItem('theme'));
        if (this.selected_theme?.class === '' || !this.selected_theme) {
            setTimeout(() => {
                this.changeTheme(this.themes[this.themes.length - 1]);
            });
        }
    }
}

interface SidenavLinks {
    label: string;
    path?: string;
    /** Suffixe relatif à la ville (map, bank, …) : le chemin complet est calculé selon le contexte. */
    townSuffix?: string;
    /** Section racine « Ma ville » : son libellé devient le nom de la ville observée en observation. */
    isTownRoot?: boolean;
    /** Entrée « Revenir à ma ville », affichée seulement en mode observateur. */
    returnHome?: boolean;
    children?: SidenavLinks[];
    lvl?: number;
    displayed: boolean;
    authorized: () => boolean;
    expanded?: boolean;
    spoil: boolean;
}

interface Language {
    code: string;
    label: string;
    default?: boolean;
}
