import { Component, ViewEncapsulation } from '@angular/core';
import { AccordionItem } from 'src/app/shared/elements/accordion/accordion.component';
import { ClipboardService } from 'src/app/shared/services/clipboard.service';

@Component({
    selector: 'mho-tuto-script-wiki',
    templateUrl: './tuto-script-wiki.component.html',
    styleUrls: ['./tuto-script-wiki.component.scss'],
})
export class TutoScriptWikiComponent {

    public readonly title: string = $localize`Wiki`;
    public readonly tuto_script_items: AccordionItem[] = [
        {
            title: $localize`Objets`, content: $localize`Affiche la liste de tous les objets existant dans MyHordes (ainsi que des informations complémentaires à leur sujet).<br /><br />
                Si vous êtes incarné, les objets qui ne sont pas dans la liste de courses sont suivis d'un bouton présentant un caddie. Un clic sur ce bouton les ajoute à la liste de courses.`
        },
        { title: $localize`Recettes`, content: $localize`Affiche la liste de toutes les recettes de l'application.` },
        { title: $localize`Pouvoirs`, content: $localize`Présente tout simplement la liste des pouvoirs héros, leur description et le nombre de jours avant obtention.` },
        {
            title: $localize`Bâtiments`, content: $localize`Affiche la liste de tous les bâtiments existant dans le jeu, leur distance de la ville, ainsi que la liste des objets qu'on peut obtenir en les fouillant et leurs probabilités d'obtention.`
        }
    ];

    public constructor(private clipboard: ClipboardService) {

    }

    public copyUrl(): void {
        let url: string = window.location.href;
        this.clipboard.copy(url, $localize`Le lien a bien été copié`);
    }

    public shareForum(): void {
        let text: string = '';

        text += `[b][big]${this.title}[/big][/b]`;
        text += `\n\n`;
        this.tuto_script_items.forEach((item: AccordionItem) => {
            text += `[collapse=${item.title}]${item.content.replace(/<br \/><br \/>/g, '\n')}[/collapse]\n\n`
        })

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
