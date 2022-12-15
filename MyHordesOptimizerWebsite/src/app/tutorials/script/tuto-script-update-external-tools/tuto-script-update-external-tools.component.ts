import { Component, ViewEncapsulation } from '@angular/core';
import { AccordionItem } from 'src/app/shared/elements/accordion/accordion.component';
import { ClipboardService } from 'src/app/shared/services/clipboard.service';

@Component({
    selector: 'mho-tuto-script-update-external-tools',
    templateUrl: './tuto-script-update-external-tools.component.html',
    styleUrls: ['./tuto-script-update-external-tools.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TutoScriptUpdateExternalToolsComponent {

    public readonly title: string = $localize`Mettre à jour les outils externes`;

    public readonly header: string = $localize`Une des fonctionnalités du script est de permettre la mise à jour de différents outils externes depuis le site de MyHordes. Pour ce faire, il faut activer les options associées dans la liste des options de MyHordes Optimizer.`;

    public readonly tuto_script_items: AccordionItem[] = [
        { title: $localize`MyHordes Optimizer`, content: $localize`` },
        {
            title: $localize`Gest'Hordes`, content: $localize``
        },
        {
            title: $localize`BigBroth'Hordes`, content: $localize``
        },
        {
            title: $localize`Fata Morgana`, content: $localize``
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

        text += `[b][big]${this.title}[/big][/b]`
        text += `\n\n`
        this.tuto_script_items.forEach((item: AccordionItem) => {
            text += `[collapse=${item.title}]${item.content.replace(/<ul>/g, '').replace(/<\/ul>/g, '').replace(/<li>/g, '[0]').replace(/<\/li>/g, '').replace(/<a .* href="(.*)" .*>(.*)<\/a>/g, '[link=$1]$2[/link]')}[/collapse]\n\n`
        })

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
