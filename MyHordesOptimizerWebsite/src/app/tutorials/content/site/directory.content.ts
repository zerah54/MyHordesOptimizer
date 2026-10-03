import { TutorialPage } from '../../_model/tutorial.model';

export const SITE_DIRECTORY: TutorialPage = {
    title: $localize`Annuaire et observation`,
    lead: $localize`L'annuaire recense les villes et les joueurs connus de MyHordes Optimizer. Une ville de la liste peut s'ouvrir en observation.`,
    sections: [
        {
            items: [
                {
                    title: $localize`Villes`,
                    content: $localize`<p>Choisissez la saison (et sa phase), puis filtrez par identifiant, nom, type, langue ou état depuis les en-têtes. Colonnes : identifiant, langue, nom, taille, type, score, citoyens (vivants / morts), état (normal, chaos, dévasté, terminée). La liste se trie et se parcourt par pages.</p>
                        <p>Pour les villes où vous avez été citoyen, la colonne « Note » porte votre note privée sur la ville. Un clic sur une ville l'ouvre en observation.</p>`
                },
                {
                    title: $localize`Citoyens`,
                    content: $localize`<p>Les joueurs : pseudo (filtrable), nombre de villes, meilleure survie et dernière ville. Connecté, vous pouvez y écrire une note privée sur chaque joueur. Un clic ouvre son profil (villes et pictos).</p>`
                },
                {
                    title: $localize`Observer une ville`,
                    content: $localize`<p>Une ville ouverte depuis l'annuaire s'affiche en lecture seule : un bandeau « Mode observateur » et la pastille « Observation » de l'en-tête le rappellent, et la section « Ma ville » du menu prend le nom de la ville observée.</p>
                        <ul>
                            <li>La carte, la banque, les citoyens, la liste de courses, les statistiques et les expéditions se consultent, sans modification possible ;</li>
                            <li>des citoyens d'une ville dont vous n'êtes pas membre, seule l'identité est visible (ni sac, ni coffre, ni états) ;</li>
                            <li>le bouton « Mettre à jour » de l'en-tête est masqué : il ne concerne que votre propre ville.</li>
                        </ul>
                        <p>« Revenir à ma ville », en tête du menu, quitte l'observation.</p>`
                },
                {
                    title: $localize`Notes privées`,
                    content: $localize`<p>Trois sortes de notes, visibles de vous seul : sur une ville, sur un joueur (dans toutes les villes) et sur un citoyen dans une ville donnée. On les retrouve dans l'annuaire, les profils et la liste des morts de « Citoyens », et dans le jeu avec l'extension (option « Notes privées sur les villes et les joueurs »).</p>`
                }
            ]
        }
    ]
};
