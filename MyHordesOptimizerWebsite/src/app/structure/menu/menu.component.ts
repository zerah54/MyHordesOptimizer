import { Component, Inject, LOCALE_ID } from '@angular/core';

@Component({
    selector: 'mho-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent {

    public themes: Theme[] = [
        {label: $localize`Par défaut`, class: ''},
        {label: $localize`Rose`, class: 'pink'},
    ]

    public selected_theme: Theme | undefined = this.themes.find((theme: Theme) => theme.class === localStorage.getItem('theme'))
    || this.themes.find((theme: Theme) => theme.class === '');


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
        { label: $localize`Script`, path: 'script', lvl: 0, displayed: true, authorized: () => true },
    ];

    constructor(@Inject(LOCALE_ID) private locale_id: string, ) {
        /** Si il y a une langue enregistrée, on l'utilise, sinon on utilise le français */
        let used_locale: string = this.locale_id;
        /** Si dans la liste des langues supportées on trouve la langue ci-dessus, on l'utilise, sinon on utilise le français */
        this.site_language = this.language_list.some((language: Language) => used_locale === language.code)
            ? this.language_list.find((language: Language) => used_locale === language.code)
            : this.language_list.find((language: Language) => language.default);
    }

    public toggleDisplayChildren(route: SidenavLinks): void {
        if (route.children && route.children.length > 0) {
            route.expanded = !route.expanded;
            route.children?.forEach((child) => {
                child.displayed = route.expanded || false;
            });
            window.dispatchEvent(new Event('resize'));
        }
    }

    public changeTheme(theme: Theme): void {
        localStorage.setItem('theme', theme.class);
        location.reload();
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
