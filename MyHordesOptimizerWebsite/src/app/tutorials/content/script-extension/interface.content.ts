import { TutorialPage } from '../../_model/tutorial.model';

export const SCRIPT_EXTENSION_INTERFACE: TutorialPage = {
    title: $localize`Améliorations de l'interface`,
    lead: $localize`Options de la catégorie « Améliorations de l'interface » : recherches, tris et petits outils ajoutés aux pages du jeu. Les options du forum ont leur propre tutoriel.`,
    sections: [
        {
            title: $localize`Tris et filtres`,
            items: [
                {
                    title: $localize`Filtres supplémentaires`,
                    content: $localize`<p>Ajoute un champ de recherche (sans tenir compte des majuscules ni des accents) aux listes choisies :</p>
                        <ul>
                            <li><strong>Chantiers</strong>, avec « Masquer les chantiers terminés » (un chantier terminé mais endommagé reste affiché) ;</li>
                            <li><strong>Destinataires</strong> d'un message depuis votre maison ;</li>
                            <li><strong>Décharge</strong>, avec les cases « Peut être jeté » et « Peut être récupéré » ;</li>
                            <li><strong>Appâts</strong> des pièges ;</li>
                            <li><strong>Registre</strong> : la recherche porte sur les lignes affichées ;</li>
                            <li><strong>Liste des citoyens</strong> : nom, connexion, métier, habitation, dehors ou en ville ;</li>
                            <li><strong>Omniscience</strong> : nom, connexion, habitation, métier, contenu du coffre (ou coffre vide), activité.</li>
                        </ul>`
                },
                {
                    title: $localize`Tris supplémentaires`,
                    content: $localize`<p>Ajoute des en-têtes de tri aux listes choisies :</p>
                        <ul>
                            <li><strong>Liste des citoyens</strong> : citoyen, défense, dehors ;</li>
                            <li><strong>Omniscience</strong> : citoyen, coffre, points d'âme, activité ;</li>
                            <li><strong>Veille</strong> : métier, pseudo, défense ;</li>
                            <li><strong>Pièges</strong> : objet, stock restant ;</li>
                            <li><strong>Décharge</strong> : objet, stock (banque et décharge), défense.</li>
                        </ul>`
                }
            ]
        },
        {
            title: $localize`Désert`,
            items: [
                {
                    title: $localize`Options d'escorte par défaut`,
                    content: $localize`<p>Choisissez l'état des deux options d'escorte du jeu, « Interdire au chef d'escorte de m'éloigner de la ville » et « Permettre de voir et de manipuler les objets de mon sac » : elles sont réglées ainsi chaque fois que vous activez votre attente d'escorte.</p>`
                },
                {
                    title: $localize`Ouvrir automatiquement « Utiliser un objet de mon sac »`,
                    content: $localize`<p>Déplie le menu « Utiliser un objet » partout où le jeu le propose, et de nouveau après chaque changement de votre sac.</p>`
                },
                {
                    title: $localize`Nombre de zombies morts aujourd'hui`,
                    content: $localize`<p>Ajoute un encart dans les informations de la zone : le nombre de zombies tués sur la case depuis la dernière attaque (les taches de sang du jeu) et le nombre de zombies qui mourront de désespoir à la prochaine attaque : (tués − 1) ÷ 2, arrondi à l'inférieur.</p>`
                }
            ]
        },
        {
            title: $localize`Ville`,
            items: [
                {
                    title: $localize`PA manquants pour réparer les chantiers`,
                    content: $localize`<p>Sur la page des chantiers, un bâtiment endommagé affiche en plus, dans sa barre de PA, ceux qu'il faut investir pour qu'il passe la nuit : « (dont X pour que le bâtiment passe la nuit) ».</p>
                        <p>Sont comptés les dégâts de l'attaque en Pandémonium (70 % des points de vie maximum, arrondis au supérieur) et, dans tous les modes, ceux que certains bâtiments s'infligent eux-mêmes (feux d'artifice, réacteur).</p>`
                },
                {
                    title: $localize`Compteur pour gérer l'anti-abus`,
                    content: $localize`<p>Sur la page de la banque, un compteur liste vos prises, chacune avec son compte à rebours de 15 minutes, et le nombre de prises restantes (5, ou 10 en chaos). Il prévient quand la prochaine prise déclencherait l'anti-abus. Le bouton « + » ajoute un compteur à la main, par exemple pour une prise faite ailleurs ; une prise que le script n'a pas su attribuer apparaît comme « Prise incertaine ».</p>
                        <p>Au puits, une ration supplémentaire prise ajoute sa ligne.</p>`
                },
                {
                    title: $localize`Pourcentage sur la jauge de voracité`,
                    content: $localize`<p>Si vous êtes goule, le pourcentage de voracité s'ajoute au texte de la jauge.</p>`
                }
            ]
        },
        {
            title: $localize`Partout`,
            items: [
                {
                    title: $localize`Barre de traduction des éléments de MyHordes`,
                    content: $localize`<p>Affiche une barre de traduction. Choisissez la langue du texte, puis saisissez-le : les traductions dans les autres langues sont cherchées dans les fichiers de traduction du jeu, le texte doit donc venir de MyHordes.</p>`
                },
                {
                    title: $localize`Bouton pour copier le contenu du registre`,
                    content: $localize`<p>Ajoute un bouton ⧉ au titre de chaque registre. Il copie les entrées affichées (filtrées par la recherche le cas échéant), une par ligne avec leur heure. Pour tout copier, cliquez d'abord sur « Afficher toutes les entrées » en bas du registre.</p>`
                },
                {
                    title: $localize`Stocker les notifications`,
                    content: $localize`<p>Les notifications du jeu disparaissent toujours d'elles-mêmes, mais une copie de chacune est conservée. Un bouton ajouté dans le bandeau, à gauche de la boîte aux lettres, ouvre une fenêtre déplaçable qui les liste ; chaque entrée a sa corbeille. Tout est effacé au rechargement de la page.</p>`
                },
                {
                    title: $localize`Compteur de caractères sur le chatcase`,
                    content: $localize`<p>Dans le désert, affiche sous le champ de saisie du registre le nombre de caractères utilisés sur les 256 permis.</p>`
                },
                {
                    title: $localize`Pré-remplir les messages contenant des objets`,
                    content: $localize`<p>Dans la messagerie de votre maison, quand vous joignez un premier objet à un message dont le titre et le texte sont vides, un titre et un texte courts sont remplis pour vous : le message peut partir tel quel.</p>`
                },
                {
                    title: $localize`Figer les avatars animés`,
                    content: $localize`<p>Les avatars animés s'affichent fixes et ne s'animent qu'au survol de la souris.</p>`
                }
            ]
        }
    ]
};
