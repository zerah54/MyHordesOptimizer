import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Imports } from '../../../_abstract_model/types/_types';
import { ClipboardService } from '../../../_core/services/clipboard.service';

const angular_common: Imports = [];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatCardModule, MatIconModule, MatMenuModule, MatTooltipModule];

/** Une étape du parcours de connexion. */
export interface FirstUseStep {
    title: string;
    text: string;
}

@Component({
    selector: 'mho-tuto-site-first-use',
    templateUrl: './tuto-site-first-use.component.html',
    styleUrls: ['./tuto-site-first-use.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TutoSiteFirstUseComponent {
    protected readonly title: string = $localize`Première utilisation du site`;

    protected readonly lead: string = $localize`Les pages du menu "Ma ville" ne s'ouvrent qu'une fois le site relié à votre compte MyHordes. Cela se fait une seule fois, en trois étapes.`;

    protected readonly steps: FirstUseStep[] = [
        {
            title: $localize`Cliquez sur "Se connecter"`,
            text: $localize`Le bouton se trouve en haut à droite de la page.`
        },
        {
            title: $localize`Autorisez MyHordes Optimizer`,
            text: $localize`Vous êtes envoyé sur MyHordes, qui vous demande d'autoriser MyHordes Optimizer à lire vos informations de jeu.`
        },
        {
            title: $localize`C'est prêt`,
            text: $localize`Vous revenez ici connecté, et le menu "Ma ville" se débloque.`
        }
    ];

    protected readonly note: string = $localize`Cette autorisation remplace la saisie manuelle de l'identifiant externe pour les applications, qui se trouvait dans la page de votre âme sur MyHordes, onglet "Avancé".`;

    private readonly clipboard: ClipboardService = inject(ClipboardService);
    private readonly document: Document = inject<Document>(DOCUMENT);

    protected copyUrl(): void {
        const url: string = this.document.location.href;
        this.clipboard.copy(url, $localize`Le lien a bien été copié`);
    }

    protected shareForum(): void {
        const steps: string = this.steps
            .map((step: FirstUseStep, index: number): string => `[b]${index + 1}. ${step.title}[/b]\n${step.text}`)
            .join('\n\n');

        const text: string = `[b][big]${this.title}[/big][/b]\n\n${this.lead}\n\n${steps}\n\n[i]${this.note}[/i]`;

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
