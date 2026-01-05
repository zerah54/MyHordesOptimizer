import { Component, DOCUMENT, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Imports } from '../../../_abstract_model/types/_types';
import { AccordionComponent, AccordionItem } from '../../../shared/elements/accordion/accordion.component';
import { ClipboardService } from '../../../shared/services/clipboard.service';

const angular_common: Imports = [];
const components: Imports = [AccordionComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatIconModule, MatMenuModule, MatTooltipModule];

@Component({
    selector: 'mho-tuto-script-installation',
    templateUrl: './tuto-script-installation.component.html',
    styleUrls: ['./tuto-script-installation.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
})
export class TutoScriptInstallationComponent {

    public readonly title: string = $localize`Script / Extension`;
    public readonly download_link: string = $localize`<a href="https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js" target="_blank">lien de téléchargement du script</a>`;
    public readonly firefox_link_href: string = 'https://addons.mozilla.org/fr/firefox/addon/mho-addon';
    public readonly firefox_extension_link: string = $localize`<a href="${this.firefox_link_href}" target="_blank">page de l'extension</a>`;
    public readonly chrome_link_href: string = 'https://chromewebstore.google.com/detail/myhordes-optimizer/jolghobcgphmgaiachbipnpiimmgknno';
    public readonly chrome_extension_link: string = $localize`<a href="${this.chrome_link_href}" target="_blank">page de l'extension</a>`;
    public readonly tuto_script_items: AccordionItem[] = [
        {
            title: $localize`Ordinateur`,
            content: $localize`Il faut d'abord installer l'application de gestion des scripts de votre choix. Il en existe plusieurs, comme par exemple Tampermonkey ou Violentmonkey. Ensuite, il suffit de cliquer sur le ${this.download_link}, qui lancera la procédure d'installation. Enfin, il faudra confirmer dans la page qui se sera ouverte.`
        },
        {
            title: 'Android', content: $localize`<ul>
                <li>Installer un navigateur acceptant les extensions, tel que Kiwi Browser ou Firefox ;</li>
                <li>Rechercher l'extension de gestion des scripts de votre choix dans la barre de recherche de ce navigateur. Il en existe plusieurs, comme par exemple Tampermonkey ou Violentmonkey ;</li>
                <li>Installer l'extension pour Chrome ;</li>
                <li>Cliquer sur le ${this.download_link} ;</li>
                <li>Confirmer l'installation dans la page qui se sera ouverte.</li>
            </ul>`
        },
        {
            title: 'iOS', content: $localize`<ul>
                <li>Télécharger l’application "UserScripts" ;</li>
                <li>Ouvrir l'application "Raccourcis" ;</li>
                <li>Appuyer sur le bouton "+" en haut à droite pour créer un nouveau raccourci ;</li>
                <li>Rechercher l'action "Obtenir le contenu de l'URL" et l'ajouter ;</li>
                <li>Rechercher l'action "Enregister le fichier" et l'ajouter ;</li>
                <li>Configurer l'action "Obtenir le contenu de l'URL" en modifiant la valeur du paramètre "URL" par la valeur "Entrée de raccourci" ;</li>
                <li>Configurer l'action "Recevoir l'entrée" en modifiant la valeur du premier paramètre "Images et 18 de plus" par la valeur "URL" uniquement ;</li>
                <li>Configurer l'action "Recevoir l'entrée" en modifiant la valeur du second paramètre "Nulle part" par la valeur "Dans la feuille de partage" ;</li>
                <li>Terminer la création du raccourci en appuyant sur le bouton "OK" en haut à droite ;</li>
                <li>Enregistrer le fichier disponible sur le ${this.download_link} via un appui long sur le lien, en sélectionnant "Partager..." puis l'action "Enregister le fichier" ;</li>
                <li>Autoriser l'action "Enregistrer le fichier" à l'envoyer 1 élement de l'app Safari vers "github.com" ;</li>
                <li>Sélectionner l'onglet "Explorer", choisir l'emplacement "Sur mon iPhone", sélectionner le dossier "Userscripts" puis valider appuyant sur le bouton "Ouvrir" en haut à droite ;</li>
                <li>Ouvrir l'application "Fichiers" ;</li>
                <li>Retourner dans le dossier "Userscripts" ("Explorer" > "Sur mon iPhone" > "Userscripts") ;</li>
                <li>Appuyer sur le bouton "..." en haut à droite et sélectionner "Options de présentation" ;</li>
                <li>Activer l'option avancée "Afficher toutes les extensions de fichiers" ;</li>
                <li>Renommer le fichier "my_hordes_optimizer.user.txt" en "my_hoydes_optimizer.user.js" ;</li>
                <li>Confirmer le remplacement de l'extension via le choix "Utiliser ".js ;</li>
                <li>Aller sur Safari ;</li>
                <li>Appuyer sur le "Aa" dans la barre de recherche ;</li>
                <li>Cliquer sur "Gérer les extensions" ;</li>
                <li>Activer "Userscripts" ;</li>
                <li>Appuyer sur le "Aa" dans la barre de recherche ;</li>
                <li>Cliquer sur "Userscripts" ;</li>
                <li>Vérifier que "MyHordes Optimizer" est bien activé.</li>
            </ul>`
        }
    ];
    public readonly tuto_extension_items: AccordionItem[] = [
        {
            title: 'Firefox',
            content: $localize`Rendez-vous sur la ${this.firefox_extension_link} pour l'installer.`
        },
        {
            title: 'Chrome',
            content: $localize`Rendez-vous sur la ${this.chrome_extension_link} pour l'installer.`
        }
    ];
    public readonly script_final_text: string = '\n' + $localize`Une fois le script installé, il faudra rafraîchir la page du jeu. Vous verrez alors apparaitre un nouveau bouton en haut de votre page MyHordes. Au survol, une fenêtre s'affiche, donnant accès aux options du script ainsi qu'à certaines de ses fonctionnalités.`;
    public readonly extension_final_text: string = '\n' + $localize`Une fois l'extension installée, il faudra rafraîchir la page du jeu. Vous verrez alors apparaitre un nouveau bouton en haut de votre page MyHordes. Au survol, une fenêtre s'affiche, donnant accès aux options du script ainsi qu'à certaines de ses fonctionnalités.`;

    public constructor(private clipboard: ClipboardService, @Inject(DOCUMENT) private document: Document) {

    }

    public copyUrl(): void {
        const url: string = this.document.location.href;
        this.clipboard.copy(url, $localize`Le lien a bien été copié`);
    }

    public shareForum(): void {
        let text: string = '';

        text += `[b][big]${this.title}[/big][/b]`;
        text += '{hr}';
        this.tuto_extension_items.forEach((item: AccordionItem) => {
            text += `[collapse=${item.title}]${item.content.replace(/<ul>/g, '').replace(/<\/ul>/g, '').replace(/<li>/g, '[0]').replace(/<\/li>/g, '').replace(/<a .* href="(.*)" .*>(.*)<\/a>/g, '[link=$1]$2[/link]')}[/collapse]\n\n`;
        });

        text += this.extension_final_text;
        text += '{hr}';
        this.tuto_script_items.forEach((item: AccordionItem) => {
            text += `[collapse=${item.title}]${item.content.replace(/<ul>/g, '').replace(/<\/ul>/g, '').replace(/<li>/g, '[0]').replace(/<\/li>/g, '').replace(/<a .* href="(.*)" .*>(.*)<\/a>/g, '[link=$1]$2[/link]')}[/collapse]\n\n`;
        });

        text += this.script_final_text;

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
