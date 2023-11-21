import { Component, HostBinding } from '@angular/core';
import { ClipboardService } from '../../../shared/services/clipboard.service';
import { AccordionItem, AccordionComponent } from '../../../shared/elements/accordion/accordion.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'mho-tuto-script-alerts',
    templateUrl: './tuto-script-alerts.component.html',
    styleUrls: ['./tuto-script-alerts.component.scss'],
    standalone: true,
    imports: [
        MatCardModule,
        MatButtonModule,
        MatTooltipModule,
        MatMenuModule,
        MatIconModule,
        AccordionComponent,
    ],
})
export class TutoScriptAlertsComponent {
    @HostBinding('style.display') display: string = 'contents';

    public readonly title: string = $localize`Notifications`;

    public readonly tuto_script_items: AccordionItem[] = [
        {
            title: $localize`Avertissement en cas de fermeture de la page`, content: $localize`Dans l'interface, vous pouvez cocher l'option "Demander confirmation avant de quitter la page", ce qui activera la fonctionnalité.
                Une fois activée, si vous êtes dans le désert et que votre attente d'escorte n'est pas activée, ou si vous n'avez pas relâché votre escorte, alors au moment de fermer la fenêtre ou l'onglet vous verrez apparaitre un avertissement demandant de confirmer votre action.`
        },
        {
            title: $localize`Avertissement en cas d'inactivité`, content: $localize`Dans l'interface, vous pouvez cocher l'option "Me notifier si je suis inactif depuis 5 minutes sur la page", ce qui activera la fonctionnalité.
                Une fois activée, si vous êtes dans le désert et que votre attente d'escorte n'est pas activée, ou si vous n'avez pas relâché votre escorte, alors au bout de 5 minutes sans actios sur la page une notification de navigateur vous avertira.`
        },
        {
            title: $localize`Notification à la fin de la fouille`,
            content: $localize`Si vous cochez l'option "Me notifier à la fin de la fouille", vous recevrez une notification de votre navigateur quelques secondes avant la fin de votre fouille à condition que votre navigateur soit toujours ouvert sur la page du désert.`
        },
        {
            title: $localize`Notification de nouveau message`,
            content: $localize`Si vous cochez l'option "MMe notifier si je reçois un nouveau message", vous recevrez une notification de votre navigateur lors d'un changement dans votre compteur de messages reçus.`
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
            text += `[collapse=${item.title}]${item.content}[/collapse]\n\n`;
        });

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
