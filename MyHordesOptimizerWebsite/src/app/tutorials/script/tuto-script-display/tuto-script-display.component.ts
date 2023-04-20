import { Component, HostBinding } from '@angular/core';
import { ClipboardService } from '../../../shared/services/clipboard.service';
import { AccordionItem } from '../../../shared/elements/accordion/accordion.component';

@Component({
    selector: 'mho-tuto-script-display',
    templateUrl: './tuto-script-display.component.html',
    styleUrls: ['./tuto-script-display.component.scss'],
})
export class TutoScriptDisplayComponent {
    @HostBinding('style.display') display: string = 'contents';

    public readonly title: string = $localize`Affichage`;

    public readonly tuto_script_items: AccordionItem[] = [
        {
            title: $localize`Affichage des tooltips détaillés`,
            content: $localize`Modifie les tooltips natifs de l'application pour afficher en plus la liste des recettes dans lesquelles l'objet survolé apparait ainsi que quelques informations complémentaires (nombre de points d'action rendus par un aliment par exemple).`
        },
        {
            title: $localize`Navigation rapide vers le chantier recommandé`, content: $localize`Dans l'interface, vous pouvez cocher le bouton "Navigation rapide vers le chantier recommandé", ce qui activera la fonctionnalité de navigation rapide.
                Il s'agit simplement, lorsqu'il existe un chantier recommandé, de pouvoir cliquer dessus pour être automatiquement redirigé vers la ligne du chantier dans la liste.`
        },
        {
            title: $localize`Filtrer les chantiers`,
            content: $localize`En cochant cette option, un nouveau champ de filtre apparaitra dans la liste des chantiers.`
        },
        {
            title: $localize`Affichage de la liste de courses dans la page`, content: $localize`En cochant cette option, la liste de courses apparaitra lorsque vous vous trouverez dans le desert ou dans l'atelier.
        Cette liste contient des informations de priorité, de quantité en banque, de quantité totale requise, et de quantité manquante.
        <br /><br />
        La liste de courses dans l'atelier ne présentera que les éléments pouvant obtenus à l'atelier si la quantité manquante est positive.
        Celle dans le désert affichera tous les éléments sans distinction si la quantité manquante est positive.
        <br /><br />
        Dans le désert, les objets dans le sac ou au sol également présents dans la liste de course se verront attribuer une bordure dont la couleur indique la priorité de l'élément, et ce sans tenir compte de la quantité manquante.
        <br /><br />
        Cocher cette option donne également accès à une nouvelle option permettant de choisir si on souhaite que la liste de course soit dépliée ou repliée par défaut.
        `
        },
        {
            title: $localize`Affichage de l'outil de traduction`, content: $localize`En cochant cette option, un outil de traduction s'affichera dans l'interface.
                Vous pourrez désormais sélectionner une langue d'origine, puis saisir le texte à rechercher dans les autres langues.
                Le texte doit impérativement être un texte de MyHordes, puisque nous allons en chercher la traduction dans les fichiers de traduction du jeu.`
        },
        {
            title: $localize`Afficher les PA manquants pour réparer les chantiers`, content: $localize`En pandé, les chantiers subissent des dégats lors de l'attaque.
                Cette option va montrer combien de pa manquent pour que le chantier ne risque pas d'être détruit lors de la prochaine attaque.`
        },
        {
            title: $localize`Afficher un onglet contenant des informations supplémentaires sur la page des citoyens`, content: $localize`En cochant cette option, un nouvel onglet apparaitra dans la page "citoyens" de votre ville.
                Cette page contient les rumeurs disponibles sur la page de citoyen, ainsi que tous les travaux effectués dans la maison de chaque citoyen.`
        },
    ];

    public constructor(private clipboard: ClipboardService) {

    }

    public copyUrl(): void {
        const url: string = window.location.href;
        this.clipboard.copy(url, $localize`Le lien a bien été copié`);
    }

    public shareForum(): void {
        let text: string = '';

        text += `[b][big]${this.title}[/big][/b]`;
        text += '\n\n';
        this.tuto_script_items.forEach((item: AccordionItem): void => {
            text += `[collapse=${item.title}]${item.content.replace(/<ul>/g, '').replace(/<\/ul>/g, '').replace(/<li>/g, '[0]').replace(/<\/li>/g, '').replace(/<br \/><br \/>/g, '\n').replace(/<strong>/g, '[b]').replace(/<\/strong>/g, '[/b]')}[/collapse]\n\n`;
        });

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
