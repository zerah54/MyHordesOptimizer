import { DOCUMENT } from '@angular/common';
import { Component, HostBinding, Inject, ViewEncapsulation } from '@angular/core';
import { ClipboardService } from '../../../shared/services/clipboard.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'mho-tuto-site-first-use',
    templateUrl: './tuto-site-first-use.component.html',
    styleUrls: ['./tuto-site-first-use.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [MatCardModule, MatButtonModule, MatTooltipModule, MatMenuModule, MatIconModule]
})
export class TutoSiteFirstUseComponent {
    @HostBinding('style.display') display: string = 'contents';

    public readonly title: string = $localize`Première utilisation du site`;

    public readonly text_1: string = $localize`Lors de votre première utilisation du site vous n'aurez pas accès aux pages sous le menu "Ma ville". En effet, il faut au préalable renseigner son identifiant externe pour les applications, en haut à droite de la page.`;
    public readonly text_2: string = $localize`L'identifiant externe pour les applications se trouve sur le site de MyHordes, dans la page de votre âme, onglet "Avancé". Une fois copié, il suffit de le coller dans le champ dédié sur le site de MyHordes Optimizer et de valider.`;

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
        text += this.text_1;
        text += '\n\n';
        text += this.text_2;

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
