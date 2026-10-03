import { TutorialPage } from '../../_model/tutorial.model';
import { DISCORD_BOT_INSTALL_URL, DISCORD_SERVER_URL, externalLink } from '../links';

const install_link: string = externalLink(DISCORD_BOT_INSTALL_URL, $localize`lien d'installation`);
const support_link: string = externalLink(DISCORD_SERVER_URL, $localize`serveur Discord de MyHordes Optimizer`);

export const DISCORD_BOT_INSTALLATION: TutorialPage = {
    title: $localize`Installation`,
    lead: $localize`Le bot Discord de MyHordes Optimizer répond à des commandes « / ». Aucune liaison de compte n'est nécessaire.`,
    sections: [
        {
            items: [
                {
                    title: $localize`En tant qu'application (recommandé)`,
                    content: $localize`<p>Installé comme application, le bot vous suit partout sur Discord : en messages privés, dans les groupes et sur les serveurs, même ceux où il n'est pas présent. Sur un serveur qui limite les applications externes, ses réponses peuvent n'être visibles que de vous.</p>
                        <p>Cliquez sur le ${install_link}:link: et choisissez « Ajouter à mes applications ».</p>`
                },
                {
                    title: $localize`Sur un serveur`,
                    content: $localize`<p>Ajouté à un serveur, le bot est disponible pour tous ses membres. Il faut la permission « Gérer le serveur ». C'est nécessaire pour publier des consignes avec /instructions.</p>
                        <p>Cliquez sur le ${install_link}:link: et choisissez « Ajouter à un serveur ».</p>`
                },
                {
                    title: $localize`Langues`,
                    content: $localize`<p>Les commandes portent leur nom en français, en allemand ou en anglais selon la langue de votre Discord (en anglais pour les autres langues). Les réponses du bot sont en français.</p>`
                },
                {
                    title: $localize`Besoin d'aide ?`,
                    content: $localize`<p>Les commandes /suggestion et /bug transmettent vos idées et vos problèmes à l'équipe. Vous pouvez aussi venir en parler sur le ${support_link}:link:.</p>`
                }
            ]
        }
    ]
};
