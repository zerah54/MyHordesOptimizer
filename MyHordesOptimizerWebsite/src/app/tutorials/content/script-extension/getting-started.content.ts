import { TutorialPage } from '../../_model/tutorial.model';
import { DISCORD_SERVER_URL, externalLink } from '../links';

const discord_link: string = externalLink(DISCORD_SERVER_URL, $localize`serveur Discord`);

export const SCRIPT_EXTENSION_GETTING_STARTED: TutorialPage = {
    title: $localize`Prise en main`,
    lead: $localize`Tout passe par le bouton MyHordes Optimizer ajouté au bandeau du jeu : les options, le Wiki, les outils et les informations sur les versions.`,
    sections: [
        {
            items: [
                {
                    title: $localize`Le bouton et son panneau`,
                    content: $localize`<p>Le bouton se trouve dans le bandeau en haut des pages de MyHordes. Au survol, il ouvre le panneau ; sur un écran tactile, appuyez dessus, et refermez le panneau avec la croix.</p>
                        <p>En haut du panneau, le lien « Site web » ouvre ce site. En dessous : les boutons « Wiki » et « Outils », qui ouvrent une fenêtre à onglets par-dessus le jeu (voir les tutoriels du même nom), les paramètres et les informations.</p>`
                },
                {
                    title: $localize`L'identifiant externe pour les apps`,
                    content: $localize`<p>MyHordes Optimizer a besoin de votre identifiant externe pour les apps. Il est lu automatiquement dans vos réglages MyHordes. S'il n'a pas pu l'être, le panneau affiche « Vous devez posséder un ID externe pour les apps » et vous demande de le créer ou de le saisir.</p>
                        <ul>
                            <li>Pour le créer : « Votre âme » &gt; « Réglages » &gt; « Avancés » &gt; « Applications externes » ;</li>
                            <li>pour le changer ensuite : dans le panneau, « Modifier mon ID externe pour les apps ». Un champ vide le supprime.</li>
                        </ul>
                        <p>Tant qu'il manque, le Wiki, les outils et les options ne sont pas proposés.</p>`
                },
                {
                    title: $localize`Les paramètres`,
                    content: $localize`<ul>
                            <li>Cocher une option coche aussi toutes ses sous-options ; la décocher les décoche.</li>
                            <li>Sur ordinateur, les sous-options s'affichent au survol d'une option cochée. Sur mobile, un appui sur le libellé coche l'option, un appui sur la flèche ▶ ouvre ou ferme ses sous-options.</li>
                            <li>« Tout cocher » active toutes les options d'un coup.</li>
                            <li>Le bouton « Aide » d'une option affiche son explication, le bouton « Configurer » ses réglages quand elle en a (styles du forum).</li>
                            <li>Les options sont enregistrées dans votre navigateur : elles ne suivent pas d'un appareil ou d'un navigateur à l'autre.</li>
                            <li>La langue de MyHordes Optimizer est celle de la page MyHordes.</li>
                        </ul>`
                },
                {
                    title: $localize`Les informations`,
                    content: $localize`<ul>
                            <li><strong>Notes de version</strong> : ce qui a changé dans la version installée, avec un lien vers les versions plus anciennes. Une pastille violette sur le bouton signale des notes pas encore lues ; un bandeau les annonce après chaque mise à jour.</li>
                            <li><strong>Mise à jour disponible</strong> : n'apparaît que si une version plus récente existe, avec une pastille rose sur le bouton. Le lien mène à la page de mise à jour de votre extension ou de votre script.</li>
                            <li><strong>Des bugs ? Des idées ?</strong> : lien vers le ${discord_link}:link: de MyHordes Optimizer.</li>
                            <li><strong>Modifier mon ID externe pour les apps</strong> : voir plus haut.</li>
                        </ul>
                        <p>En cas d'erreur de communication avec MyHordes Optimizer, le message indique la version installée et la version à jour.</p>`
                }
            ]
        }
    ]
};
