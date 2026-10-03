import { TutorialPage } from '../../_model/tutorial.model';

export const SITE_WIKI: TutorialPage = {
    title: $localize`Wiki`,
    lead: $localize`Les données du jeu, consultables sans compte. Le badge « Spoil » du menu signale les pages qui peuvent dévoiler des nouveautés de la saison en cours.`,
    sections: [
        {
            items: [
                {
                    title: $localize`Objets`,
                    content: $localize`<p>Tous les objets, par catégorie. « Filtrer » cherche par nom (sans tenir compte des majuscules ni des accents) ; « Chercher des objets par propriétés » garde les objets qui ont au moins une des propriétés ou actions choisies.</p>
                        <p>Un clic sur un objet ouvre sa fiche : description, fréquence en fouille, recettes, objets qui l'ouvrent et qu'il ouvre, effet à la catapulte, décoration, arme de veille, encombrant, propriétés et actions.</p>
                        <p>La <strong>fréquence en fouille</strong> est la chance d'obtenir l'objet lors d'une fouille réussie, sur une zone non épuisée (ou épuisée, pour les deux objets qu'on n'y trouve que là) : un palier (de très courant à très rare), « ≈ 1 fouille réussie sur N » (« ≈ 5 fouilles réussies sur 8 » au-delà de 25 %) et le pourcentage exact.</p>
                        <p>Avec une ville active, le bouton caddie ajoute l'objet à la liste de courses.</p>`
                },
                {
                    title: $localize`Recettes`,
                    content: $localize`<p>Toutes les recettes : type (action de citoyen, établi des techniciens, atelier…), composants (le déclencheur est mis en évidence) et résultats, avec leur probabilité quand elle est inférieure à 100 %. « Filtrer » cherche dans les composants et les résultats.</p>`
                },
                {
                    title: $localize`Pouvoirs`,
                    content: $localize`<p>Les pouvoirs héroïques, par arbre (Stratège, Universitaire, Préparé, Endurant, Reclus), avec leurs niveaux et les points d'âme nécessaires pour les débloquer.</p>`
                },
                {
                    title: $localize`Bâtiments`,
                    content: $localize`<p>Les bâtiments du désert : distances minimale et maximale de la ville, bonus en camping, capacité, et les objets qu'on peut y trouver avec leur probabilité. Les colonnes se trient ; l'icône d'entonnoir des en-têtes filtre par nom, distance ou objet. Avec une ville active, « Dans ma ville » n'affiche que les bâtiments de votre carte.</p>`
                },
                {
                    title: $localize`Chantiers`,
                    content: $localize`<p>L'arbre des chantiers, entièrement déplié ; les chevrons replient une branche, et l'icône d'entonnoir de l'en-tête cherche par nom. Pour chaque chantier : PA, défense, points de vie, plan, particularités (temporaire, peut être endommagé par l'attaque) et ressources.</p>
                        <ul>
                            <li><strong>Normal / Pandémonium</strong> : en Pandémonium, les chantiers indisponibles sont masqués, et le compteur « Plan » indique combien de plans ont été lus, ce qui change le coût en PA et en ressources ;</li>
                            <li><strong>Sélection</strong> : cocher une évolution coche ses chantiers parents, décocher un chantier décoche ses évolutions. Le récapitulatif donne le nombre de chantiers, le total de PA et les ressources nécessaires ;</li>
                            <li><strong>Envoyer à la liste de courses</strong> (avec une ville active) ajoute à la liste de courses les ressources qui n'y figurent pas encore, en quantité et zone illimitées. Les objets déjà présents ne sont pas modifiés.</li>
                        </ul>`
                },
                {
                    title: $localize`Informations diverses`,
                    content: $localize`<p>Des tables de référence, avec le jour de votre ville surligné :</p>
                        <ul>
                            <li><strong>Morts par désespoir</strong>, et un calculateur qui suit les zombies d'une case de nuit en nuit ;</li>
                            <li><strong>Attaque théorique</strong> par jour (minimum, maximum, moyenne) ;</li>
                            <li><strong>Débordement</strong> : citoyens ciblés par jour, avec un lien vers le simulateur ;</li>
                            <li><strong>Manuel des ermites</strong> : chance de réussite par jour ;</li>
                            <li><strong>Points d'âme</strong> et <strong>points clean</strong> selon le nombre de jours.</li>
                        </ul>`
                },
                {
                    title: $localize`Villes privées`,
                    content: $localize`<p>Les paramètres des villes privées : pour chaque option, sa description et sa disponibilité en petite carte, en région éloignée et en Pandémonium (étoile : par défaut ; croix : indisponible).</p>`
                }
            ]
        }
    ]
};
