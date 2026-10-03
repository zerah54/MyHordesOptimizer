import { TutorialPage } from '../../_model/tutorial.model';

export const SCRIPT_EXTENSION_TOOLS: TutorialPage = {
    title: $localize`Outils`,
    lead: $localize`Le bouton « Outils » du panneau ouvre une fenêtre à onglets par-dessus le jeu.`,
    sections: [
        {
            items: [
                {
                    title: $localize`Banque`,
                    content: $localize`<p>L'onglet n'apparaît que si vous êtes incarné dans une ville. Il liste les objets de la banque et leur quantité ; un objet cassé porte la mention « (Cassé) » et une bordure rouge. Un clic sur un objet affiche son détail (mêmes informations que les tooltips détaillés).</p>
                        <p>Les objets absents de la liste de courses sont suivis d'un bouton caddie : un clic les y ajoute.</p>`
                },
                {
                    title: $localize`Camping`,
                    content: $localize`<p>Calcule vos chances de survie en camping. Les champs sont répartis en trois blocs, « Le citoyen », « La ville » et « Le bâtiment » ; la tenue de camouflage n'est proposée qu'à l'éclaireur. Le calcul est fait par MyHordes Optimizer.</p>
                        <p>Pour une case précise, l'encart de prédiction de camping du désert est plus pratique : il pré-remplit ce que la page connaît déjà (voir « Informations complémentaires »). Le site propose aussi un calculateur plus complet, avec le détail du calcul (tutoriel « Site » &gt; « Outils »).</p>`
                }
            ]
        }
    ]
};
