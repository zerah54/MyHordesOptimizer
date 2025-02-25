import { DOCUMENT } from '@angular/common';
import { Component, HostBinding, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Imports } from '../../../_abstract_model/types/_types';
import { AccordionComponent, AccordionItem } from '../../../shared/elements/accordion/accordion.component';
import { ClipboardService } from '../../../shared/services/clipboard.service';

const angular_common: Imports = [];
const components: Imports = [AccordionComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatIconModule, MatMenuModule, MatTooltipModule];

@Component({
    selector: 'mho-tuto-script-tools',
    templateUrl: './tuto-script-tools.component.html',
    styleUrls: ['./tuto-script-tools.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
})
export class TutoScriptToolsComponent {
    @HostBinding('style.display') display: string = 'contents';

    public readonly title: string = $localize`Outils`;
    public readonly tuto_script_items: AccordionItem[] = [
        {
            title: $localize`Banque`,
            content: $localize`Affiche la liste des objets de la banque et leur quantité.<br /><br />
                Si vous êtes incarnés, les objets qui ne sont pas dans la liste de courses sont suivis d'un bouton présentant un caddie. Un clic sur ce bouton les ajoute à la liste de courses.`
        },
        {
            title: $localize`Camping`,
            content: $localize`Affiche un outil de prédiction des chances de survie en camping.`
        }
    ];

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
        this.tuto_script_items.forEach((item: AccordionItem): void => {
            text += `[collapse=${item.title}]${item.content.replace(/<br \/><br \/>/g, '\n')}[/collapse]\n\n`;
        });

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
