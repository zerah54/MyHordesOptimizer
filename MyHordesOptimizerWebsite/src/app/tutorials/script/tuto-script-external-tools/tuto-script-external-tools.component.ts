import { Component, ViewEncapsulation } from '@angular/core';
import { AccordionItem } from 'src/app/shared/elements/accordion/accordion.component';
import { ClipboardService } from 'src/app/shared/services/clipboard.service';

@Component({
    selector: 'mho-tuto-script-external-tools',
    templateUrl: './tuto-script-external-tools.component.html',
    styleUrls: ['./tuto-script-external-tools.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TutoScriptExternalToolsComponent {

    public readonly title: string = $localize`Outils externes`;

    public readonly header: string = $localize`Une des fonctionnalités du script est de permettre la mise à jour de plusieurs outils externes en un seul clic depuis le site de MyHordes. Pour ce faire, il faut activer les options associées dans la liste des options de MyHordes Optimizer.
    Si vous avez l'un des outils en question ouvert dans votre navigateur, alors la prochaine fois que vous naviguerez vers son onglet celui-ci sera automatiquement rafraîchi.`;

    public readonly tuto_script_items: AccordionItem[] = [
        {
            title: $localize`MyHordes Optimizer`, content: $localize`
            En cochant l'option "Mettre à jour MyHordesOptimizer", quand vous cliquerez sur le boutton "Mettre à jour les outils externes", la mise à jour de MyHordes Optimizer se fera automatiquement.
            Vous rendez également accessibles d'autres options de mise à jour avancées.
            <ul>
                <li><strong>Actions héroïques :</strong> Enregistre les actions héroïques disponibles / utilisées</li>
                <li><strong>Améliorations de la maison :</strong> Enregistre les informations concernant votre maison</li>
                <li><strong>Détail de mon sac et de ceux de mon escorte :</strong> Enregistre le contenu de votre sac ainsi que ceux de vos escortés</li>
                <li><strong>États :</strong> Enregistre vos différents états (rassasié, soif, etc... Attention : n'enregistre pas l'état goule)</li>
                <li><strong>Entregistrer les fouilles réussies :</strong> Enregistre les fouilles réussies pour restituer des statistiques sur les fouilles dans une carte dédiée</li>
            </ul>
        ` },
        {
            title: $localize`Gest'Hordes`, content: $localize`En cochant l'option "Mettre à jour Gest'Hordes", quand vous cliquerez sur le boutton "Mettre à jour les outils externes", la mise à jour de Gest'Hordes se fera automatiquement.
            Vous rendez également accessibles d'autres options de mise à jour avancées.
            <ul>
                <li><strong>Informations complémentaires sur la carte :</strong> Enregistre le nombre de zombies sur la case, et enregistre également le contenu de la case en ville dévastée</li>
                <li><strong>Actions héroïques :</strong> Enregistre les actions héroïques disponibles / utilisées</li>
                <li><strong>Améliorations de la maison :</strong> Enregistre les informations concernant votre maison</li>
                <li><strong>États :</strong> Enregistre l'état clair</li>
            </ul>
        `
        },
        {
            title: $localize`BigBroth'Hordes`, content: $localize`En cochant l'option "Mettre à jour BigBroth'Hordes", quand vous cliquerez sur le boutton "Mettre à jour les outils externes", la mise à jour de BigBroth'Hordes se fera automatiquement.`
        },
        {
            title: $localize`Fata Morgana`, content: $localize`En cochant l'option "Mettre à jour Fata Morgana", quand vous cliquerez sur le boutton "Mettre à jour les outils externes", la mise à jour de Fata Morgana se fera automatiquement.`
        },
        {
            title: $localize`Affichage des cartes issues des outils externes`, content: $localize`
            Depuis l'interface, vous pouvez cocher une option permettant d'afficher des cartes directement dans MyHordes.
            Une fois cette option cochée, vous trouverez dans les différents outils externes des boutons pour "copier" une carte, que ce soit une carte de la ville ou une carte de ruine. Une fois la carte copiée, il suffit de retourner dans MyHordes et de cliquer sur l'icône de carte pour pouvoir consulter la carte dans une fenêtre qui peut être déplacée et redimensionnée.
            <br /><br />
            Pour les cartes de BBH et de GH, vous pourrez voir votre emplacement sur la carte. La visibilité des expéditions n'est pas encore prise en compte.
            <br /><br />
            Pour la carte de la ruine, vous pouvez simuler votre emplacement en cliquant sur une des cases, ce qui fait se déplacer un point sur la carte.`
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
        text += this.header;
        text += `\n\n`;
        this.tuto_script_items.forEach((item: AccordionItem) => {
            text += `[collapse=${item.title}]${item.content.replace(/<ul>/g, '').replace(/<\/ul>/g, '').replace(/<li>/g, '[0]').replace(/<\/li>/g, '').replace(/<br \/><br \/>/g, '\n').replace(/<strong>/g, '[b]').replace(/<\/strong>/g, '[/b]')}[/collapse]\n\n`;
        })

        this.clipboard.copy(text, $localize`Le texte a bien été copié`);
    }
}
