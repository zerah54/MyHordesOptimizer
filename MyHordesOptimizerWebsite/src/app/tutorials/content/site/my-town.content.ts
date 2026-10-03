import { TutorialPage } from '../../_model/tutorial.model';

export const SITE_MY_TOWN: TutorialPage = {
    title: $localize`Ma ville`,
    lead: $localize`Les pages de « Ma ville » rassemblent ce que la ville sait d'elle-même : carte, banque, citoyens, liste de courses, statistiques et expéditions. Elles apparaissent dans le menu quand vous êtes connecté et incarné dans une ville.`,
    sections: [
        {
            title: $localize`Avant de commencer`,
            items: [
                {
                    title: $localize`D'où viennent les données`,
                    content: $localize`<ul>
                            <li><strong>Le bouton « Mettre à jour »</strong> de l'en-tête lit votre ville dans l'API de MyHordes et l'enregistre dans MyHordes Optimizer. Il ne met à jour que MyHordes Optimizer : Gest'Hordes et Fata Morgana se mettent à jour depuis l'extension. La page affichée n'est pas rechargée : actualisez-la une fois la mise à jour terminée.</li>
                            <li><strong>L'extension</strong> envoie, depuis les pages du jeu, ce que l'API ne donne pas (voir les tutoriels de l'extension).</li>
                            <li><strong>Les saisies</strong> faites sur le site par les citoyens de la ville.</li>
                        </ul>
                        <p>Une icône d'ancienneté accompagne la plupart des données : son survol indique qui les a mises à jour et quand.</p>`
                },
                {
                    title: $localize`Réglages mémorisés`,
                    content: $localize`<p>Vos choix d'affichage (options de la carte, affichage de la banque et des citoyens, mode édition…) sont mémorisés dans votre navigateur, pour toutes vos villes.</p>`
                }
            ]
        },
        {
            title: $localize`Carte`,
            items: [
                {
                    title: $localize`Se déplacer`,
                    content: $localize`<ul>
                            <li>Zoom : boutons − et +, Ctrl + molette, ou pincement sur un écran tactile ; « Ajuster à l'écran » affiche toute la carte ;</li>
                            <li>« Ma position » centre la carte sur votre case ;</li>
                            <li>glissez la carte à la souris pour la déplacer ;</li>
                            <li>en zoom réduit, seul le coin bas droite des cases reste affiché ; en zoom fort, l'illustration des bâtiments apparaît.</li>
                        </ul>`
                },
                {
                    title: $localize`Types de carte`,
                    content: $localize`<p>Le bouton « Affichage » ouvre les réglages. « Type de carte » choisit ce que représente la couleur des cases :</p>
                        <ul>
                            <li><strong>Fouilles</strong> : les fouilles restantes estimées, en « Moyenne » ou au « Maximum ». La légende reprend les paliers du jeu : zone épuisée (0), presque épuisée (1 à 2), à moitié vide (3 à 6), abondante (7 et plus) ;</li>
                            <li><strong>Danger</strong> : le niveau de danger, seulement pour les cases visitées aujourd'hui ; les autres sont grisées. La légende reprend les termes du jeu : aucun zombie, zombies isolés (1 à 2), meute (3 à 5), horde (6 et plus) ;</li>
                            <li><strong>Exploration</strong> : le niveau d'exploration relevé par un éclaireur (secteur peu connu, partiellement repéré, connu, totalement balisé), connu seulement pour les cases mises à jour par un éclaireur avec l'extension ; les autres sont grisées. Le coin bas droite montre les zombies, ou l'estimation d'un éclaireur quand elle est plus récente.</li>
                        </ul>`
                },
                {
                    title: $localize`Fouilles restantes`,
                    content: $localize`<p>MyHordes Optimizer tient pour chaque case une estimation de ce qu'il reste à trouver, en moyenne et au maximum :</p>
                        <ul>
                            <li>une case <strong>vue épuisée</strong> (par l'API, la note « zone épuisée » du jeu, un fouineur ou une saisie) passe à 0 et est hachurée ;</li>
                            <li>le <strong>niveau d'abondance</strong> relevé par un fouineur ramène l'estimation dans la fourchette du jeu ;</li>
                            <li>chaque <strong>fouille réussie</strong> enregistrée la fait baisser ;</li>
                            <li>chaque nuit, la <strong>régénération</strong> la fait remonter selon la direction du vent (connue grâce au scrutateur) et le niveau du scrutateur ; une case vue épuisée reste hachurée tant que personne n'a constaté qu'elle s'est remplie ;</li>
                            <li>une case vue vide puis retrouvée pleine prouve une régénération : l'estimation est recalculée en conséquence ;</li>
                            <li>une <strong>excavation</strong> de fouineur remplit la case (icône de fouineur, si le coin « Zone excavée » est affiché).</li>
                        </ul>
                        <p>« Maximum » est la valeur la plus haute possible, « Moyenne » la plus probable.</p>`
                },
                {
                    title: $localize`Lire une case`,
                    content: $localize`<ul>
                            <li>Un carré marque chaque bâtiment ; par-dessus, une icône signale un bâtiment enseveli ou une ruine explorable, et une pastille un plan à récupérer (peu commun à moins de 10 km, rare au-delà). Le nombre de tas restant à déblayer d'un bâtiment enseveli est toujours affiché en bas à droite de son icône. Un bâtiment vide est atténué ;</li>
                            <li>un repère signale votre case ; la ligne et la colonne de la case choisie sont surlignées ;</li>
                            <li>au survol, une bulle résume la case : zombies (et estimation d'un éclaireur), zombies tués, points de contrôle, relevés des métiers, zone excavée, citoyens, objets au sol et date de mise à jour.</li>
                        </ul>`
                },
                {
                    title: $localize`Coins des cases`,
                    content: $localize`<p>Dans « Affichage », « Coins des cases » choisit l'information de chacun des quatre coins, pour le type de carte affiché. Le réglage se présente comme une case coupée en quatre : cliquez sur le quart du coin à changer, puis choisissez dans la liste : note, citoyens présents, points de contrôle, zombies (en italique quand c'est l'estimation d'un éclaireur plus récente), zombies tués, fouilles restantes, fouilles réussies enregistrées, zone excavée, objets au sol, distance en km ou en PA, ancienneté de la mise à jour. « Réinitialiser » rétablit la disposition d'origine.</p>`
                },
                {
                    title: $localize`Zones du scrutateur et zones en distance`,
                    content: $localize`<ul>
                            <li><strong>Afficher les zones du scrutateur</strong> : choisissez une ou plusieurs directions sur la rose des vents pour tracer la limite des zones de régénération correspondantes (une direction cochée est foncée, une direction décochée grise ; le point central coche ou décoche tout) ;</li>
                            <li><strong>Afficher les zones en distance</strong> : « Ajouter une zone » trace la limite d'une distance en km ou en PA (en PA, « Aller / Retour » divise la distance par deux). Chaque zone ajoutée se retire avec sa corbeille.</li>
                        </ul>`
                },
                {
                    title: $localize`Mettre à jour une zone`,
                    content: $localize`<p>Un clic sur une case ouvre son détail ; « Mettre à jour la zone » ouvre la fenêtre de saisie :</p>
                        <ul>
                            <li><strong>Cellule</strong> : zombies, zombies tués, « Zone épuisée », relevés des métiers (abondance du fouineur, exploration de l'éclaireur, et leurs radars sur les cases voisines), objets au sol ;</li>
                            <li><strong>Bâtiment</strong> : nombre de tas d'un bâtiment enseveli, « Bâtiment vide », objets trouvables et, pour un bâtiment enseveli, les bâtiments possibles à cette distance ;</li>
                            <li><strong>Citoyens</strong> : citoyens présents, leur sac et leurs actions héroïques ;</li>
                            <li><strong>Notes</strong> : une note sur la case, visible par toute la ville (c'est celle du coin « Note ») ;</li>
                            <li><strong>Fouilles</strong> : fouilles réussies et totales de chaque citoyen, jour par jour.</li>
                        </ul>
                        <p>« Enregistrer » envoie tout, la fenêtre reste ouverte. « Fermer » sans enregistrer abandonne les modifications.</p>`
                }
            ]
        },
        {
            title: $localize`Banque`,
            items: [
                {
                    title: $localize`Consulter la banque`,
                    content: $localize`<p>Les objets de la banque, par catégorie, en affichage « Détaillé » ou « Condensé ». Chaque ouverture de la page relit la banque dans MyHordes. « Filtrer » cherche par nom ; « Chercher des objets par propriétés » garde les objets qui ont au moins une des propriétés choisies. Un clic sur un objet ouvre sa fiche.</p>`
                }
            ]
        },
        {
            title: $localize`Citoyens`,
            items: [
                {
                    title: $localize`Onglet Citoyens`,
                    content: $localize`<ul>
                            <li>Affichage « Groupé » ou « Colonnes » ; « Trier par » (un nouveau clic inverse puis retire le tri) ; « Filtres » (nom, métier, sac, états, potions, immunité, actions quotidiennes et héroïques, améliorations ; « Réinitialiser »). Une case à trois états vaut oui, non, ou indifférent ;</li>
                            <li>l'icône de copie copie les noms ou les identifiants MyHordes des citoyens filtrés ;</li>
                            <li>sac, coffre, états, potions, immunité, actions et améliorations se modifient directement, pour n'importe quel citoyen vivant : chaque clic est enregistré ;</li>
                            <li>un clic sur un citoyen ouvre son profil ; la dernière colonne donne la date des dernières mises à jour ;</li>
                            <li>les morts sont listés à part : cause, jours de survie, points d'âme, derniers mots, pictos gagnés dans la ville et une note privée sur eux.</li>
                        </ul>`
                },
                {
                    title: $localize`Onglet Fouilles`,
                    content: $localize`<p>Les fouilles de chaque citoyen, jour par jour. « + » ajoute une fouille au jour affiché : renseignez sa position (la ville est en 0/0), les fouilles réussies et totales, puis enregistrez. Chaque fouille se modifie ou se supprime.</p>`
                },
                {
                    title: $localize`Onglet Actions quotidiennes`,
                    content: $localize`<p>Bain, douche, ménage et sieste de chaque citoyen, jour par jour. Chaque bascule est enregistrée aussitôt.</p>`
                }
            ]
        },
        {
            title: $localize`Liste de courses`,
            items: [
                {
                    title: $localize`Lire la liste`,
                    content: $localize`<p>La liste est commune à toute la ville. Pour chaque objet : dépôt, zone (distance en PA), quantités en banque, dans les sacs, dans les coffres (le survol donne les citoyens) et sur la carte, stock souhaité (∞ possible) et quantité manquante (souhaitée moins banque et sacs). Une ligne satisfaite est atténuée.</p>
                        <p>Le bouton de partage copie la liste au format forum. « Import / Export » l'enregistre dans un fichier Excel ou la remplace par un fichier Excel.</p>`
                },
                {
                    title: $localize`Modifier la liste`,
                    content: $localize`<p>Activez « Mode édition » :</p>
                        <ul>
                            <li>« Ajouter un objet », dans la zone choisie (∞ pour toutes) ;</li>
                            <li>glissez les lignes pour les ordonner, changez dépôt, zone ou stock souhaité, supprimez une ligne ;</li>
                            <li>chaque modification est enregistrée automatiquement ;</li>
                            <li>une icône ⚠ signale le même objet deux fois dans la même zone : tant qu'il reste un doublon, la liste n'est pas enregistrée.</li>
                        </ul>`
                }
            ]
        },
        {
            title: $localize`Statistiques`,
            items: [
                {
                    title: $localize`Estimations`,
                    content: $localize`<p>Choisissez le jour, puis saisissez les estimations de la tour de guet (attaque du jour, de 33 à 100 %) et du planificateur (attaque du lendemain, de 0 à 100 %). Coller « X à Y » dans un champ remplit le minimum et le maximum. <strong>Cliquez sur « Enregistrer »</strong> : rien n'est enregistré sans lui. Le bouton de partage copie les estimations au format forum.</p>
                        <p>À droite, l'attaque calculée à partir de ces estimations (jour ou lendemain), la valeur la plus probable et la moyenne, les bornes théoriques du jour et la répartition de l'attaque.</p>`
                },
                {
                    title: $localize`Scrutateur`,
                    content: $localize`<p>Pour chaque jour, la direction de la régénération, le niveau du scrutateur et le taux de régénération, avec leur répartition en graphiques.</p>`
                },
                {
                    title: $localize`Registre`,
                    content: $localize`<p>Collez le contenu d'un registre (en français, anglais, allemand ou espagnol) pour l'analyser : dés, cartes et ballon, mouvements de la banque, prises au puits, fouilles, entrées et sorties, télescope, utilisation des chantiers. Les joueurs s'affichent par pseudo ou par identifiant MyHordes. Rien n'est enregistré, sauf dans l'onglet « Fouilles » : il estime les fouilles de chaque citoyen présent dans le registre ; indiquez la position (0/0 par défaut) et enregistrez.</p>`
                }
            ]
        },
        {
            title: $localize`Expéditions`,
            items: [
                {
                    title: $localize`Consulter et s'inscrire`,
                    content: $localize`<p>Un onglet par jour, jusqu'au lendemain ; les jours passés ne se modifient plus. Les modifications des autres s'affichent en direct, et les avatars en haut montrent qui consulte la page. Chaque expédition indique si elle est « Prête » ou « En préparation ».</p>
                        <p>Sur une expédition prête, « M'inscrire ici » vous inscrit sur une place libre (si son métier est libre ou est le vôtre). Votre soif et vos points de contrôle restent modifiables. Les consignes à cocher se cochent directement. Le bouton de partage copie les expéditions au format forum.</p>`
                },
                {
                    title: $localize`Organiser (mode édition)`,
                    content: $localize`<ul>
                            <li>« Créer une expédition », avec son nom, les points de contrôle requis et la bascule « Expédition prête » ;</li>
                            <li>chaque expédition a une ou plusieurs parties (nom du tracé, direction) ; chaque partie a ses places : métier préinscrit, citoyen, soif, départ à 7 PA, points de contrôle, action héroïque, consignes personnelles et sac ;</li>
                            <li>un citoyen placé dans la première partie est recopié dans les places libres des parties suivantes ;</li>
                            <li>« Consignes de l'expédition » : consignes en texte ou à cocher, réordonnables ;</li>
                            <li>le menu ⋮ permet d'« Importer le jour » (recopier les expéditions d'un jour précédent) et de « Réorganiser » par glisser-déposer.</li>
                        </ul>`
                }
            ]
        }
    ]
};
