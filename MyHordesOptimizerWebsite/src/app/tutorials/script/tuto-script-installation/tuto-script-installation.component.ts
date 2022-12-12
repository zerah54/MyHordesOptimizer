import { Component, ViewEncapsulation } from '@angular/core';
import { AccordionItem } from 'src/app/shared/elements/accordion/accordion.component';
import { ClipboardService } from 'src/app/shared/services/clipboard.service';

@Component({
    selector: 'mho-tuto-script-installation',
    templateUrl: './tuto-script-installation.component.html',
    styleUrls: ['./tuto-script-installation.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TutoScriptInstallationComponent {

    public readonly title: string = $localize`Installation du script`;
    public readonly download_link: string = $localize`<a color="accent" href="https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js" target="_blank">lien de téléchargement du script</a>`;
    public readonly tuto_script_items: AccordionItem[] = [
        { title: $localize`Ordinateur`, content: $localize`Il faut d'abord installer l'application de gestion des scripts de votre choix. Il en existe plusieurs, comme par exemple Tampermonkey, Violentmonkey. Ensuite, il suffit de cliquer sur le ${this.download_link}, qui lancera la procédure d'installation. Enfin, il faudra confirmer dans la page qui se sera ouverte.` },
        {
            title: $localize`Android`, content: $localize`<ul>
                <li>Installer Kiwi Browser ;</li>
                <li>Rechercher l'application de gestion des scripts de votre choix dans la barre de recherche de Kiwi Browser. Il en existe plusieurs, comme par exemple Tampermonkey ou Violentmonkey ;</li>
                <li>Installer l'extension pour Chrome ;</li>
                <li>Cliquer sur le ${this.download_link} ;</li>
                <li>Confirmer l'installation dans la page qui se sera ouverte.</li>
            </ul>`
        },
        {
            title: $localize`iOS`, content: $localize`<ul>
                <li>Télécharger l’application "UserScripts" ;</li>
                <li>Aller dans "Fichiers" ;</li>
                <li>Créer un dossier que l’on appellera "UserScripts" (ou autre mais c’est pour mieux s’y retrouver) ;</li>
                <li>Ouvrir l’application "UserScripts" ;</li>
                <li>Appuyer sur "Set Userscripts Directory" ;</li>
                <li>Sélectionner le dossier précédemment créé et valider ;</li>
                <li>Cliquer sur le ${this.download_link} ;</li>
                <li>Enregistrer le fichier ;</li>
                <li>Déplacer le fichier dans le dossier créé ;</li>
                <li>Aller sur Safari ;</li>
                <li>Appuyer sur le "Aa" dans la barre de recherche ;</li>
                <li>Cliquer sur "Gérer les extensions" ;</li>
                <li>Activer "Userscripts" ;</li>
                <li>Appuyer sur le "Aa" dans la barre de recherche ;</li>
                <li>Cliquer sur "Userscripts" ;</li>
                <li>Vérifier que "MyHordes Optimizer" est bien activé.</li>
            </ul>` }
    ];
    public readonly final_text: string = $localize`Une fois le script installé, vous verrez apparaitre un nouveau bouton en haut de votre page MyHordes. Au survol, une fenêtre s'affiche, donnant accès aux options du script ainsi qu'à certaines de ses fonctionnalités.`;

    public constructor(private clipboard: ClipboardService) {

    }

    public copyUrl(): void {
        let url: string = window.location.href;
        this.clipboard.copy(url, $localize`Le lien a bien été copié`);
    }

    public shareForum(): void {
        let text: string = '';

        text += `[b][big]${this.title}[/big][/b]`
        text += `\n\n`
        this.tuto_script_items.forEach((item: AccordionItem) => {
            text += `[collapse=${item.title}]${item.content.replace(/<ul>/g, '').replace(/<\/ul>/g, '').replace(/<li>/g, '[0]').replace(/<\/li>/g, '').replace(/<a .* href="(.*)" .*>(.*)<\/a>/g, '[link=$1]$2[/link]')}[/collapse]\n\n`
        })

        text += this.final_text;

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
