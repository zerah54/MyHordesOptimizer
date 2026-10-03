import { TutorialPage } from '../../_model/tutorial.model';

export const SCRIPT_EXTENSION_FORUM: TutorialPage = {
    title: $localize`Forum`,
    lead: $localize`Options pour le forum de MyHordes, dans la catégorie « Améliorations de l'interface ».`,
    sections: [
        {
            items: [
                {
                    title: $localize`Style personnalisé des noms de sujets`,
                    content: $localize`<p>Colore, met en avant ou atténue les sujets de la liste du forum selon leur tag et les mots de leur titre. Une fois l'option cochée, le bouton « Configurer » à côté d'elle ouvre la fenêtre « Style des noms de sujets du forum ».</p>
                        <ul>
                            <li>Chaque règle a une case pour l'activer, des <strong>tags</strong> et des <strong>mots ou expressions régulières</strong> à chercher dans le titre (<code>%DAY%</code> y vaut le jour de votre ville) ;</li>
                            <li>une règle s'applique quand tous les critères renseignés correspondent ;</li>
                            <li>styles possibles : couleur du texte, fond, bordure gauche, taille, opacité, préfixe, avec un aperçu ;</li>
                            <li>l'ordre compte : pour chaque style, la première règle de la liste qui le définit l'emporte. « Monter » et « Descendre » changent cet ordre.</li>
                        </ul>
                        <p>Des règles sont fournies par défaut (jour de la ville, sujets officiels, mises à jour, aide, événements, organisation, guides, RP, flood atténué). « Restaurer les règles par défaut » les rétablit. « Exporter » copie vos règles dans le presse-papiers et « Importer » les remplace par des règles collées, pour les partager. N'oubliez pas « Enregistrer ». Les règles sont stockées dans votre navigateur.</p>`
                },
                {
                    title: $localize`Options du forum`,
                    content: $localize`<p>Cochez « Forum », puis les options voulues :</p>
                        <ul>
                            <li><strong>Déplier automatiquement les sections repliées</strong> des messages (les sections par langue restent repliées) ;</li>
                            <li><strong>Cliquer sur un spoiler pour le garder affiché</strong> ;</li>
                            <li><strong>Afficher les images des liens</strong> vers une image dans les messages, sous le lien ;</li>
                            <li><strong>Afficher les vidéos des liens</strong> YouTube et Dailymotion : une vignette qui devient un lecteur au clic (Ctrl + clic ouvre la vidéo dans un nouvel onglet).</li>
                        </ul>`
                }
            ]
        }
    ]
};
