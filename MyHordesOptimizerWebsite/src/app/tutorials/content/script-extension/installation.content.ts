import { TutorialPage } from '../../_model/tutorial.model';
import { CHROME_EXTENSION_URL, externalLink, FIREFOX_EXTENSION_URL, SCRIPT_DOWNLOAD_URL } from '../links';

const script_link: string = externalLink(SCRIPT_DOWNLOAD_URL, $localize`lien de téléchargement du script`);
const firefox_link: string = externalLink(FIREFOX_EXTENSION_URL, $localize`page de l'extension Firefox`);
const chrome_link: string = externalLink(CHROME_EXTENSION_URL, $localize`page de l'extension sur le Chrome Web Store`);

const after_install: string = $localize`Une fois l'installation faite, rafraîchissez la page du jeu : un bouton MyHordes Optimizer apparaît dans le bandeau en haut de la page. Voir le tutoriel « Prise en main » pour la suite.`;

export const SCRIPT_EXTENSION_INSTALLATION: TutorialPage = {
    title: $localize`Installation`,
    lead: $localize`MyHordes Optimizer s'installe dans votre navigateur, au choix sous forme d'extension (recommandé : elle se met à jour toute seule) ou de script. N'installez pas les deux à la fois.`,
    sections: [
        {
            title: $localize`Extension de navigateur (recommandé)`,
            items: [
                {
                    title: 'Firefox',
                    content: $localize`<p>Rendez-vous sur la ${firefox_link}:link: et cliquez sur « Ajouter à Firefox ».</p>
                        <p>Firefox pour Android accepte aussi les extensions : ouvrez la même page depuis Firefox sur votre téléphone.</p>`
                },
                {
                    title: $localize`Chrome, Edge, Opera, Brave`,
                    content: $localize`<p>Rendez-vous sur la ${chrome_link}:link: et cliquez sur « Ajouter à Chrome ». Les navigateurs construits sur Chromium utilisent la même page :</p>
                        <ul>
                            <li><strong>Brave</strong> : directement ;</li>
                            <li><strong>Edge</strong> : autorisez d'abord les extensions provenant d'autres boutiques (bandeau affiché par Edge sur la page) ;</li>
                            <li><strong>Opera</strong> : installez d'abord le module « Install Chrome Extensions » proposé par Opera.</li>
                        </ul>`
                }
            ],
            outro: after_install
        },
        {
            title: $localize`Script`,
            intro: $localize`Le script a besoin d'un gestionnaire de scripts (Tampermonkey, Violentmonkey…). Il se met à jour par ce gestionnaire.`,
            items: [
                {
                    title: $localize`Ordinateur`,
                    content: $localize`<ul>
                            <li>Installez le gestionnaire de scripts de votre choix, par exemple Tampermonkey ou Violentmonkey ;</li>
                            <li>cliquez sur le ${script_link}:link: ;</li>
                            <li>confirmez l'installation dans la page qui s'ouvre.</li>
                        </ul>`
                },
                {
                    title: 'Android',
                    content: $localize`<p>Sur Android, l'extension pour Firefox est le plus simple (voir plus haut). Pour le script :</p>
                        <ul>
                            <li>installez Firefox pour Android ;</li>
                            <li>dans Firefox, ajoutez le module Tampermonkey ou Violentmonkey ;</li>
                            <li>cliquez sur le ${script_link}:link: ;</li>
                            <li>confirmez l'installation dans la page qui s'ouvre.</li>
                        </ul>`
                },
                {
                    title: 'iOS',
                    content: $localize`<ul>
                            <li>Téléchargez l'application « Userscripts » ;</li>
                            <li>ouvrez l'application « Raccourcis » ;</li>
                            <li>appuyez sur le bouton « + » en haut à droite pour créer un nouveau raccourci ;</li>
                            <li>recherchez l'action « Obtenir le contenu de l'URL » et ajoutez-la ;</li>
                            <li>recherchez l'action « Enregistrer le fichier » et ajoutez-la ;</li>
                            <li>configurez l'action « Obtenir le contenu de l'URL » en remplaçant la valeur du paramètre « URL » par « Entrée de raccourci » ;</li>
                            <li>configurez l'action « Recevoir l'entrée » en remplaçant la valeur du premier paramètre « Images et 18 de plus » par « URL » uniquement ;</li>
                            <li>configurez l'action « Recevoir l'entrée » en remplaçant la valeur du second paramètre « Nulle part » par « Dans la feuille de partage » ;</li>
                            <li>terminez la création du raccourci avec le bouton « OK » en haut à droite ;</li>
                            <li>enregistrez le fichier disponible sur le ${script_link}:link: par un appui long sur le lien, puis « Partager… » et l'action « Enregistrer le fichier » ;</li>
                            <li>autorisez l'action « Enregistrer le fichier » à envoyer 1 élément de l'app Safari vers « github.com » ;</li>
                            <li>dans l'onglet « Explorer », choisissez « Sur mon iPhone », puis le dossier « Userscripts », et validez avec « Ouvrir » en haut à droite ;</li>
                            <li>ouvrez l'application « Fichiers » et retournez dans le dossier « Userscripts » (« Explorer » &gt; « Sur mon iPhone » &gt; « Userscripts ») ;</li>
                            <li>appuyez sur « … » en haut à droite, choisissez « Options de présentation » et activez « Afficher toutes les extensions de fichiers » ;</li>
                            <li>renommez « my_hordes_optimizer.user.txt » en « my_hordes_optimizer.user.js » et confirmez avec « Utiliser .js » ;</li>
                            <li>dans Safari, appuyez sur « Aa » dans la barre de recherche, puis « Gérer les extensions », et activez « Userscripts » ;</li>
                            <li>appuyez de nouveau sur « Aa », puis sur « Userscripts », et vérifiez que « MyHordes Optimizer » est activé.</li>
                        </ul>`
                }
            ],
            outro: after_install
        },
        {
            title: $localize`Bon à savoir`,
            items: [
                {
                    title: $localize`Script ou extension, pas les deux`,
                    content: $localize`<p>Si le script et l'extension sont installés en même temps, le second à démarrer s'arrête et affiche « MHO Addon : double installation détectée ». Gardez l'extension et désinstallez le script depuis votre gestionnaire de scripts.</p>`
                },
                {
                    title: $localize`Identifiant externe obligatoire`,
                    content: $localize`<p>MyHordes Optimizer lit vos données de jeu avec votre <strong>identifiant externe pour les apps</strong>. Sans lui, le panneau n'affiche qu'un message d'aide. Il est en général récupéré automatiquement : voir « Prise en main ».</p>`
                },
                {
                    title: $localize`Mises à jour`,
                    content: $localize`<p>L'extension se met à jour par la boutique de votre navigateur, le script par votre gestionnaire de scripts. Quand une nouvelle version existe, le panneau affiche « Mise à jour disponible » et une pastille apparaît sur le bouton MyHordes Optimizer.</p>`
                }
            ]
        }
    ]
};
