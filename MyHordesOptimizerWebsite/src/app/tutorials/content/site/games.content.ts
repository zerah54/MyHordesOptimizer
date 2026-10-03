import { TutorialPage } from '../../_model/tutorial.model';

export const SITE_GAMES: TutorialPage = {
    title: $localize`Mini-jeux`,
    sections: [
        {
            items: [
                {
                    title: $localize`368 Pictos`,
                    content: $localize`<p>Placez des paires de pictos sur une grille de 6 × 6, en les glissant ou en cliquant sur une case. Trois pictos identiques alignés ou plus disparaissent. Le but : faire disparaître les 368 pictos. La partie s'arrête quand plus aucune paire ne peut être posée ; « Nouvelle partie » recommence. Les parties ne sont pas sauvegardées.</p>`
                },
                {
                    title: $localize`Démineur`,
                    content: $localize`<ul>
                            <li><strong>Mode</strong> : « Normal » ou « Défi du jour » (une seule tentative par difficulté et par jour ; une partie interrompue ne peut pas être reprise) ;</li>
                            <li><strong>Difficulté</strong> : de Facile (9 × 9, 10 mines) à Impossible (100 × 100, 2000 mines), ou Personnalisé en mode normal ;</li>
                            <li><strong>Commandes</strong> : clic pour révéler une case, clic droit (ou appui long) pour poser un drapeau puis un point d'interrogation, clic sur un chiffre pour révéler ses voisines quand c'est sûr ; zoom et plein écran ;</li>
                            <li><strong>Classement</strong> : meilleurs scores, classement des joueurs et vos parties. Sans être connecté, vos scores ne sont pas enregistrés.</li>
                        </ul>`
                }
            ]
        }
    ]
};
