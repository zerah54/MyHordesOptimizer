import { TutorialPage } from '../../_model/tutorial.model';

export const DISCORD_BOT_COMMANDS: TutorialPage = {
    title: $localize`Commandes`,
    lead: $localize`Les commandes sont données sous leur nom anglais, puis français ; les options sous leur nom anglais (sur un Discord en français : message-privé, texte, langue, jour…). Beaucoup de commandes ont l'option <strong>private-msg</strong> : la réponse n'est alors visible que de vous, ou vous est envoyée en message privé (il faut accepter les messages privés du bot). Le bot répond dans la langue de votre Discord (français, anglais, allemand ou espagnol ; anglais pour les autres langues).`,
    sections: [
        {
            title: $localize`Jeu`,
            items: [
                {
                    title: $localize`/attack get (/attaque récupérer)`,
                    content: $localize`<p>Affiche les estimations d'attaque enregistrées dans MyHordes Optimizer pour une ville et un jour : l'attaque calculée, puis les estimations du planificateur (veille) et de la tour de guet (jour J), palier par palier.</p>
                        <p>Options : <strong>town-id</strong> (identifiant de la ville), <strong>day</strong> (jour), private-msg (envoi en message privé).</p>`
                },
                {
                    title: $localize`/recipe (/recette)`,
                    content: $localize`<p>Cherche les recettes d'assemblage (à la main) qui produisent un objet, puis celles qui produisent ses composants. Options : <strong>text</strong> (nom de l'objet, même partiel), <strong>language</strong> (langue du nom, obligatoire), private-msg. Si les recettes sont trop nombreuses pour un message, la fin est tronquée et le bot l'indique.</p>`
                },
                {
                    title: $localize`/translate (/traduire)`,
                    content: $localize`<p>Traduit un texte du jeu dans les quatre langues, à partir des fichiers de traduction de MyHordes. Options : <strong>language</strong> (langue du texte), <strong>text-to-translate</strong>, <strong>only-exact-match</strong> (vrai par défaut : seulement les textes identiques), private-msg. Plusieurs résultats se parcourent avec « Précédent » et « Suivant ».</p>`
                },
                {
                    title: $localize`/glossary (/glossaire)`,
                    content: $localize`<p>Donne la définition d'un sigle ou d'un mot du jargon de MyHordes (AA, AE…). Le mot doit être exact (majuscules et accents indifférents). Options : <strong>text</strong>, <strong>language</strong> (toutes par défaut), private-msg.</p>`
                },
                {
                    title: $localize`/faq`,
                    content: $localize`<ul>
                            <li><strong>website</strong> (site-web) : lien vers le site ;</li>
                            <li><strong>addon</strong> : liens vers le tutoriel d'installation, les extensions Chrome et Firefox et le script ;</li>
                            <li><strong>become-ghoul</strong> (devenir-goule) : les façons de devenir goule et leurs chances ;</li>
                            <li><strong>mse</strong> (résultats-mse) : les résultats de la consommation de MSE ;</li>
                            <li><strong>camping-phrases</strong> (phrases-de-camping) : les phrases du jeu pour chaque palier de chances de survie en camping, dans la langue choisie (à défaut, celle de votre Discord) ;</li>
                            <li><strong>discord-cheat-sheet</strong> (mise-en-forme-discord) : aide-mémoire de la mise en forme des messages Discord.</li>
                        </ul>
                        <p>Toutes acceptent private-msg (réponse visible de vous seul).</p>`
                }
            ]
        },
        {
            title: $localize`Rappels`,
            items: [
                {
                    title: $localize`/aa (/anti-abus)`,
                    content: $localize`<p>Lance un compteur de 15 minutes, la durée de l'anti-abus de la banque. À l'échéance, le bot vous mentionne dans le salon. Avec <strong>private-msg</strong>, il vous prévient par message privé.</p>
                        <p>Si le bot ne peut pas écrire dans le salon (conversation privée entre joueurs, serveur où il n'est pas installé, salon sans droit d'écriture), la notification part aussi en message privé : autorisez les messages privés du bot. La confirmation indique où elle arrivera.</p>`
                },
                {
                    title: $localize`/timer (/minuteur)`,
                    content: $localize`<p>Lance un compteur de la durée de votre choix, avec un motif : le bot vous mentionne avec ce motif à l'échéance. Options : <strong>time</strong> (durée), <strong>reason</strong> (motif, 1000 caractères au plus), private-msg. La notification arrive au même endroit que pour /aa ; sous 14 minutes, elle répond directement à la commande (visible de vous seul avec private-msg).</p>
                        <p>Format de la durée : des nombres suivis d'une unité, par exemple <code>1h 25m 12s</code>, espaces facultatifs, chaque unité une seule fois. Unités : <code>Y</code> années, <code>M</code> mois, <code>D</code> jours, <code>h</code> heures, <code>m</code> minutes, <code>s</code> secondes. Seuls <code>M</code> (mois) et <code>m</code> (minutes) dépendent de la casse.</p>
                        <p>Les compteurs survivent à un redémarrage du bot : un compteur arrivé à échéance pendant une interruption est envoyé au retour, avec la mention du retard. 20 compteurs en cours au plus par personne.</p>`
                }
            ]
        },
        {
            title: $localize`Divers`,
            items: [
                {
                    title: $localize`/play (/jouer)`,
                    content: $localize`<p>Remplace les balises d'un texte par des tirages au hasard, visibles de tous : <code>{d6}</code> (dé à 4, 6, 8, 10, 12, 20 ou 100 faces), <code>{pfc}</code> (pierre-feuille-ciseaux), <code>{pf}</code> (pile ou face), <code>{carte}</code> (carte à jouer), <code>{lettre}</code>, <code>{voyelle}</code>, <code>{consonne}</code>. Les balises existent aussi en anglais, allemand et espagnol (<code>{dice6}</code>, <code>{coin}</code>, <code>{card}</code>…).</p>`
                },
                {
                    title: $localize`/instructions`,
                    content: $localize`<p>Rédige des consignes mises en forme et les publie dans le salon, au nom du bot. Un éditeur visible de vous seul permet d'ajouter un titre, une description et des sections, puis « Publier les consignes ». Réservée par défaut aux administrateurs du serveur (réglable dans Paramètres du serveur &gt; Intégrations) ; le bot doit être présent sur le serveur.</p>`
                },
                {
                    title: $localize`/suggestion et /bug`,
                    content: $localize`<p>Ouvrent un formulaire (titre et détails) et publient votre suggestion ou votre signalement de bug sur le serveur de MyHordes Optimizer, en vous mentionnant.</p>`
                }
            ]
        }
    ]
};
