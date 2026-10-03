import { TutorialPage } from '../../_model/tutorial.model';

export const SCRIPT_EXTENSION_EXTERNAL_TOOLS: TutorialPage = {
    title: $localize`Outils externes`,
    lead: $localize`MyHordes Optimizer peut envoyer ce que vous voyez dans le jeu à MyHordes Optimizer, Gest'Hordes et Fata Morgana, en un clic. Cochez « Mise à jour des outils externes », puis les outils à mettre à jour et ce qu'il faut envoyer à chacun.`,
    sections: [
        {
            title: $localize`Mise à jour`,
            items: [
                {
                    title: $localize`Le bouton « Mettre à jour les outils externes »`,
                    content: $localize`<p>Il apparaît dès qu'au moins un outil est coché :</p>
                        <ul>
                            <li>dans le désert, dans la zone d'actions sous la carte (en version réduite sur un écran étroit) ;</li>
                            <li>dans votre maison, près du coffre ;</li>
                            <li>sur la page des améliorations de la maison, sous le tableau.</li>
                        </ul>
                        <p>Pendant la mise à jour, chaque outil a son icône : en cours, réussi ou en échec. Le survol d'une icône en échec donne le détail de l'erreur. Au-delà de 2 minutes sans réponse, l'outil passe en « Délai dépassé ». Quand la mise à jour de MyHordes Optimizer réussit, la liste de courses et les informations de case affichées dans la page sont rechargées.</p>
                        <p>Ce qui est envoyé dépend de la page où vous cliquez : les conditions sont précisées pour chaque option ci-dessous.</p>`
                },
                {
                    title: 'MyHordes Optimizer',
                    content: $localize`<p>« Mettre à jour MyHordes Optimizer » envoie la carte, la ville et les citoyens lus dans l'API de MyHordes. Sous-options :</p>
                        <ul>
                            <li><strong>Enregistrer le nombre de zombies tués</strong> : depuis le désert, quand des zombies ont été tués sur la case (taches de sang) ;</li>
                            <li><strong>Mise à jour même quand la ville est en Chaos</strong> : en chaos, l'API de MyHordes ne donne plus le détail de votre case ; il est alors lu dans la page (zombies, zone épuisée, objets au sol) ;</li>
                            <li><strong>Actions héroïques</strong> : depuis le désert ou votre maison, les actions disponibles ou utilisées, les charges de l'appareil photo et, dans le désert, le PEF ;</li>
                            <li><strong>Améliorations de la maison</strong> : depuis la page des améliorations uniquement (niveaux et clôture) ;</li>
                            <li><strong>Détail de mon sac et de ceux de mon escorte</strong> : votre sac depuis n'importe quelle page où le bouton est présent, ceux de vos escortés depuis le désert ;</li>
                            <li><strong>Contenu de mon coffre</strong> : depuis votre maison ;</li>
                            <li><strong>États</strong> : tous vos états, sauf goule ;</li>
                            <li><strong>Actions quotidiennes</strong> : depuis votre maison (bain, douche, ménage, sieste) ;</li>
                            <li><strong>Enregistrer les fouilles réussies</strong> : depuis le désert (voir plus bas) ;</li>
                            <li><strong>Rafraîchir l'onglet après la mise à jour</strong> : recharge l'onglet MyHordes Optimizer ouvert dans la même fenêtre du navigateur quand vous y revenez ; une saisie non enregistrée sur cet onglet est perdue.</li>
                        </ul>`
                },
                {
                    title: $localize`Fouilles réussies`,
                    content: $localize`<p>Le jeu ne dit pas ce qu'une fouille a trouvé : MyHordes Optimizer estime le nombre de fouilles réussies des citoyens présents à partir du registre de la case (heure d'arrivée, fouilles sans résultat, une fouille toutes les 1 h 30 pour un fouineur, 2 h sinon). C'est une estimation.</p>
                        <p>Si le registre affiché est incomplet, un encart « Attention : Données de fouilles manquantes » apparaît près du bouton : cliquez sur « Afficher toutes les entrées » en bas du registre, puis relancez la mise à jour.</p>`
                },
                {
                    title: 'Gest\'Hordes',
                    content: $localize`<p>« Mettre à jour Gest'Hordes » envoie votre carte à Gest'Hordes. Sous-options :</p>
                        <ul>
                            <li><strong>Enregistrer le nombre de zombies tués</strong> : depuis le désert, quand des zombies ont été tués sur la case ;</li>
                            <li><strong>Mise à jour quand la ville est en Chaos</strong> : la case est alors lue dans la page ;</li>
                            <li><strong>Actions héroïques</strong> : depuis le désert ou votre maison ;</li>
                            <li><strong>Améliorations de la maison</strong> : depuis la page des améliorations ;</li>
                            <li><strong>États</strong> : Gest'Hordes ne conserve que l'état « clair » ;</li>
                            <li><strong>Rafraîchir l'onglet après la mise à jour</strong> : actualise l'onglet Gest'Hordes ouvert dans la même fenêtre du navigateur.</li>
                        </ul>`
                },
                {
                    title: 'Fata Morgana',
                    content: $localize`<p>« Mettre à jour Fata Morgana » envoie votre carte à Fata Morgana. Sous-options :</p>
                        <ul>
                            <li><strong>Enregistrer le nombre de zombies tués</strong> : depuis le désert, quand des zombies ont été tués sur la case ;</li>
                            <li><strong>Met à jour les informations issues des marqueurs de métiers</strong> : depuis le désert, le relevé du fouineur (abondance de la zone et cases voisines épuisées) ou de l'éclaireur (niveau d'exploration et zombies des cases voisines) ;</li>
                            <li><strong>Mise à jour même quand la ville est en Chaos ou quand le quota est dépassé</strong> : la case est lue dans la page à chaque mise à jour ;</li>
                            <li><strong>Rafraîchir l'onglet après la mise à jour</strong> : recharge l'onglet Fata Morgana ouvert dans la même fenêtre du navigateur.</li>
                        </ul>`
                }
            ]
        },
        {
            title: $localize`Affichage des données de MyHordes Optimizer`,
            items: [
                {
                    title: $localize`Informations diverses issues de MyHordes Optimizer`,
                    content: $localize`<p>Dans le désert, un bloc « Informations complémentaires » s'ajoute sous la carte, avec un bouton pour le rafraîchir :</p>
                        <ul>
                            <li><strong>Note de la case</strong>, saisie sur la carte du site ;</li>
                            <li><strong>État des fouilles</strong> : fouilles restantes estimées, au maximum et en moyenne ;</li>
                            <li><strong>Bâtiment</strong>, s'il y en a un : vide ou non, et les objets qu'on peut y trouver avec leur probabilité.</li>
                        </ul>`
                },
                {
                    title: $localize`Mes expéditions`,
                    content: $localize`<p>Un bouton s'ajoute dans le bandeau, à gauche de la boîte aux lettres. Il ouvre une fenêtre déplaçable avec un onglet par expédition de MyHordes Optimizer à laquelle vous êtes inscrit : pour chaque partie, le trajet et sa direction, puis un tableau des citoyens (soif, départ à 7 PA, consignes, sac).</p>`
                },
                {
                    title: $localize`Liens vers les profils et villes externes`,
                    content: $localize`<ul>
                            <li>Dans la bulle d'un joueur : un bloc « Profils externes » vers ses profils MyHordes Optimizer, BigBroth'Hordes et Gest'Hordes ;</li>
                            <li>sur la page d'historique d'une ville : un bloc « Liens externes » vers la ville dans MyHordes Optimizer, Gest'Hordes et Fata Morgana ;</li>
                            <li>dans la liste des villes : une colonne MyHordes Optimizer ; l'icône de carte ouvre les mêmes liens.</li>
                        </ul>`
                }
            ]
        }
    ]
};
