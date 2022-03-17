import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { browser } from 'webextension-polyfill-ts';
import packageJson from '../../../package.json';
import { APPLICATION_BUTTON_SELECTOR, HORDES_IMG_URL, LOGO_URL, MAIL, MHO_BUTTON_ID, MH_HEADER_ID, TITLE, WEBSITE } from './../shared/const';

@Component({
    selector: APPLICATION_BUTTON_SELECTOR,
    templateUrl: './application-button.component.html',
    styleUrls: ['./application-button.component.scss']
})
export class ApplicationButtonComponent implements OnInit {

    public nb_children: number = 0;

    public readonly MHO_BUTTON_ID: string = MHO_BUTTON_ID;
    public readonly LOGO_URL: string = LOGO_URL;
    public readonly HORDES_IMG_URL: string = HORDES_IMG_URL;
    /** Libellés */
    public readonly title: string = TITLE;
    public readonly wiki_label: string = browser.i18n.getMessage('WIKI');
    public readonly tools_label: string = browser.i18n.getMessage('TOOLS');
    public readonly parameters_label: string = browser.i18n.getMessage('PARAMETERS');
    public readonly informations_label: string = browser.i18n.getMessage('INFORMATIONS');

    /** Les informations de l'outil */
    public readonly informations: Information[] = [
        { label: browser.i18n.getMessage('WEBSITE'), icon: HORDES_IMG_URL + 'emotes/explo.gif', href: WEBSITE },
        { label: browser.i18n.getMessage('CHANGELOG', packageJson.version), icon: HORDES_IMG_URL + 'emotes/rptext.gif', action: this.openChangelog },
        { label: browser.i18n.getMessage('CONTACT'), icon: HORDES_IMG_URL + 'icons/small_mail.gif', href: `mailto:${MAIL}?Subject=[${TITLE}]` },
    ]

    /** Les paramètres */
    public readonly categories: Category[] = [
        {
            label: browser.i18n.getMessage('UPDATE_EXTERNAL_TOOLS_OPTIONS_LABEL'),
            params: [
                { id: 'update_bbh', label: browser.i18n.getMessage('UPDATE_BBH_OPTION') },
                { id: 'update_gh', label: browser.i18n.getMessage('UPDATE_GH_OPTION') },
                { id: 'update_fata', label: browser.i18n.getMessage('UPDATE_FATA_OPTION') },
            ],
            help: browser.i18n.getMessage('UPDATE_EXTERNAL_TOOLS_HELP')
        },
        {
            label: 'Amélioration de l\'interface',
            params: [
                { id: 'enhanced_tooltips', label: `Afficher des tooltips détaillés` },
                {
                    id: 'click_on_voted', label: `Navigation rapide vers le chantier recommandé`,
                    help: 'Au clic sur le chantier recommandé, vous serez automatiquement redirigé vers celui-ci'
                },
                {
                    id: 'display_wishlist', label: `Afficher la liste de courses dans l'interface`,
                    params: [
                        { id: 'display_wishlist_closed', label: `Liste de courses repliée par défaut` },
                    ]
                },
                {
                    id: 'display_nb_dead_zombies',
                    label: `Afficher le nombre de zombies morts aujour'hui`,
                    help: `Affiche le nombre de tâches de sang sur la carte`,
                }
            ]
        },
        {
            label: 'Notifications',
            params: [
                { id: 'prevent_from_leaving', label: `Demander confirmation avant de quitter en l'absence d'escorte automatique` },
                { id: 'prevent_dangerous_actions', label: `[Expérimental] Demander confirmation avant d'effectuer des actions dangereuses` },
                {
                    id: 'notify_on_search_end',
                    label: `Me notifier à la fin de la fouille`,
                    help: `Permet de recevoir une notification lorsque la fouille est terminée si la page n'a pas été quittée entre temps`
                },
            ]
        }
    ];


    constructor(@Inject(DOCUMENT) private document: Document) {

    }

    ngOnInit(): void {
        let children = this.document.querySelector(`#${MH_HEADER_ID}`)?.children;
        this.nb_children = children ? children.length : 0;
    }

    public openWiki(): void {
        console.log('openWiki');

    }

    public openTools(): void {
        console.log('openTools');
    }

    public openChangelog(): void {
        console.log('openChangelog');
    }

    public updateParams(id: string, event: any): void {
        console.log('event', event);
        console.log('test', browser.storage.sync)
        event.target.checked = !event.target.checked;

    }

}

interface Information {
    label: string;
    icon: string;
    action?: () => void;
    href?: string;
}

interface Category {
    label: string;
    params: Param[];
    help?: string;
}

interface Param {
    id: string;
    label: string;
    params?: Param[];
    help?: string;
}
