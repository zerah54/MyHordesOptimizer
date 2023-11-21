import { Component, HostBinding, Inject } from '@angular/core';
import { ClipboardService } from '../../../shared/services/clipboard.service';
import { DOCUMENT } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'mho-tuto-discord-bot-installation',
    templateUrl: './tuto-discord-bot-installation.component.html',
    styleUrls: ['./tuto-discord-bot-installation.component.scss'],
    standalone: true,
    imports: [
        MatCardModule,
        MatButtonModule,
        MatTooltipModule,
        MatMenuModule,
        MatIconModule,
    ],
})
export class TutoDiscordBotInstallationComponent {
    @HostBinding('style.display') display: string = 'contents';

    public readonly title: string = $localize`Installation du Bot sur un serveur Discord`;
    public readonly download_link: string = $localize`<a color="accent" href="https://discord.com/api/oauth2/authorize?client_id=1140035117746765914&permissions=277025459200&scope=bot" target="_blank">lien d'installation du bot</a>`;
    public text_1: string = $localize`Vous devez être propriétaire ou avoir les droits d'administration sur le serveur Discord sur lequel vous voulez inviter le Bot.`;
    public text_2: string = $localize`En cliquant sur le ${this.download_link}, vous serez redirigé vers une page d'installation.`;

    public constructor(private clipboard: ClipboardService, @Inject(DOCUMENT) private document: Document) {

    }

    public copyUrl(): void {
        const url: string = this.document.location.href;
        this.clipboard.copy(url, $localize`Le lien a bien été copié`);
    }

    public shareForum(): void {
        let text: string = '';

        text += `[b][big]${this.title}[/big][/b]`;
        text += '\n\n';
        text += this.text_1.replace(/<a .* href="(.*)" .*>(.*)<\/a>/g, '[link=$1]$2[/link]');
        text += '\n\n';
        text += this.text_2.replace(/<a .* href="(.*)" .*>(.*)<\/a>/g, '[link=$1]$2[/link]');

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
