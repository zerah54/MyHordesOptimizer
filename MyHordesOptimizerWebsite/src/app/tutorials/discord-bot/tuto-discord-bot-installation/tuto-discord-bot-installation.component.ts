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
    selector: 'mho-tuto-discord-bot-installation',
    templateUrl: './tuto-discord-bot-installation.component.html',
    styleUrls: ['./tuto-discord-bot-installation.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
})
export class TutoDiscordBotInstallationComponent {
    protected readonly title: string = $localize`Installation du Bot Discord`;
    private readonly clipboard: ClipboardService = inject(ClipboardService);
    private readonly document: Document = inject<Document>(DOCUMENT);
    private readonly download_link: string = $localize`<a href="https://discord.com/oauth2/authorize?client_id=1140035117746765914" target="_blank">lien d'installation du bot</a>`;

    protected readonly tuto_bot_items: AccordionItem[] = [
        {
            title: $localize`En tant qu'application (Recommandé)`,
            content: $localize`En l'installant en tant qu'application, vous pourrez utiliser les commandes du bot partout sur Discord (en messages privés, dans des groupes, ou sur des serveurs où le bot n'est pas présent).<br><br>Cliquez sur le ${this.download_link} et choisissez <strong>Ajouter à mes applications</strong>.`
        },
        {
            title: $localize`Sur un serveur`,
            content: $localize`Vous pouvez également ajouter le bot à un serveur entier pour que tous les membres puissent l'utiliser. Pour cela, vous devez être propriétaire ou avoir les droits d'administration sur le serveur Discord.<br><br>Cliquez sur le ${this.download_link} et choisissez <strong>Ajouter à un serveur</strong>.`
        }
    ];

    protected copyUrl(): void {
        const url: string = this.document.location.href;
        this.clipboard.copy(url, $localize`Le lien a bien été copié`);
    }

    protected shareForum(): void {
        let text: string = '';

        text += `[b][big]${this.title}[/big][/b]`;
        text += '\n\n';
        this.tuto_bot_items.forEach((item: AccordionItem) => {
            text += `[collapse=${item.title}]${item.content.replace(/<br>/g, '\n').replace(/<strong>(.*?)<\/strong>/g, '[b]$1[/b]').replace(/<a .*? href="(.*?)" .*?>(.*?)<\/a>/g, '[link=$1]$2[/link]')}[/collapse]\n\n`;
        });

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
