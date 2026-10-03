import { TutorialPage } from '../../_model/tutorial.model';

export const SITE_ACCOUNT: TutorialPage = {
    title: $localize`Compte et préférences`,
    sections: [
        {
            items: [
                {
                    title: $localize`Connexion`,
                    content: $localize`<p>« Se connecter », dans l'en-tête, vous envoie sur MyHordes pour autoriser MyHordes Optimizer, puis vous ramène sur le site, connecté. Aucun mot de passe n'est demandé par le site. Voir aussi le tutoriel « Première utilisation ».</p>
                        <p>Une fois connecté, votre avatar et votre pseudo remplacent le bouton ; s'y ajoute, si vous êtes incarné, la pastille de votre ville (nom, jour, type, chaos ou dévastation). Sur un écran étroit, la barre se resserre : le pseudo et le type de ville passent en infobulle, et sur téléphone la pastille rejoint le haut du menu.</p>`
                },
                {
                    title: $localize`Recherche`,
                    content: $localize`<p>Le champ « Rechercher… » de l'en-tête trouve une page du site, un objet, un chantier, un bâtiment, avec une ville active un citoyen, et dans l'annuaire un joueur ou une ville. Les majuscules et les accents ne comptent pas ; les noms qui commencent par ce que vous tapez passent en premier, cinq résultats par groupe.</p>
                        <ul>
                            <li><strong>Raccourci</strong> : <code>/</code> ou <code>Ctrl + K</code>, depuis n'importe quelle page, tant que vous n'êtes pas déjà dans un champ de saisie ;</li>
                            <li><strong>Clavier</strong> : les flèches parcourent les résultats, Entrée ouvre le résultat choisi, Échap ferme la liste puis efface la saisie ;</li>
                            <li><strong>Plus de résultats</strong> : la dernière ligne d'un groupe (ou son compteur) affiche le reste du groupe ; pour les joueurs et les villes, les 50 premiers ;</li>
                            <li><strong>Sigles</strong> : un sigle du glossaire tapé en entier est développé, par exemple <code>GCEM</code> trouve le Gros coffre en métal ;</li>
                            <li><strong>Joueurs et villes</strong> : cherchés dans l'annuaire à partir de deux lettres, dès que vous arrêtez de taper ; un joueur de votre ville apparaît parmi les citoyens ;</li>
                            <li><strong>Résultat</strong> : la page s'ouvre sur l'élément — fiche de l'objet, chantier déplié et surligné, ligne du bâtiment ou du citoyen surlignée, profil du joueur, ville (la vôtre, ou une autre en observation).</li>
                        </ul>
                        <p>Sur un écran étroit ou un téléphone, la loupe de l'en-tête ouvre le champ par-dessus la barre.</p>`
                },
                {
                    title: $localize`Mon citoyen`,
                    content: $localize`<p>Si vous êtes incarné, le menu de votre avatar donne accès à votre citoyen : états et potions, sac, actions quotidiennes du jour, actions héroïques et améliorations de la maison. Chaque modification est enregistrée aussitôt. Le niveau d'habitation vient de MyHordes et ne se modifie pas, sauf en ville privée sans accès à l'API.</p>`
                },
                {
                    title: $localize`Mon compte`,
                    content: $localize`<p>« Mon compte » ouvre votre profil : vos villes et vos pictos. « Importer mes données » récupère votre historique depuis MyHordes ; l'import est long, et il n'est pas possible de le relancer juste après.</p>
                        <p>« Déconnexion » vous déconnecte de ce navigateur.</p>`
                },
                {
                    title: $localize`Langue, thème et mode`,
                    content: $localize`<p>En bas du menu :</p>
                        <ul>
                            <li><strong>Langue</strong> : English, Français, Español, Deutsch. La page se recharge ;</li>
                            <li><strong>Thème</strong> : Par défaut, Rose, Brun. En saison, le thème Noël (du 1er au 25 décembre) ou Halloween (du 15 octobre au 1er novembre) s'ajoute, et « Par défaut » l'utilise ; Noël est toujours clair, Halloween toujours sombre ;</li>
                            <li><strong>Mode</strong> : clair, sombre, ou selon le système.</li>
                        </ul>
                        <p>Ces choix sont mémorisés dans votre navigateur. Le pied du menu mène aussi au Discord, à Crowdin (pour traduire le site) et aux remerciements.</p>`
                }
            ]
        }
    ]
};
