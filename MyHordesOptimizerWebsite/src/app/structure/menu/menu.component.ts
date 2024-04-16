import { CommonModule, DOCUMENT, NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, HostBinding, inject, Inject, Input, LOCALE_ID, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavContainer } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import * as moment from 'moment';
import { environment } from '../../../environments/environment';
import { Theme } from '../../_abstract_model/interfaces';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { ChartsThemingService } from '../../shared/services/charts-theming.service';
import { getTown } from '../../shared/utilities/localstorage.util';

@Component({
    selector: 'mho-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [MatListModule, CommonModule, NgTemplateOutlet, MatDividerModule, MatButtonModule, MatMenuModule, MatIconModule, RouterLinkActive, RouterLink, NgClass, MatTooltipModule]
})
export class MenuComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @Input({required: true}) sidenavContainer!: MatSidenavContainer;

    public charts_theming_service: ChartsThemingService = inject(ChartsThemingService);

    public themes: Theme[] = [
        {label: $localize`Par défaut`, class: ''},
        {label: $localize`Rose`, class: 'pink'},
        {label: $localize`Brun`, class: 'brown'},
    ];

    public selected_theme: Theme | undefined = this.themes.find((theme: Theme) => theme.class === localStorage.getItem('theme'));

    /** La liste des langues disponibles */
    public language_list: Language[] = [
        {code: 'en', label: 'English'},
        {code: 'fr', label: 'Français', default: true},
        {code: 'es', label: 'Spanish'},
        {code: 'de', label: 'Deutsch'}
    ];

    /** La langue sélectionnée pour l'affichage de l'application */
    public site_language: Language | undefined;


    public routes: SidenavLinks[] = [
        {
            label: $localize`Ma ville`, lvl: 0, displayed: true, authorized: (): boolean => this.isInTown(), expanded: true, children: [
                {label: $localize`Carte des fouilles`, path: 'my-town/map', displayed: true, lvl: 1, authorized: (): boolean => this.isInTown()},
                {label: $localize`Banque`, path: 'my-town/bank', displayed: true, lvl: 1, authorized: (): boolean => this.isInTown()},
                {label: $localize`Citoyens`, path: 'my-town/citizens', displayed: true, lvl: 1, authorized: (): boolean => this.isInTown()},
                {label: $localize`Liste de courses`, path: 'my-town/wishlist', displayed: true, lvl: 1, authorized: (): boolean => this.isInTown()},
                {label: $localize`Statistiques`, path: 'my-town/stats', displayed: true, lvl: 1, authorized: (): boolean => this.isInTown()},
                {label: $localize`Expéditions`, path: 'my-town/expeditions', displayed: true, lvl: 1, authorized: (): boolean => this.isInTown()},
                {
                    label: $localize`Chantiers`,
                    path: 'my-town/buildings',
                    displayed: true,
                    lvl: 1,
                    authorized: (): boolean => this.isInTown() && !environment.production
                },
                {
                    label: $localize`Veilles`,
                    path: 'my-town/nightwatch',
                    displayed: true,
                    lvl: 1,
                    authorized: (): boolean => this.isInTown() && !environment.production
                },
                {
                    label: $localize`Campings`,
                    path: 'my-town/campings',
                    displayed: true,
                    lvl: 1,
                    authorized: (): boolean => this.isInTown() && !environment.production
                },
            ]
        },
        {
            label: $localize`Outils`, lvl: 0, displayed: true, authorized: (): boolean => true, expanded: true, children: [
                {label: $localize`Camping`, path: 'tools/camping', displayed: true, lvl: 1, authorized: (): boolean => true, spoil: true},
                {label: $localize`Chances de survie`, path: 'tools/probabilities', displayed: true, lvl: 1, authorized: (): boolean => true},
            ]
        },
        {
            label: $localize`Wiki`, lvl: 0, displayed: true, authorized: (): boolean => true, expanded: true, children: [
                {label: $localize`Objets`, path: 'wiki/items', displayed: true, lvl: 1, authorized: (): boolean => true, spoil: true},
                {label: $localize`Recettes`, path: 'wiki/recipes', displayed: true, lvl: 1, authorized: (): boolean => true},
                {label: $localize`Pouvoirs`, path: 'wiki/hero-skills', displayed: true, lvl: 1, authorized: (): boolean => true},
                {label: $localize`Bâtiments`, path: 'wiki/ruins', displayed: true, lvl: 1, authorized: (): boolean => true, spoil: true},
                {
                    label: $localize`Informations diverses`,
                    path: 'wiki/miscellaneous-info',
                    displayed: true,
                    lvl: 1,
                    authorized: (): boolean => true,
                    spoil: true
                }
            ]
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
                            authorized: (): boolean => true
                        },
                        {label: $localize`Outils`, path: 'tutorials/script-extension/tools', displayed: false, lvl: 2, authorized: (): boolean => true},
                        {label: $localize`Wiki`, path: 'tutorials/script-extension/wiki', displayed: false, lvl: 2, authorized: (): boolean => true},
                        {
                            label: $localize`Outils Externes`,
                            path: 'tutorials/script-extension/external-tools',
                            displayed: false,
                            lvl: 2,
                            authorized: (): boolean => true
                        },
                        {label: $localize`Affichage`, path: 'tutorials/script-extension/display', displayed: false, lvl: 2, authorized: (): boolean => true},
                        {label: $localize`Notifications`, path: 'tutorials/script-extension/alerts', displayed: false, lvl: 2, authorized: (): boolean => true},
                    ]
                },
                {
                    label: $localize`Site`, displayed: false, lvl: 1, authorized: (): boolean => true, expanded: false, children: [
                        {label: $localize`Première utilisation`, path: 'tutorials/site/first-use', displayed: false, lvl: 2, authorized: (): boolean => true},
                    ]
                },
                {
                    label: $localize`Bot Discord`, displayed: false, lvl: 1, authorized: (): boolean => true, expanded: false, children: [
                        {label: $localize`Installation`, path: 'tutorials/discord-bot/installation', displayed: false, lvl: 2, authorized: (): boolean => true},
                    ]
                },
            ]
        }
    ];

    constructor(@Inject(LOCALE_ID) private locale_id: string, @Inject(DOCUMENT) private document: Document) {

    }

    public ngOnInit(): void {
        /** Si il y a une langue enregistrée, on l'utilise, sinon on utilise le français */
        const used_locale: string = this.locale_id;
        /** Si dans la liste des langues supportées on trouve la langue ci-dessus, on l'utilise, sinon on utilise le français */
        this.site_language = this.language_list.some((language: Language) => used_locale === language.code)
            ? this.language_list.find((language: Language) => used_locale === language.code)
            : this.language_list.find((language: Language) => language.default);

        this.defineThemes();

        setTimeout(() => {
            this.resizeSidenav();
        });
    }

    public toggleDisplayChildren(route: SidenavLinks): void {
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

    public changeTheme(new_theme: Theme): void {
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
    public changeLanguage(new_language: Language): void {
        this.site_language = new_language;
        localStorage.setItem('mho-locale', new_language.code);
        setTimeout(() => {
            this.document.location.reload();
        });
    }

    private isInTown(): boolean {
        if (!environment.production) return true;
        const town: TownDetails | null = getTown();
        if (!town) return false;
        return town.town_id !== null && town.town_id !== undefined && town.town_id !== 0;
    }

    private resizeSidenav(): void {
        this.sidenavContainer.autosize = true;
        setTimeout((): void => {
            this.sidenavContainer.autosize = true;
        });
    }

    private defineThemes(): void {
        /** Noël */
        if (this.isNoel()) {
            this.themes.push({label: $localize`Noël`, class: 'noel'});
            this.themes.splice(0, 1);
            this.useEventTheme();
        } else if (this.isNothing() && (this.selected_theme?.class === 'noel' || !this.selected_theme)) {
            setTimeout(() => {
                this.changeTheme(this.themes[0]);
            });
        }

        /** Halloween */
        if (this.isHalloween()) {
            this.themes.push({label: $localize`Halloween`, class: 'halloween'});
            this.themes.splice(0, 1);
            this.useEventTheme();
        } else if (this.isNothing() && (this.selected_theme?.class === 'halloween' || !this.selected_theme)) {
            setTimeout(() => {
                this.changeTheme(this.themes[0]);
            });
        }


        this.selected_theme = this.themes.find((theme: Theme) => theme.class === localStorage.getItem('theme'))
            || this.themes.find((theme: Theme) => theme.class === '');


        this.charts_theming_service.defineColorsWithTheme(this.selected_theme);
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
    children?: SidenavLinks[];
    lvl?: number;
    displayed: boolean;
    authorized: () => boolean;
    expanded?: boolean;
    spoil?: boolean;
}

interface Language {
    code: string;
    label: string;
    default?: boolean;
}
