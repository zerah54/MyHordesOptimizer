import { Component, ViewEncapsulation } from '@angular/core';
import { AccordionItem } from 'src/app/shared/elements/accordion/accordion.component';
import { ClipboardService } from 'src/app/shared/services/clipboard.service';

@Component({
    selector: 'mho-tuto-script-tools',
    templateUrl: './tuto-script-tools.component.html',
    styleUrls: ['./tuto-script-tools.component.scss'],
})
export class TutoScriptToolsComponent {

    public readonly title: string = $localize`Outils`;
    public readonly tuto_script_items: AccordionItem[] = [
        {
            title: $localize`Banque`, content: $localize`Affiche la liste des objets de la banque et leur quantité.<br /><br />
                Si vous êtes incarnés, les objets qui ne sont pas dans la liste de courses sont suivis d'un bouton présentant un caddie. Un clic sur ce bouton les ajoute à la liste de courses.`
        },
        {
            title: $localize`Camping`, content: $localize`Affiche un outil de prédiction des chances de survie en camping.`
        },
        {
            title: $localize`Liste de courses`, content: $localize`Affiche une liste de courses contenant les objets ajoutés via les pages de liste d'objets et de banque.<br /><br />
                Vous pouvez modifier la priorité de chaque objet, ainsi que la quantité requise.`
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
            text += `[collapse=${item.title}]${item.content.replace(/<br \/><br \/>/g, '\n')}[/collapse]\n\n`;
        })

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
