import { TutorialPage } from '../../_model/tutorial.model';

export const SCRIPT_EXTENSION_ADDITIONAL_INFO: TutorialPage = {
    title: $localize`Informations complémentaires`,
    lead: $localize`Options de la catégorie « Informations complémentaires » : elles ajoutent aux pages du jeu des données que MyHordes n'affiche pas.`,
    sections: [
        {
            items: [
                {
                    title: $localize`Tooltips détaillés`,
                    content: $localize`<p>Complète les bulles d'aide du jeu. Chaque partie a sa sous-option :</p>
                        <ul>
                            <li><strong>Objets &gt; Quantité en banque & liste de courses</strong> : quantités en banque, sur la carte, dans les sacs et dans les coffres ; la quantité souhaitée et le dépôt si l'objet est dans la liste de courses de la zone ;</li>
                            <li><strong>Objets &gt; Propriétés</strong> : propriétés de l'objet, effet réel à la catapulte, objets qui l'ouvrent (avec l'alternative du technicien) et objets qu'il ouvre ;</li>
                            <li><strong>Objets &gt; Actions</strong> : ce que fait l'objet quand on l'utilise (points d'action rendus, drogue, alcool, trouvaille…) ;</li>
                            <li><strong>Objets &gt; Recettes</strong> : les recettes où l'objet apparaît ;</li>
                            <li><strong>Objets &gt; Traductions</strong> : le nom de l'objet dans les trois autres langues du jeu ;</li>
                            <li><strong>États</strong> : dans la bulle d'un état, ses effets (zombies tués en veille, chances de survie en veille, chances de réussite des fouilles, terreur, infection, blessures).</li>
                        </ul>
                        <p>La valeur de décoration d'un objet est ajoutée à l'étiquette du jeu. Appuyez sur Maj (⇧) pour figer la bulle affichée et la lire tranquillement ; la croix la libère.</p>
                        <p>Le détail des objets dans le Wiki et l'outil Banque de MyHordes Optimizer suit les mêmes sous-options.</p>`
                },
                {
                    title: $localize`Liste de courses dans l'interface`,
                    content: $localize`<p>Ajoute une section « Liste de courses », repliée par défaut, dans le désert et dans l'atelier. Colonnes : objet, dépôt, en banque, en sacs, en coffres, sur la carte, souhaité et manquant (souhaité moins banque et sacs). Le bouton « Rafraîchir la liste » la recharge, avec la date et l'auteur de la dernière modification.</p>
                        <ul>
                            <li><strong>Dans le désert</strong>, seuls apparaissent les objets de la liste présents sur la case, dans votre sac ou dans le sac d'un escorté, pour la zone où vous vous trouvez. Ces objets sont entourés d'un halo : blanc s'il faut le prendre, gris foncé s'il n'y a pas de place dans le sac, noir pour le dépôt « Ne pas ramener ».</li>
                            <li><strong>À l'atelier</strong>, seuls apparaissent les objets marqués pour l'atelier.</li>
                        </ul>`
                },
                {
                    title: $localize`Estimations enregistrées sur la page de la tour de guet`,
                    content: $localize`<p>Sur la page de la tour de guet, un bloc affiche les estimations enregistrées dans MyHordes Optimizer pour l'attaque du jour (paliers de 33 à 100 %) et, si le jeu la montre, celle du lendemain (paliers de 0 à 100 %), ainsi que l'attaque calculée. L'estimation que vous venez de lire dans la page s'affiche en vert.</p>
                        <p>Le bouton « Enregistrer » l'envoie à MyHordes Optimizer ; « Copier au format forum » copie le tableau (enregistrez d'abord).</p>`
                },
                {
                    title: $localize`Prédictions de camping dans les informations du secteur`,
                    content: $localize`<p>Dans le désert, un encart s'ajoute au bloc « camper ». Il reprend tout ce que la page connaît déjà : type de ville, métier, distance, zombies, nuit, ville dévastée, bâtiment et nombre de tas. Il reste à renseigner ce qu'elle ignore : tenue de camouflage, campeur professionnel, tombe, nuits déjà campées, pelures et toiles de tente, campeurs cachés, améliorations de la case, objets de défense, phare.</p>
                        <p>Le résultat affiche la chance de survie, et entre parenthèses le pourcentage brut quand le plafond (ou le plancher) l'a modifié.</p>`
                },
                {
                    title: $localize`Notes privées sur les villes et les joueurs`,
                    content: $localize`<p>Ajoute des notes que vous seul voyez, enregistrées dans MyHordes Optimizer :</p>
                        <ul>
                            <li>sur la page d'historique d'une ville : une note sur la ville, et une icône crayon à côté de chaque citoyen pour une note sur lui dans cette ville ;</li>
                            <li>dans la bulle de n'importe quel joueur : une note sur ce joueur, valable dans toutes les villes.</li>
                        </ul>
                        <p>Un clic sur le crayon ouvre la saisie. Un crayon estompé signale une note vide. Ces notes sont aussi visibles sur le site (Annuaire, profils, citoyens morts).</p>`
                }
            ]
        }
    ]
};
