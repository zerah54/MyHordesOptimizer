import { Component, ViewEncapsulation } from '@angular/core';
import { AccordionItem } from 'src/app/shared/elements/accordion/accordion.component';
import { ClipboardService } from 'src/app/shared/services/clipboard.service';

@Component({
    selector: 'mho-tuto-script-alerts',
    templateUrl: './tuto-script-alerts.component.html',
    styleUrls: ['./tuto-script-alerts.component.scss'],
})
export class TutoScriptAlertsComponent {

    public readonly title: string = $localize`Notifications`;

    public readonly tuto_script_items: AccordionItem[] = [
        {
            title: $localize`Avertissement en cas de fermeture de la page`, content: $localize`Dans l'interface, vous pouvez cocher l'option' "Demander confirmation avant de quitter en l'absence d'escorte automatique", ce qui activera la fonctionnalité.
                Une fois activée, si vous êtes dans le désert et que votre attente d'escorte n'est pas activée, alors au moment de fermer la fenêtre ou l'onglet vous verrez apparaitre un avertissement demandant de confirmer votre action.`
        },
        {
            title: $localize`Notification à la fin de la fouille`, content: $localize`Si vous cochez l'option "Me notifier à la fin de la fouille", vous recevrez une notification de votre navigateur quelques secondes avant la fin de votre fouille à condition que votre navigateur soit toujours ouvert sur la page du désert.`
        },
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
            text += `[collapse=${item.title}]${item.content}[/collapse]\n\n`;
        })

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
