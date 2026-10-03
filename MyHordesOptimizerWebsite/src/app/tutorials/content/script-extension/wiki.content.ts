import { TutorialPage } from '../../_model/tutorial.model';

export const SCRIPT_EXTENSION_WIKI: TutorialPage = {
    title: $localize`Wiki`,
    lead: $localize`Le bouton « Wiki » du panneau ouvre une fenêtre à onglets par-dessus le jeu, pour consulter les données de MyHordes sans quitter la page.`,
    sections: [
        {
            items: [
                {
                    title: $localize`Objets`,
                    content: $localize`<p>Tous les objets du jeu. Un clic sur un objet affiche son détail, selon les sous-options des tooltips détaillés (propriétés, actions, recettes, traductions…).</p>
                        <p>Si vous êtes incarné, les objets absents de la liste de courses sont suivis d'un bouton caddie : un clic les y ajoute.</p>`
                },
                {
                    title: $localize`Recettes`,
                    content: $localize`<p>Toutes les recettes, groupées par type avec leur icône. Le composant qui déclenche la recette est mis en évidence, et les résultats aléatoires portent leur probabilité.</p>`
                },
                {
                    title: $localize`Bâtiments`,
                    content: $localize`<p>Tous les bâtiments du désert : description, distances minimale et maximale de la ville, bonus en camping, capacité, et les objets qu'on peut y trouver avec leur probabilité.</p>`
                }
            ]
        }
    ]
};
