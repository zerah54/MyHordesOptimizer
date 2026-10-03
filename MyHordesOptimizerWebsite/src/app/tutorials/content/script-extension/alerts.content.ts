import { TutorialPage } from '../../_model/tutorial.model';

export const SCRIPT_EXTENSION_ALERTS: TutorialPage = {
    title: $localize`Notifications`,
    lead: $localize`Options de la catégorie « Notifications et avertissements ». Les notifications passent par votre navigateur : autorisez-les pour le site de MyHordes.`,
    sections: [
        {
            items: [
                {
                    title: $localize`Avertissement en cas de fermeture de la page`,
                    content: $localize`<p>Cochez « Me notifier en l'absence d'escorte ou si vous n'avez pas relâché votre escorte », puis « Demander confirmation avant de quitter la page ».</p>
                        <p>Dans le désert, si votre attente d'escorte n'est pas activée ou si vous n'avez pas relâché votre escorte, un encart rouge le rappelle, et le navigateur demande confirmation avant de fermer l'onglet ou la fenêtre.</p>`
                },
                {
                    title: $localize`Avertissement en cas d'inactivité`,
                    content: $localize`<p>Sous la même option, cochez « Me notifier si je suis inactif depuis 5 minutes sur la page ».</p>
                        <p>Dans le désert, après 5 minutes sans action sur la page, une notification vous prévient si votre attente d'escorte n'est pas activée ou si vous n'avez pas relâché votre escorte à ce moment-là.</p>`
                },
                {
                    title: $localize`Notification à la fin de la fouille`,
                    content: $localize`<p>Avec « Me notifier à la fin de la fouille », une notification arrive quelques secondes avant la fin de votre fouille, à condition que la page du désert soit restée ouverte.</p>`
                }
            ]
        }
    ]
};
