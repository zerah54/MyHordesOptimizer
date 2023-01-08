import { Component, Inject, LOCALE_ID } from '@angular/core';
import * as moment from 'moment';

@Component({
    selector: 'mho-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent {

    public themes: Theme[] = [
        { label: $localize`Par défaut`, class: '' },
        { label: $localize`Rose`, class: 'pink' },
        { label: $localize`Brun`, class: 'brown' },
    ]

    public selected_theme: Theme | undefined = this.themes.find((theme: Theme) => theme.class === localStorage.getItem('theme'));


    /** La liste des langues disponibles */
    public language_list: Language[] = [
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français', default: true },
        { code: 'es', label: 'Spanish' },
        { code: 'de', label: 'Deutsch' }
    ];

    /** La langue sélectionnée pour l'affichage de l'application */
    public site_language: Language | undefined;


    public routes: SidenavLinks[] = [
        {
            label: $localize`Outils`, lvl: 0, displayed: true, authorized: () => true, expanded: false, children: [
                { label: $localize`Banque`, path: 'tools/bank', displayed: false, lvl: 1, authorized: () => true },
                { label: $localize`Liste de courses`, path: 'tools/wishlist', displayed: false, lvl: 1, authorized: () => true },
                { label: $localize`Citoyens`, path: 'tools/citizens', displayed: false, lvl: 1, authorized: () => true },
                { label: $localize`Camping`, path: 'tools/camping', displayed: false, lvl: 1, authorized: () => true },
            ]
        },
        {
            label: $localize`Wiki`, lvl: 0, displayed: true, authorized: () => true, expanded: false, children: [
                { label: $localize`Objets`, path: 'wiki/items', displayed: false, lvl: 1, authorized: () => true },
                { label: $localize`Recettes`, path: 'wiki/recipes', displayed: false, lvl: 1, authorized: () => true },
                { label: $localize`Pouvoirs`, path: 'wiki/hero-skills', displayed: false, lvl: 1, authorized: () => true },
                { label: $localize`Bâtiments`, path: 'wiki/ruins', displayed: false, lvl: 1, authorized: () => true },
                { label: $localize`Informations diverses`, path: 'wiki/miscellaneous-info', displayed: false, lvl: 1, authorized: () => true }
            ]
        },
        {
            label: $localize`Tutoriels`, lvl: 0, displayed: true, authorized: () => true, expanded: false, children: [
                {
                    label: $localize`Script`, displayed: false, lvl: 1, authorized: () => true, expanded: false, children: [
                        { label: $localize`Installation`, path: 'tutorials/script/installation', displayed: false, lvl: 2, authorized: () => true },
                        // { label: $localize`Mettre à jour les outils externes`, path: 'tutorials/script/update-external-tools', displayed: false, lvl: 2, authorized: () => true },
                        { label: $localize`Documentation`, path: 'tutorials/script/documentation', displayed: false, lvl: 2, authorized: () => true }
                    ]
                },
                {
                    label: $localize`Site`, displayed: false, lvl: 1, authorized: () => true, expanded: false, children: [
                        { label: $localize`Première utilisation`, path: 'tutorials/site/first-use', displayed: false, lvl: 2, authorized: () => true },
                    ]
                },
            ]
        }
    ];

    constructor(@Inject(LOCALE_ID) private locale_id: string,) {
        /** Si il y a une langue enregistrée, on l'utilise, sinon on utilise le français */
        let used_locale: string = this.locale_id;
        /** Si dans la liste des langues supportées on trouve la langue ci-dessus, on l'utilise, sinon on utilise le français */
        this.site_language = this.language_list.some((language: Language) => used_locale === language.code)
            ? this.language_list.find((language: Language) => used_locale === language.code)
            : this.language_list.find((language: Language) => language.default);

        if (moment().isSameOrAfter(moment(`01-12-${moment().year()} 00:00:00`, 'DD-MM-YYYY HH:mm:ss'))
            && moment().isSameOrBefore(moment(`25-12-${moment().year()} 23:59:59`, 'DD-MM-YYYY HH:mm:ss'))) {
            this.themes.push({ label: $localize`Noël`, class: 'noel' });
            this.themes.splice(0, 1);
            if (this.selected_theme?.class === '') {
                setTimeout(() => {
                    this.changeTheme(this.themes[this.themes.length - 1])
                })
            }
        } else if (this.selected_theme?.class === 'noel') {
            setTimeout(() => {
                this.changeTheme(this.themes[0])
            })
        }

        this.selected_theme = this.themes.find((theme: Theme) => theme.class === localStorage.getItem('theme'))
            || this.themes.find((theme: Theme) => theme.class === '')
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
            window.dispatchEvent(new Event('resize'));
        }
    }

    public changeTheme(new_theme: Theme): void {
        this.selected_theme = new_theme;
        localStorage.setItem('theme', new_theme.class);
        setTimeout(() => {
            location.reload();
        })
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
            location.reload();
        })
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
}

interface Theme {
    label: string;
    class: string;
}

interface Language {
    code: string;
    label: string;
    default?: boolean;
}
