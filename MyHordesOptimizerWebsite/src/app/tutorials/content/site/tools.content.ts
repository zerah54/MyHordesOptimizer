import { TutorialPage } from '../../_model/tutorial.model';

export const SITE_TOOLS: TutorialPage = {
    title: $localize`Outils`,
    lead: $localize`Quatre calculateurs, utilisables sans compte. Avec une ville active, certains se pré-remplissent. Rien n'est sauvegardé : les saisies sont perdues au rechargement (le camping se partage par un lien).`,
    sections: [
        {
            items: [
                {
                    title: $localize`Camping`,
                    content: $localize`<p>Calcule vos chances de survie en camping.</p>
                        <ul>
                            <li><strong>Dans ma ville</strong> (avec une ville active) reprend le type de ville et la dévastation, et limite la liste des bâtiments à ceux de votre carte ;</li>
                            <li><strong>Le citoyen</strong> : métier (la tenue de camouflage de l'éclaireur compte −3 % par zombie au lieu de −7 %), campeur professionnel, tombe, R4, campings déjà effectués, pelures de peau et toiles de tente ;</li>
                            <li><strong>La ville</strong> : type de ville, nuit, ville dévastée, phare ;</li>
                            <li><strong>Le bâtiment</strong> : distance, bâtiment (la liste suit la distance ; un bâtiment enseveli demande son nombre de tas), zombies sur la case, campeurs déjà cachés, améliorations simples et objets de défense, ou leur pourcentage total (« Et » les additionne, « Ou » n'utilise que le total).</li>
                        </ul>
                        <p>Le résultat donne la chance de survie, plafonnée à 90 % (99 % avec R4, 100 % pour un ermite), le pourcentage brut quand il diffère, et la phrase du jeu. Le <strong>détail du calcul</strong> liste chaque facteur et sa contribution. Un bâtiment plein (autant de campeurs cachés que sa capacité) ne protège plus : le bonus du désert s'applique. « Bonus en équivalent PA » affiche les bonus en PA plutôt qu'en %.</p>
                        <p>« Copier le lien de la simulation » copie une adresse qui rouvre le calculateur avec les mêmes valeurs.</p>`
                },
                {
                    title: $localize`Chances de survie`,
                    content: $localize`<p>Calcule la répartition du nombre de morts d'un groupe à partir des chances de survie de chacun (par exemple pour une nuit de camping à plusieurs).</p>
                        <ul>
                            <li>Chaque simulation liste ses personnes et leur chance de survie (40 au plus) ; « Valeur par défaut » s'applique aux personnes ajoutées ensuite ;</li>
                            <li>résultats : morts et survivants en moyenne, issue la plus probable, histogramme et tableau des probabilités ;</li>
                            <li>plusieurs simulations côte à côte se comparent ; un clic sur le titre le renomme.</li>
                        </ul>
                        <p>Le calcul se relance quand vous quittez un champ.</p>`
                },
                {
                    title: $localize`Simulateur de débordement`,
                    content: $localize`<p>Estime ce qui arrive aux citoyens quand l'attaque dépasse la défense, en reproduisant l'attaque du jeu sur des milliers de tirages.</p>
                        <ul>
                            <li><strong>Ma ville</strong> (avec une ville active) reprend le jour, le chaos, la dévastation, l'attaque estimée, les citoyens vivants, leurs habitations et une défense minimale par citoyen (maison, métier, améliorations, objets de défense du coffre) ;</li>
                            <li><strong>Attaque</strong> : attaque estimée (âmes rouges comprises), défense de la ville (ignorée si la porte est ouverte), défense de veille, état de la porte ;</li>
                            <li><strong>Ville</strong> : jour, citoyens vivants, population, habitations par niveau, chaos, dévastation ;</li>
                            <li><strong>Répartition</strong> : défense de maison par défaut (appliquée aux nouvelles lignes seulement), nombre de simulations, défense de chaque citoyen.</li>
                        </ul>
                        <p>Résultats : le débordement, les zombies qui attaquent vraiment et les citoyens ciblés (plus nombreux à partir du jour 10), les morts attendus avec une fourchette favorable / défavorable, et le détail par citoyen, par défense et la répartition des morts. Les résultats varient légèrement d'un calcul à l'autre.</p>`
                },
                {
                    title: $localize`Gestionnaire d'état`,
                    content: $localize`<p>Prépare une sortie : avec votre sac et votre état de départ, il indique dans quel ordre consommer vos objets et ce que devient votre état pas à pas.</p>
                        <ul>
                            <li><strong>État de départ</strong> : sac (seuls les objets qui changent l'état), PA et PE disponibles, niveau de second souffle, soif, blessure, goule, ivresse, gueule de bois, drogue, dépendance, fatigue, éclaireur, vélo, baskets, bouclier, objet de défense de zone, bonus de points de contrôle, habitant (sinon héros), guide et citoyens dans la zone ;</li>
                            <li><strong>Ordres de consommation possibles</strong>, du meilleur au pire : le meilleur est celui qui finit dans l'état le moins grave, le plus tard possible ;</li>
                            <li><strong>Séquence</strong> : ajoutez déplacements, baskets, vélo, ramassage d'un objet de défense, transformation en goule, second souffle ou consommation d'un objet ; chaque étape se retire avec ×. Un déplacement consomme d'abord les PE, puis les PA ;</li>
                            <li><strong>État actuel</strong> et <strong>Historique</strong> : PA, PE, points de contrôle et états après chaque étape. Au-delà de 10 déplacements, la soif progresse d'un palier.</li>
                        </ul>`
                }
            ]
        }
    ]
};
