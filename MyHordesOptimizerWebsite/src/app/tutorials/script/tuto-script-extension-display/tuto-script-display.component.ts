import { Component, DOCUMENT, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Imports } from '../../../_abstract_model/types/_types';
import { ClipboardService } from '../../../_core/services/clipboard.service';
import { AccordionComponent, AccordionItem } from '../../../_shared/accordion/accordion.component';

const angular_common: Imports = [];
const components: Imports = [AccordionComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatIconModule, MatMenuModule, MatTooltipModule];

@Component({
    selector: 'mho-tuto-script-display',
    templateUrl: './tuto-script-display.component.html',
    styleUrls: ['./tuto-script-display.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
})
export class TutoScriptDisplayComponent {
    private readonly clipboard: ClipboardService = inject(ClipboardService);
    private readonly document: Document = inject<Document>(DOCUMENT);

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
            title: $localize`Champs de recherches supplémentaires`,
            content: $localize`En cochant cette option, vous pourrez choisir des champs de recherches à afficher dans votre interface. Sont actuellement disponibles : un champ de recherche sur la liste des chantiers, un champ de recherche dans les destinataires d'un message dans sa maison, un champ de recherche sur les entrées du registre.`
        },
        {
            title: $localize`Affichage de la liste de courses dans la page`,
            content: $localize`En cochant cette option, la liste de courses apparaitra lorsque vous vous trouverez dans le desert ou dans l'atelier.
        Cette liste contient des informations de priorité, de quantité en banque, de quantité dans les sacs, de quantité totale requise, et de quantité manquante.
        <br /><br />
        La liste de courses dans l'atelier ne présentera que les éléments pouvant obtenus à l'atelier.
        Celle dans le désert affichera tous les éléments sans distinction.
        <br /><br />
        Dans le désert, les objets dans le sac ou au sol également présents dans la liste de course se verront attribuer une bordure dont la couleur indique la priorité de l'élément.
        `
        },
        {
            title: $localize`Affichage du nombre de zombies tués sur la case`,
            content: $localize`En cochant cette option, un nouvel encart apparaitra sous la carte dans l'Outre-Monde.
                Il compte le nombre de zombies qui ont été tués sur la case depuis la dernière attaque, et calcule le nombre de zombies qui vont mourir de désespoir lors de la prochaine attaque.`
        },
        {
            title: $localize`Affichage de l'outil de traduction`,
            content: $localize`En cochant cette option, un outil de traduction s'affichera dans l'interface.
                Vous pourrez désormais sélectionner une langue d'origine, puis saisir le texte à rechercher dans les autres langues.
                Le texte doit impérativement être un texte de MyHordes, puisque nous allons en chercher la traduction dans les fichiers de traduction du jeu.`
        },
        {
            title: $localize`Afficher les PA manquants pour réparer les chantiers`,
            content: $localize`En pandémonium, les chantiers subissent des dégats lors de l'attaque.
                Cette option va montrer combien de pa manquent pour que le chantier ne risque pas d'être détruit lors de la prochaine attaque.`
        },
        {
            title: $localize`Prédictions de camping dans les informations du secteur`,
            content: $localize`En cochant cette option, vous verrez apparaitre un nouvel encart dans les informations du secteur de votre case.
                Cet encart vous permettra de saisir diverses informations pour calculer vos chances de survie sur cette case.
                Certaines informations, comme par exemple le type de ville, ne sont pas visibles car elles sont déjà pré-renseignées et tiennent compte de votre ville actuelle.`
        },
        {
            title: $localize`Informations diverses issues de MyHordes Optimizer`,
            content: $localize`Sur la carte du site de MyHordes Optimizer, vous pouvez saisir des notes sur chaque case.
               Quand cette option est cochée, la note associée s'affiche sur votre case quand vous vous déplacez dans l'Outre-Monde.`
        },
        {
            title: $localize`Affiche les estimations enregistrées sur la page de la tour de guet`,
            content: $localize`Quand cette option est cochée, un nouvel encart apparait sur la page de la tour de guet, permettant de consulter, enregistrer et copier les valeurs des estimations.`
        },
        {
            title: $localize`Ajoute un bouton permettant de copier le contenu du registre`,
            content: $localize`Quand cette option est cochée, sur chaque regitre un bouton est ajouté permettant d'en copier le contenu.`
        },
        {
            title: $localize`Affiche un compteur pour gérer l'anti-abus`,
            content: $localize`Quand cette option est cochée, un compteur qui liste vos prises en banque est ajouté aux pages de banque et puits.
                Le compteur dans MyHordes tient compte des minutes "glissantes", il suffit donc d'attendre qu'une ligne disparaisse pour pouvoir prendre de nouveau un objet en banque.`
        },
        {
            title: $localize`Ouvre automatiquement le menu "Utiliser un objet de mon sac"`,
            content: $localize`Quand cette option est cochée, au chargement d'une case dans l'Outre-Monde un clic sur le bouton d'ouverture du sac sera simulé pour que votre sac soit ouvert par défaut.`
        },
        {
            title: $localize`Définir des options d'escorte par défaut`,
            content: $localize`En cochant cette option, deux autres options représentant les options d'escorte dans l'Outre-Monde seront disponibles.
                Vous pourrez ainsi choisir quelles options vous voulez voir cochées ou non par défaut quand vous activez votre escorte.`
        },
    ];

    public copyUrl(): void {
        const url: string = this.document.location.href;
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
