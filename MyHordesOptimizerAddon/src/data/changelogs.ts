export const changelogs: Record<string, string> = {
    '1.1.47': `
        [Amélioration] Ajout de liens vers les pages des villes des outils externes sur la page de choix de ville
    `,
    '1.1.46': `
        [Correction] Ajustement de la taille de certains filtres de la liste des citoyens
        [Correction] Il y avait un bug de dupliquation des liens vers les outils externes dans la popup d'utilisateur
    `,
    '1.1.45': `
        [Correction] Le compteur anti-abus ne fonctionnait pas correctement (mais on s'en rapproche de plus en plus !)

        [Amélioration] Remise en forme du calculateur de camping intégré à la page
    `,
    '1.1.44': `
        [Correction] Les champs de recherche de la page de chantiers, de la page de veille et de la liste des destinataires ne fonctionnaient pas
        [Correction] Le compteur anti-abus ne fonctionnait pas correctement (on croise les doigts pour que ce soit la bonne)

        [Amélioration] L'affichage du changelog permet également de consulter les anciens changelogs
    `,
    '1.1.43': `
        [Correction] La mise à jour de la carte de GH après une mise à jour des outils externes fonctionne de nouveau correctement sans recharger toute la page

        [Nouveauté] Deux nouvelles options permettent d'afficher des filtres sur les pages de liste des citoyens et d'omniscience
    `,
    '1.1.42': `
        [Correction] La mise à jour depuis la maison ne fonctionnait plus
    `,
    '1.1.41': `
        [Correction] Typo
        [Correction] Les appels ne fonctionnent plus
    `,
    '1.1.40': `
        [Correction] Fix de l'update des outils externes suite à la mise à jour de mi-saison
        [Correction] Affichage de la liste de courses dans la page

        [Amélioration] Remaniement des options du script pour plus de clarté

        [Nouveauté] Option pour trier la liste des citoyens et l'omniscience
    `,
    '1.1.39.0': `
        [Correction] Fix de l'update des outils externes suite à la mise à jour de mi-saison
    `,
    '1.1.38.0': `
        [Correction] Modifications dans la gestion de la wishlist
    `,
    '1.1.37.0': `
        [Correction] Corrige l'affichage des auras sur les objets de la liste de courses
    `,
    '1.1.36.0': `
        [Amélioration] Les tooltips améliorés indiquent désormais sur quel élément de la recette cliquer
    `,
    '1.1.35.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main

        [Amélioration] Affichage compact des recettes dans le tooltip amélioré
        [Amélioration] Ajout d'informations sur les propriétés des statuts et objets

        [Nouveauté] Personnalisation des informations affichées dans le tooltip via des options distinctes (attention, ça désactive les options en question il faut les réactiver)
        [Nouveauté] Ajout de la traduction sur les tooltips des objets
    `,
    '1.1.34.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main

        [Amélioration] Affichage compact des recettes dans le tooltip amélioré

        [Nouveauté] Personnalisation des informations affichées dans le tooltip via des options distinctes (attention, ça désactive les options en question il faut les réactiver)
        [Nouveauté] Ajout de la traduction sur les tooltips des objets
    `,
    '1.1.33.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main
        [Correction] Correction des cas où le tooltip n'avait pas le conseil "shift" ou le bouton pour fermer une fois figé
        [Correction] Empêche de figer un tooltip qui n'a pas le conseil "shift" affiché
        [Correction] Meilleur affichage des boutons "Wiki" et "Outils" du tooltip

        [Nouveauté] Personnalisation des informations affichées dans le tooltip via des options distinctes
        [Nouveauté] Ajout de la traduction sur les tooltips des objets
    `,
    '1.1.32.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main
        [Correction] Correction des cas où le tooltip n'avait pas le conseil "shift" ou le bouton pour fermer une fois figé
        [Correction] Empêche de figer un tooltip qui n'a pas le conseil "shift" affiché
        [Correction] Meilleur affichage des boutons "Wiki" et "Outils" du tooltip

        [Nouveauté] Personnalisation des informations affichées dans le tooltip via des options distinctes
        [Nouveauté] Ajout de la traduction sur les tooltips des objets
    `,
    '1.1.31.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main
        [Correction] Meilleur affichage des boutons "Wiki" et "Outils" du tooltip

        [Nouveauté] Personnalisation des informations affichées dans le tooltip via des options distinctes
        [Nouveauté] Ajout de la traduction sur les tooltips des objets
    `,
    '1.1.30.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main
        [Correction] Meilleur affichage des boutons "Wiki" et "Outils" du tooltip

        [Nouveauté] Personnalisation des informations affichées dans le tooltip via des options distinctes
        [Nouveauté] Ajout de la traduction sur les tooltips des objets
    `,
    '1.1.29.0': `
        [Correction] Changement de comportement complet pour le tooltip amélioré pour en fluidifier et corriger l'usage. Merci Emmet pour le coup de main
    `,
    '1.1.28.0': `
        [Correction] Le filtre sur les noms d'objets dans la page de la décharge ne fonctionnait plus
    `,
    '1.1.27.0': `
        [Correction] Meilleure stabilité à l'ouverture d'un sac
    `,
    '1.1.26.0': `
        [Correction] Tentative de fix des 429 en ville
    `,
    '1.1.25.0': `
        [Correction] Tentative de fix des 429 en ville
    `,
    '1.1.24.0': `
        [Correction] Le script fonctionne avec la nouvelle URL de gh
        [Correction] 429 quand on n'est pas en ville
        [Correction] Certains cas pour lesquels le sac ne s'ouvrait pas automatiquement avec l'option cochée

        [Divers] Retrait de la mise à jour BBH (BBH ne fonctionne plus)
    `,
    '1.1.23.0': `
        [Correction] Affichage du wiki dans le script
        [Correction] Affichage d'erreurs 503 lors de l'attaque
    `,
    '1.1.22.0': `
        [Correction] Mise à jour infinie
    `,
    '1.1.21.0': `
        [Correction] Fix l'erreur 400 au début d'une ville
    `,
    '1.1.20.0': `
        [Correction] Affichage de MHO suite au changement de saison
    `,
    '1.1.19.0': `
        [Correction] Affichage des chantiers
        [Correction] Compteur anti-abus
        [Correction] Affichage en cas d'erreur des outils externes avec CSS
    `,
    '1.1.18.0': `
        [Correction] Affichage des chantiers
    `,
    '1.1.17.0': `
        [Nouveauté] Le script envoie les informations de la page à FataMorgana y compris hors mode chaos
    `,
    '1.1.16.0': `
        [Correction] Le script ne s'affichait plus en cas de wishlist
    `,
    '1.1.15.0': `
        [Correction] Affichage de la banque dans la fenêtre "Outils"
        [Correction] Retrait de l'onglet "Liste de courses" de la fenêtre "Outils" devenu obsolète (à retrouver sur le site)
    `,
    '1.1.14.0': `
        [Correction] Correctif de l'envoi des données de fouineur à Fata Morgana
    `,
    '1.1.13.0': `
        [Correction] Envoi des données d'éclaireur et de fouineur
        [Correction] Anti-abus
    `,
    '1.1.12.0': `
        [Nouveauté] Ajout d'une option pour envoyer les informations issues des métiers (éclaireur, fouineur) à Fata Morgana
    `,
    '1.1.11.0': `
        [Nouveauté] Ajout d'une option pour envoyer les informations issues des métiers (éclaireur, fouineur) à Fata Morgana
    `,
    '1.1.10.1': `
        [Nouveauté] Ajout d'une option pour envoyer les informations issues des métiers (éclaireur, fouineur) à Fata Morgana
    `,
    '1.1.10.0': `
        [Nouveauté] Ajout d'une option pour envoyer les informations issues des métiers (éclaireur, fouineur) à Fata Morgana
    `,
    '1.1.9.0': `
        [Correction] Corrige la liste de courses
    `,
    '1.1.8.0': `
        [Correction] Corrige la liste de courses
    `,
    '1.1.7.0': `
        [Correction] Corrige l'appel en boucle sur la page de l'âme quand on n'est pas incarné
    `,
    '1.1.6.0': `
        [Correction] Affichage des PA manquants sur les chantiers en pandé

        [Amélioration] Performances globales & stabilité

        [Nouveauté] Il est possible d'afficher un compteur de caractères sur le chatcase
        [Nouveauté] Il est possible de relire les anciennes notifications (tant qu'on n'a pas refresh sa page)
    `,
    '1.1.5.0': `
        [Correction] Affichage des PA manquants sur les chantiers en pandé

        [Amélioration] Performances globales & stabilité

        [Nouveauté] Il est possible d'afficher un compteur de caractères sur le chatcase
        [Nouveauté] Il est possible de relire les anciennes notifications (tant qu'on n'a pas refresh sa page)
    `,
    '1.1.4.0': `
        [Correction] Réparations diverses sur les recettes des objets
    `,
    '1.1.3.0': `
        [Correction] Affiche correctement les doublons d'éléments dans les recettes sur les objets
    `,
    '1.1.2.0': `
        [Correction] Affiche correctement les doublons d'éléments dans les recettes sur les objets
    `,
    '1.1.1.0': `
        [Correction] Ajout de diverses propriétés manquantes sur les objets
        [Correction] Corrige l'envoi du sac à dos à MHO
    `,
    '1.1.0.0': `
        Mise à jour de compatibilité (ou presque) avec la S18
    `,
    '1.0.33.0': `
        [Correction] Divers correctifs d'affichage
    `,
    '1.0.32.0': `
        [Correction] Textes manquants dans certains tooltips
    `,
    '1.0.31.0': `
        [Nouveauté] Ajout d'informations sur les tooltips améliorés des statuts
    `,
    '1.0.30.0': `
        [Correction] Libellé dans le tooltip des objets (l'info "en sac" était affichée au lieu de "en banque")
        [Correction] La mise à jour en chaos ne fonctionnait pas
    `,
    '1.0.29.0': `
        [Correction] Les boutons pour incrémenter les valeurs des chantiers avaient disparu
    `,
    '1.0.28.0': `
        [Correction] Correctif du calcul du camping sur la case


        html[lang]
        lang
        fr
    `,
    '1.0.27.0': `
        [Correction] Correctif du calcul du camping sur la case


        html[lang]
        lang
        fr
    `,
    '1.0.26.0': `
        [Correction] La copie du registre ne copie plus les lignes masquées par le filtre

        [Modification] Retrait de la notion de "priorité" dans la liste de courses et affichage des couleurs en fonction de la position
    `,
    '1.0.25.0': `
        [Correction] L'enregistrement à la tour de guet ne fait plus planter l'affichange de l'attaque estimée
    `,
    '1.0.24.0': `
        [Correction] On essaye de faire en sorte que les barres de réparation en pandé ne débordent plus
        [Correction] Retrait du localhost dans la liste des matchs
    `,
    '1.0.23.0': `
        [Correction] On essaye de faire en sorte que les barres de réparation en pandé s'affichent tout le temps, et pas juste quand elles ont envie
    `,
    '1.0.22.0': `
        [Correction] Divers bugs d'affichage
    `,
    '1.0.21.0': `
        [Nouveauté] La mise à jour des outils externes avec l'option statut activé met également à jour l'information indiquant si le bain a été pris ou non
    `,
    '1.0.20.0': `
        [Mise à jour du nom du script] Le script s'appellera désormais MHO Addon
    `,
    '1.0.19.0': `
        [Correction] Le compteur personnalisé de l'anti-abus ne comptait qu'une minute
    `,
    '1.0.18.0': `
        [Correction] Problèmes d'affichage
        [Correction] Erreur lors de l'ajout d'un objet à la liste de courses
    `,
    '1.0.17.0': `
        [Correction] La récupération automatique de l'identifiant externe est de nouveau disponible

        [Amélioration] Diverses améliorations de performance (en tout cas on espère :D)

        [Nouveauté] Ajout d'une option permettant de pré-remplir un message dans la maison quand vous souhaitez envoyer un objet et que le message est vide. Le message est pré-rempli avec des valeurs prises au hasard parmi celles dispo pour votre langue. Actuellement, il n'y a qu'un seul message par langue mais vous pouvez me faire vos suggestions pour que j'en ajoute ;)
        [Nouveauté] Ajout d'une option pour afficher en jeu les expéditions issues de MHO sur lesquelles vous êtes inscrit
    `,
    '1.0.16.0': `
        [Correction] Déploiement d'un hotfix suite à l'introduction d'un bug. La récupération automatique de votre identifiant externe pour les apps n'est pour l'instant plus disponible.
    `,
    '1.0.15.0': `
        [Amélioration] Les mises à jour disponibles sont désormais signalées par un indicateur visuel et un nouveau lien fait son apparition dans le menu en cas de mise à jour disponible
        [Amélioration] Les changelogs ne sont plus affichés au chargement de l'application mais signalés par un indicateur visuel sur le menu

        [Nouveauté] Une nouvelle option fait son apparition pour Fata Morgana : l'envoi du nombre de zombies tués
    `,
    '1.0.14.0': `
        [Correction] Traductions manquantes
        [Correction] Notification de fin de fouille
        [Correction] Divers bugs depuis la version 1.0.8.0

        [Amélioration] Une nouvelle option est disponible pour mettre à jour Fata Morgana en ville dévastée
    `,
    '1.0.13.0': `
        [Correction] Traductions manquantes
        [Correction] Notification de fin de fouille
        [Correction] Divers bugs depuis la version 1.0.8.0

        [Amélioration] Une nouvelle option est disponible pour mettre à jour Fata Morgana en ville dévastée
    `,
    '1.0.12.0': `
        [Correction] Traductions manquantes
        [Correction] Notification de fin de fouille

        [Amélioration] Une nouvelle option est disponible pour mettre à jour Fata Morgana en ville dévastée
    `,
    '1.0.11.0': `
        [Correction] Traductions manquantes
        [Correction] Notification de fin de fouille

        [Amélioration] Une nouvelle option est disponible pour mettre à jour Fata Morgana en ville dévastée
    `,
    '1.0.10.0': `
        [Correction] Traductions manquantes
        [Correction] Notification de fin de fouille

        [Amélioration] Une nouvelle option est disponible pour mettre à jour Fata Morgana en ville dévastée
    `,
    '1.0.9.0': `
        [Correction] Lors de l'enregistrement des fouilles, les fouilles de celui qui enregistre n'étaient jamais prises en compte
        [Correction] Correction d'un bug d'affichage des liens vers les profils externes des utilisateurs
        [Correction] Quelques corrections sur l'Anti-Abus (c'est pas fini, et j'ai l'impression de pas en voir le bout 🥲)
        [Correction] Correction d'un bug d'intégration avec Fata Morgana

        [Suppression] Retrait de la fonctionnalité de notification lors d'un nouveau message, puisqu'elle existe maintenant nativement dans MyHordes
    `,
    '1.0.8.0': `
        [Amélioration] Une nouvelle option est disponible pour mettre à jour Fata Morgana en ville dévastée
    `,
    '1.0.7.0': `
        [Correction] Lors de l'enregistrement des fouilles, les fouilles de celui qui enregistre n'étaient jamais prises en compte
        [Correction] Correction d'un bug d'affichage des liens vers les profils externes des utilisateurs
        [Correction] Quelques corrections sur l'Anti-Abus (c'est pas fini, et j'ai l'impression de pas en voir le bout 🥲)
        [Correction] Correction d'un bug d'intégration avec Fata Morgana

        [Suppression] Retrait de la fonctionnalité de notification lors d'un nouveau message, puisqu'elle existe maintenant nativement dans MyHordes
    `,
    '1.0.6.0': `
        [Correction] Affichage et enregistrement des estimations de la tour de guet dans l'extension Firefox

        [Amélioration] Plus besoin d'appuyer sur Entrée pour démarrer une traduction, elle se lancera automatiquement à chaque recherche de plus de 2 lettres
        [Amélioration] Indicateur visuel sur le bouton de copie du registre quand la copie est effectuée

        [Nouveauté] Ajout de liens vers les profils externes dans la popup d'un utilisateur
    `,
    '1.0.5.0': `
        [Correction] La première prise en banque ne compte de nouveau plus dans l'anti-abus
        [Correction] Traductions

        [Nouveauté] Champs de recherche sur la page de décharge
        [Nouveauté] Affichage du % de voracité sur la jauge
    `,
    '1.0.4.0': `
        [Correction] Le bouton pour ajouter un objet à la liste de courses n'apparait désormais plus sur les objets de l'outil Banque
        [Correction] L'erreur de "CloneInto" devrait être (enfin) corrigée
        [Correction] Le wiki des recettes est de nouveau accessible dans l'extension
    `,
    '1.0.3.0': `
        [Correction] Corrige l'affichage du bouton de mise à jour des outils externes sous chrome
        [Correction] Corrige la récupération de la liste de courses quand elle existe
    `,
    '1.0.2.0': `
        [Correction] Corrige l'affichage de l'icône de succès après une mise à jour des outils externes sur petit écran en mode compact
        [Correction] Corrige l'affichage du loader sur les tooltips qui était en allemand alors qu'il ne devait pas avoir de texte
        [Correction] L'affichage du tooltip d'APAG est désormais plus propre
        [Correction] Corrige le calcul du camping qui prenait en compte la mauvaise valeur pour le bâtiment

        [Nouveauté] Ajout d'un bouton pour cocher tous les paramètres
    `,
    '1.0.1.0': `
        Cette version contient des changements techniques importants. Pour cette raison, il faudra peut être remettre en place toutes vos options.

        [Correction] Corrige le problème de chargement intempestif bloquant MyHordes.

        [Amélioration] Ajout d'une option sur chaque outil externe pour choisir si on souhaite qu'il soit rafraîchi au changement d'onglet ou non. Si vous comptiez sur cette fonctionnalité qui était déjà en place, n'oubliez pas d'aller l'activer dans les options.
    `,
    '1.0.0.0': `
        Cette version contient des changements techniques importants. Pour cette raison, il faudra peut être remettre en place toutes vos options.

        [Correction] Corrige le problème de chargement intempestif bloquant MyHordes.

        [Amélioration] Ajout d'une option sur chaque outil externe pour choisir si on souhaite qu'il soit rafraîchi au changement d'onglet ou non. Si vous comptiez sur cette fonctionnalité qui était déjà en place, n'oubliez pas d'aller l'activer dans les options.
    `,
    '1.0.0': `
        Cette version contient des changements techniques importants. Pour cette raison, il faudra peut être remettre en place toutes vos options.

        [Correction] Corrige le problème de chargement intempestif bloquant MyHordes.

        [Amélioration] Ajout d'une option sur chaque outil externe pour choisir si on souhaite qu'il soit rafraîchi au changement d'onglet ou non. Si vous comptiez sur cette fonctionnalité qui était déjà en place, n'oubliez pas d'aller l'activer dans les options.
    `,
    '1.0.0-beta.73': `
        [Correction] Affichage des calculs de camping
    `,
    '1.0.0-beta.72': `
        [Correction] Lien de mise à jour du script en cas de script pas à jour
        [Correction] Mise à jour du calculateur de camping en S16
        [Correction] Correction de l'affichage des réparations en pandemonium
        [Correction] Corrige la prise de ration dans l'anti-abus

        [Amélioration] Le script ne devrait plus afficher plusieurs erreurs simultanées en cas de multiples appels en erreur en même temps
        [Amélioration] Les objets trouvables dans un bâtiment sont triés par probabilité
    `,
    '1.0.0-beta.71': `
        [Correction] Correction de l'affichage des informations complémentaires sur un bâtiment

        [Amélioration] Mise en place de méthodes pour limiter le nombre d'appels à l'API MyHordes
    `,
    '1.0.0-beta.70': `
        [Correction] Correctifs de l'affichage des chantiers à réparer en pandé

        [Amélioration] Les erreurs issues de MH sont désormais mieux gérées et affichées
        [Amélioration] Le bloc des informations complémentaires indique désormais les objets trouvables dans le bâtiment
    `,
    '1.0.0-beta.69': `
        [Amélioration] Le filtre pour masquer les chantiers terminés ne masque plus les chantiers ayant pris des dégâts
        [Amélioration] Correctifs sur les estimations
        [Amélioration] Le bloc des informations complémentaires indique désormais si le bâtiment est vide
    `,
    '1.0.0-beta.68': `
        [Correction] La copie du registre retire désormais les espaces en trop en début de ligne

        [Amélioration] Les différents filtres ne tiennent désormais plus compte des accents
        [Amélioration] Amélioration visuelle du bloc d'informations complémentaires

        [Nouveauté] Ajout d'un filtre pour masquer les chantiers terminés
    `,
    '1.0.0-beta.67': `
        [Correction] Correction d'un bug l'enregistrement de la valeur du 0 de la tdg

        [Nouveauté] Un message sera désormais affiché au chargement du script si celui-ci n'est pas à sa version la plus récentes.
    `,
    '1.0.0-beta.66': `
        [Correction] Correction d'un bug l'enregistrement de la valeur du 0 de la tdg

        [Nouveauté] Un message sera désormais affiché au chargement du script si celui-ci n'est pas à sa version la plus récentes.
    `,
    '1.0.0-beta.65': `
        [Correction] Correction d'un bug l'enregistrement de la valeur du 0 de la tdg

        [Nouveauté] Un message sera désormais affiché au chargement du script si celui-ci n'est pas à sa version la plus récentes.
    `,
    '1.0.0-beta.64': `
        [Correction] Correction d'un bug l'enregistrement des valeurs de la tdg

        [Amélioration] Tentative d'amélioration des tooltips pour afficher un scroll en cas de recettes
        [Amélioration] Le tooltip amélioré affiche désormais le lieu de dépose d'un objet de la liste de courses
        [Amélioration] La liste de course embarquée dans la page est désormais triée par priorité et n'affiche que les objets présents sur la case
    `,
    '1.0.0-beta.63': `
        [Correction] Correction d'un bug sur les options d'escorte qui n'étaient pas forcément les bonnes après une actualisation
    `,
    '1.0.0-beta.62': `
        [Correction] Bug de recherche dans le nom d'un chantier
    `,
    '1.0.0-beta.61': `
        [Correction] Divers correctifs d'affichage des paramètres en particulier sur mobile ou sur petit écran
    `,
    '1.0.0-beta.60': `
        [Amélioration] Déplacement de la barre de traduction qui pouvait chevaucher des éléments du jeu
        [Amélioration] Amélioration de l'affichage des paramètres en particulier sur mobile ou sur un écran assez petit pour provoquer un défilement dans les paramètres
    `,
    '1.0.0-beta.59': `
        Attention certains changements peuvent avoir impacté vos options sélectionnées, assurez-vous que tout est en ordre !

        [Correction] Corrige l'affichage de certaines images qui ne s'affichaient pas toujours
        [Correction] Corrige la prise en compte du métier dans l'outil intégré de calcul de camping

        [Amélioration] Réorganisation du menu dans lequel les options commençaient à prendre trop de place
        [Amélioration] Séparation de certaines options (mise à jour en ville dévastée et envoi du nombre de zombies tués / champs de recherches)

        [Nouveauté] Ajout d'une option pour enregistrer les estimations de la TDG dans MHO, consulter les valeurs enregistrées et les copier pour le forum
        [Nouveauté] Ajout d'une option pour afficher un champ de recherche sur le registre
        [Nouveauté] Ajout d'une option pour choisir ses options d'escorte à appliquer à l'activation de l'attente d'escorte
        [Nouveauté] Ajout d'une option pour notifier l'utilisateur en cas d'inactivité de plus de 5 minutes si il n'a pas relâché l'escorte ou qu'il ne s'est pas mis en attente d'escorte
    `,
    '1.0.0-beta.58': `
        [Correction] Corrige certains comportements du compteur anti-abus

        [Nouveauté] Ajoute un bouton de copie du registre

        [Remise en place] Réintègre l'option d'envoi des améliorations de maison. Un nouveau bouton sera créé sur la page des améliorations
    `,
    '1.0.0-beta.57': `
        [Correction] Corrige l'affichage du bouton de mise à jour sur petit écran si le mode compact n'est pas activé dans les options
        [Correction] Corrige certains comportements du compteur anti-abus
        [Correction] Devrait corriger l'affichage des images qui était parfois cassé

        [Amélioration] Le bouton d'accès aux options du script est désormais aggrandi sur les petits écrans
    `,
    '1.0.0-beta.56': `
        [Correction] Corrige l'affichage du nombre de zombies morts sur la case
    `,
    '1.0.0-beta.55': `
        [Correction] Le nombre de charges d'APAG restantes était mal enregistré
    `,
    '1.0.0-beta.54': `
        [Nouveauté] Ajout d'une option permettant d'activer un mode compact sur mobile pour le bouton de mise à jour des outils externes
    `,
    '1.0.0-beta.53': `
        [Nouveauté] Ajout d'une option permettant d'activer un mode compact sur mobile pour le bouton de mise à jour des outils externes
    `,
    '1.0.0-beta.52': `
        [Correction] Correction de l'affichage des tooltips améliorés suite à la mise à jour de MyHordes
        [Correction] Correction d'un bug de duplication des lignes des prises en banque dans l'outil de suivi de l'anti-abus

        [Attention] Les améliorations de la maison ne sont plus envoyées à MHO et à GH suite à là mise à jour de MyHordes. J'essaierai de trouver une solution pour rétablir cette fonctionnalité mais sans certitudes.
    `,
    '1.0.0-beta.51': `
        [Correction] Correction de divers comportements

        [Nouveauté] Ajout d'une option pour afficher un compteur de prises en banque
    `,
    '1.0.0-beta.50': `
        [Correction] Correction de divers comportements

        [Amélioration] Devrait désormais fonctionner avec Greasemonkey

        [Nouveauté] Ajout d'une option pour ouvrir automatiquement le menu "Utiliser un objet de son sac"
    `,
    '1.0.0-beta.49': `
        [Correction] Typo
        [Correction] Affichage du warning en cas de registre incomplet
    `,
    '1.0.0-beta.48': `
        [Correction] La valeur de la clôture est envoyée correctement à GH
    `,
    '1.0.0-beta.47': `
        [Correction] Boucle infinie quand on était pris en escorte (oups)
        [Correction] Affichage des pa manquants pour que le chantier ne soit pas détruit dans la nuit
    `,
    '1.0.0-beta.46': `
        [Correction] La copie de la carte de BBH fonctionne à nouveau
        [Correction] La taille des tooltips d'aide est de nouveau convenable
    `,
    '1.0.0-beta.45': `
        [Correction] Suppression d'erreurs en console
        [Correction] La carte ne s'ouvrait plus
    `,
    '1.0.0-beta.44': `
        [Amélioration] Visuel de la note qui est affichée si l'option de fouilles est activée mais que les données de fouilles ne sont pas complètes
    `,
    '1.0.0-beta.43': `
        [Correction] Ajout de traductions manquantes

        [Amélioration] Une note est affichée sur la carte si l'option de fouilles est activée mais que les données de fouilles ne sont pas complètes (lignes du registre non chargées)
    `,
    '1.0.0-beta.42': `
        [Correction] Position de l'icône MHO

        [Amélioration] Lors d'une mise à jour de GH, la page n'est plus intégralement rechargée, seulement sa carte

        [Suppression] Suite à une discussion avec l'équipe de MyHordes (qui fait elle-même suite à une discussion intense sur le forum monde), la fonctionnalité d'informations complémentaires sur les citoyens - appelée par certains "Omniscience++" ou "O++" pour les plus flemmards - a été supprimée.
    `,
    '1.0.0-beta.41': `
        [Correction] Réparation du menu qui passait sous les éléments d'interface de MH suite à des modifications de leur côté
    `,
    '1.0.0-beta.40': `
        [Amélioration] Traductions et wording divers
        [Amélioration] Regroupement des options de champs de recherches en une seule option

        [Nouveauté] Ajout d'un simulateur de camping directement disponible sur la case
        [Nouveauté] Ajout d'une option permettant d'afficher des notes sur une case, issues de la carte de MHO
    `,
    '1.0.0-beta.39': `
        [MH][Amélioration] Le rafraichissement de la liste de courses devrait fonctionner correctement
    `,
    '1.0.0-beta.38': `
        [MH][Correction] Le lien vers le site était invalide

        [MH][Amélioration] Traductions espagnoles (merci Bacchus)
        [MH][Amélioration] La mise à jour de la liste de courses depuis la fenêtre "Outils" a été retirée et confiée explusivement au site
    `,
    '1.0.0-beta.37': `
        [MH][Amélioration] Traductions espagnoles (merci Bacchus)
        [MH][Amélioration] La mise à jour de la liste de courses depuis la fenêtre "Outils" a été retirée et confiée exclusivement au site
    `,
    '1.0.0-beta.36': `
        [MH][Amélioration] Ajout des chances de réussite du manuel dans le tooltip associé
    `,
    '1.0.0-beta.35': `
        [MH][Nouveauté] Ajout d'une option pour filtrer les destinataires des messages
    `,
    '1.0.0-beta.34': `
        [MH][Nouveauté] Ajout d'une option pour recevoir des notifications navigateur en cas de changement dans le nombre de notifications MH
    `,
    '1.0.0-beta.33': `
        [MH][Correction] Correction du lien vers la doc utilisé dans tampermonkey

        [MH][Amélioration] Déplacement du lien du site tout en haut de la liste des options (j'espère que cette fois tout le monde sera au courant qu'il existe 😊)
    `,
    '1.0.0-beta.32': `
        [MH][Correction] Correction des styles qui écrasaient les puces de MH dans les forums (désolée :( )

        [MH][Amélioration] Ajout de traductions (anglaises et allemandes) - merci Xochi, Crazy Unicorn, Nekomine !
    `,
    '1.0.0-beta.31': `
        [MH][Correction] Digs => searches

        [MH][Amélioration] Prise en compte de la quantité d'objets dans les sacs dans la liste de courses
    `,
    '1.0.0-beta.30': `
        [MH][Correction] La liste des citoyens présents sur la case envoyée à MHO était vide si il n'y avait qu'une personne sur la case
    `,
    '1.0.0-beta.29': `
        [MH][Amélioration] Replacement du bouton de suppression de l'id externe pour les apps par un bouton de modification
        [MH][Amélioration] Correctifs visuels sur la page d'informations complémentaires sur les citoyens

        [MH][Nouveauté] Ajout d'une option pour remonter à MHO le résultat de vos fouilles. Des outils de lectures et de modification sont à votre disposition sur le site
    `,
    '1.0.0-beta.28': `
        [MH][Correction] Correction de la mise à jour des outils externes si 0 charges d'APAG
    `,
    '1.0.0-beta.27': `
        [MH-beta][Correction] Réparation de la liste des objets : le Serpent Agonisant n'existait pas dedans, ce qui provoquait des erreurs en cas de mise à jour avec un serpent agonisant
        [MH][Correction]La carte intégrée de GH est réparée (mais non, elle n'intègre toujours pas les expéditions)

        [MH][Amélioration] La liste des citoyens améliorée, en ville, est désormais mieux organisée, et toujours rangée par ordre alphabétique. Contrepartie : elle est légèrement plus longue à charger
        [MH][Amélioration] Le Passage en Force fait désormais partie des AH enregistrées
    `,
    '1.0.0-beta.26': `
        [MH-beta][Amélioration] MHO supporte maintenant la mise à jour de FataMorgana en beta
    `,
    '1.0.0-beta.25': `
        [MH-beta][Correction] Correctif de l'envoi d'informations dans GH
    `,
    '1.0.0-beta.24': `
        [Correction] Remise en place de l'URL d'appels API qui avait disparue (magic everywhere)

        [MH-beta] désactivation des appels vers BBH & Fata. Ils seront réactivés en cas d'existance d'une version compatible beta. Les options restent toujours visibles mais n'auront pas d'effet
    `,
    '1.0.0-beta.23': `
        Ajout du script sur le site de la bêta de MH - aucune nouveauté
    `,
    '1.0.0-beta.22': `
        Ajout du script sur le site de la bêta de MH - aucune nouveauté
    `,
    '1.0.0-beta.21': `
        Ajout du script sur le site de la bêta de MH - aucune nouveauté
    `,
    '1.0.0-beta.20': `
        [Correction] Divers correctifs pour anticiper des plantages
    `,
    '1.0.0-beta.19': `
        [Correction] Le script plante si l'utilisateur n'a pas d'actions héroïques
    `,
    '1.0.0-beta.18': `
        [Correction] L'état "Corps Sain" n'était jamais envoyé à GH
    `,
    '1.0.0-beta.17': `
        [Correction] Il était impossible d'enregistrer le sac à dos dans MHO si vous aviez deux fois le même objet dedans (oups)
    `,
    '1.0.0-beta.16': `
        [Nouveauté] Deux nouvelles options sont disponibles pour mettre à jour GH : la mise à jour automatique des pouvoirs héroïques et la mise à jour des améliorations de maison ! Pensez à les activer dans vos options !
    `,
    '1.0.0-beta.15': `
        [Correction] Envoi des bonnes informations à GH
    `,
    '1.0.0-beta.14': `
        [Nouveauté] Possibilité d'enregistrer des informations complémentaires dans MHO. Pensez à cocher les options associées !
    `,
    '1.0.0-beta.13': `
        [Correction] Correctif du comportement à la mise à jour de GH
    `,
    '1.0.0-beta.12': `
        [Correction] Correctif des erreurs liées à la mise à jour du contenu des sacs
    `,
    '1.0.0-beta.11': `
        [Correction] L'affichage du bouton suite à des mises à jour devrait être corrigé !
    `,
    '1.0.0-beta.10': `
        [Nouveauté] Il est désormais possible d'enregistrer le contenu de son sac via le bouton de mise à jour des outils externes. Les sacs sont consultables et modifiables depuis la liste des citoyens du site web de MHO.
        N'oubliez pas d'activer l'option associée depuis vos paramètres pour rendre cette mise à jour possible !

        [Traductions] Merci à isaaclw qui nous a fourni quelques traductions en anglais ! Si vous voulez contribuer à la traduction, n'hésitez pas à rejoindre le discord, ou à me contacter en MP
    `,
    '1.0.0-beta.09': `
        [Nouveauté] Il est désormais possible d'enregistrer le contenu de son sac via le bouton de mise à jour des outils externes. Les sacs sont consultables et modifiables depuis la liste des citoyens du site web de MHO.
        N'oubliez pas d'activer l'option associée depuis vos paramètres pour rendre cette mise à jour possible !

        [Traductions] Merci à isaaclw qui nous a fourni quelques traductions en anglais ! Si vous voulez contribuer à la traduction, n'hésitez pas à rejoindre le discord, ou à me contacter en MP
    `,
    '1.0.0-beta.08': `
        [Correction] Correctifs divers pour essayer de faire fonctionner le script pour les utilisateurs ios.
        [Correction] Retrait d'un objet remonté par l'API MH mais qui n'existe plus
        [Correction] Affichage d'une erreur lorsqu'on met à jour les app externes sans les avoir toutes cochées (alors que la mise à jour se passe bien)
    `,
    '1.0.0-beta.07': `
        [Correction] Correctif de l'enregistrement de l'état de case épuisée sur GH
    `,
    '1.0.0-beta.06': `
        [Correction] Correctif de l'enregistrement du nombre de zombies tués sur GH

        [Important] Nous avons changé la structure de la base de données. Nous n'avons pas récupéré les listes de courses existantes. Si vous avez besoin de conserver votre liste de course, merci de nous contacter sur le discord de MHO pour qu'on vous la récupère.
    `,
    '1.0.0-beta.05': `
        [Nouveauté] Interface permettant de récupérer les évolutions de chaque citoyen (dans la page de citoyens)
        [Nouveauté] Nouvelle option permettant d'envoyer à GH le nombre de zombies tués sur la case afin de mettre des marqueurs zombies

        [Important] Nous avons changé la structure de la base de données. Nous n'avons pas récupéré les listes de courses existantes. Si vous avez besoin de conserver votre liste de course, merci de nous contacter sur le discord de MHO pour qu'on vous la récupère.
    `,
    '1.0.0-beta.04': `
        [Important] Nous avons changé la structure de la base de données. Nous n'avons pas récupéré les listes de courses existantes. Si vous avez besoin de conserver votre liste de course, merci de nous contacter sur le discord de MHO pour qu'on vous la récupère.
    `,
    '1.0.0-beta.03': `
        [Important] Nous avons changé la structure de la base de données. Nous n'avons pas récupéré les listes de courses existantes. Si vous avez besoin de conserver votre liste de course, merci de nous contacter sur le discord de MHO pour qu'on vous la récupère.
    `,
    '1.0.0-beta.02': `
        [Important] Nous avons changé la structure de la base de données. Nous n'avons pas récupéré les listes de courses existantes. Si vous avez besoin de conserver votre liste de course, merci de nous contacter sur le discord de MHO pour qu'on vous la récupère.
    `,
    '1.0.0-beta.01': `
        [Important] Nous avons changé la structure de la base de données. Nous n'avons pas récupéré les listes de courses existantes. Si vous avez besoin de conserver votre liste de course, merci de nous contacter sur le discord de MHO pour qu'on vous la récupère.
    `,
    '1.0.0-alpha.73': `
        [Correction] Réparation de la recherche de chantiers
    `,
    '1.0.0-alpha.72': `
        [Suppression] Retrait de la fonctionnalité expérimentale de prévention des actions dangereuses (cyanure / dépendance)
    `,
    '1.0.0-alpha.71': `
        [Correction] Réparation du filtre sur les chantiers
    `,
    '1.0.0-alpha.70': `
        [Nouveauté] Ajout du calcul du nombre de zombies qui vont mourir par désespoir sur une case
        [Nouveauté] Il n'est plus nécessaire de renseigner son id d'app externe
    `,
    '1.0.0-alpha.69': `
        [Nouveauté] Ajout du calcul du nombre de zombies qui vont mourir par désespoir sur une case
        [Nouveauté] Il n'est plus nécessaire de renseigner son id d'app externe
    `,
    '1.0.0-alpha.68': `
        [Nouveauté] Ajout du calcul du nombre de zombies qui vont mourir par désespoir sur une case
        [Nouveauté] Il n'est plus nécessaire de renseigner son id d'app externe soi-même
    `,
    '1.0.0-alpha.67': `
        [Correction] On essaie d'améliorer les performances
    `,
    '1.0.0-alpha.66': `
        [Nouveauté] Ajout d'un certificat de sécurité
    `,
    '1.0.0-alpha.65': `
        [Correction] Ajout d'une phrase explicative sur le champ d'ajout d'un objet à la liste de courses

        [Nouveauté] Dans la liste de courses, ajout de la possibilité de sélectionner un endroit où rapporter l'objet (banque ou zone de rapatriement)
    `,
    '1.0.0-alpha.64': `
        [Correction] Ajout d'une phrase explicative sur le champ d'ajout d'un objet à la liste de courses

        [Nouveauté] Dans la liste de courses, ajout de la possibilité de sélectionner un endroit où rapporter l'objet (banque ou zone de rapatriement)
    `,
    '1.0.0-alpha.63': `
        [Correction] Ajout d'une phrase explicative sur le champ d'ajout d'un objet à la liste de courses

        [Nouveauté] Dans la liste de courses, ajout de la possibilité de sélectionner un endroit où rapporter l'objet (banque ou zone de rapatriement)
    `,
    '1.0.0-alpha.62': `
        [Amélioration] Après avoir copié une carte, le texte du bouton informe explicitement l'utilisateur
    `,
    '1.0.0-alpha.61': `
        [Correction] Correction du lien discord qui n'a marché qu'une seule fois avant de décider de manière unilatérale de devenir inutilisable
    `,
    '1.0.0-alpha.60': `
        [Nouveauté] Remplacement du lien mail par un lien discord
        [Nouveauté] Les ajouts d'interface en jeu sont distinctement identifiés comme venant de MHO
    `,
    '1.0.0-alpha.59': `
        [Correction] L'affichage de "l'aura" de priorité ne fonctionnait plus
    `,
    '1.0.0-alpha.58': `
        [Correction] Affichage de la liste de courses dans la page
        [Correction] Affichage de certaines icônes dans les recettes
    `,
    '1.0.0-alpha.57': `
        [Correction] Affichage de la liste de courses dans la page
    `,
    '1.0.0-alpha.56': `
        [Nouveauté] Traduction espagnole (Merci Nekomine !)
    `,
    '1.0.0-alpha.55': `
        [Nouveauté] Traduction espagnole (Merci Nekomine !)
    `,
    '1.0.0-alpha.54': `
        [Correction] En cas d'absence de wishlist enregistrée, l'écran de wishlist ne fonctionnait pas
    `,
    '1.0.0-alpha.53': `
        [Correction] Le positionnement du champ de traduction ne bloque plus le bouton de sondage
    `,
    '1.0.0-alpha.52': `
        [Correction] Images des objets

        [Nouveauté] Ajout d'un bouton pour retirer son ID d'app externes de MHO sans avoir à passer par les paramètres de l'extension
        [Nouveauté] Ajout de la date de dernière mise à jour de la liste des courses dans la page de liste de courses
    `,
    '1.0.0-alpha.51': `
        [Correction] Migration de serveur pour tenter de ne plus avoir de problèmes de quota (on croise les doigts pour que ça marche toujours après ça...). La migration ne concerne malheureusement pas encore le camping et la liste des bâtiments
    `,
    '1.0.0-alpha.50': `
        [Correction] Migration de serveur pour tenter de ne plus avoir de problèmes de quota (on croise les doigts pour que ça marche toujours après ça...). La migration ne concerne malheureusement pas encore le camping et la liste des bâtiments
    `,
    '1.0.0-alpha.49': `
        [Nouveauté] Liste des bâtiments et probabilités sur les objets qu'on peut trouver dedans, tout ça dans "Wiki" > "Bâtiments"

        [Expérimental] Estimnation des chances de survie en camping. Ca se passe dans "Outils" > "Camping"
    `,
    '1.0.0-alpha.48': `
        [Suppression] Suppression de la fonctionnalité d'estimation. Le mode de calcul a comme prévu été changé, rendant la fonctionnalité inefficace
    `,
    '1.0.0-alpha.47': `
        [Amélioration] Ajout du stock en banque et du stock souhaité dans le tooltip avancé
    `,
    '1.0.0-alpha.46': `
        [Amélioration] Traductions pour la fonctionnalité d'estimation de l'attaque (plus que quelques jours pour l'utiliser avant qu'elle ne disparaisse)
    `,
    '1.0.0-alpha.45': `
        [Nouveauté] Nouvelle option, permettant d'afficher le seuil (70% + 1pa) auquel réparer les chantiers pour qu'ils ne soient pas détruits en Pandé
    `,
    '1.0.0-alpha.44': `
        [Expérimental] Fonctionnalité (temporaire) d'estimation de l'attaque
    `,
    '1.0.0-alpha.43': `
        [Expérimental] Fonctionnalité (temporaire) d'estimation de l'attaque
    `,
    '1.0.0-alpha.42': `
        [Correction] Oups, j'avais oublié de réactiver l'option pour la carte, elle était bien implémentée mais impossible de l'activer ^^'
        [Correction] Je tente d'améliorer la fonctionnalité de notification à la fin de la fouille depuis quelques temps, ça semble être plus stable

        [Amélioration] Ajout des PA du café dans le tooltip amélioré
    `,
    '1.0.0-alpha.41': `
        [Nouveauté] Réimplémentation de la fonctionnalité de consultation de carte, qui avait été supprimée.
        Désormais, les cartes sont reconstruites à partir des données récupérées en cliquant sur le bouton "copier".
        Il est donc normal que le design de votre carte ne soit pas identique à celui de votre outil préféré !
    `,
    '1.0.0-alpha.40': `
        [Nouveauté] Réimplémentation de la fonctionnalité de consultation de carte, qui avait été supprimée.
        Désormais, les cartes sont reconstruites à partir des données récupérées en cliquant sur le bouton "copier".
        Il est donc normal que le design de votre carte ne soit pas identique à celui de votre outil préféré !
    `,
    '1.0.0-alpha.39': `
        [Temporaire] Utilisation de l'anglais à la place de l'espagnol tant qu'on n'a pas les traductions espagnoles
    `,
    '1.0.0-alpha.38': `
        [Correction] L'ajout d'une élément de liste de courses à cette liste depuis la page de liste de courses devrait désormais fonctionner correctement
    `,
    '1.0.0-alpha.37': `
        [Correction] Retrait de l'option pour copier les cartes des outils externes suite à un bug Tampermonkey
        [Correction] L'ajout d'une élément de liste de courses à cette liste depuis la page de liste de courses devrait désormais fonctionner correctement
    `,
    '1.0.0-alpha.36': `
        [Correction] L'activation du script provoquait la disparition d'un élément d'arrière-plan du site
    `,
    '1.0.0-alpha.35': `
        [Correction] Quand on refusait une autorisation, on ne pouvait pas accéder au site

        [Amélioration] Ajout du lien vers la documentation dans la description du script, afin que celui-ci soit accessible avant toute installation
    `,
    '1.0.0-alpha.34': `
        [Correction] Tris pas toujours fonctionnels
        [Correction] Affichage du libellé du bouton sur Fata Morgana / Chrome
    `,
    '1.0.0-alpha.33': `
        [Amélioration] Si un des outils externes ne se met pas bien à jour, on affiche le détail des succès et échecs

        [Nouveauté] Prise en chage de Violentmonkey
    `,
    '1.0.0-alpha.32': `
        [Correction] Récupération de la carte depuis GH suite à la nouvelle version (mais la carte est toujours incomplète :'( )

        [Attention] Suite à la mise à jour en V2 de Gest'Hordes, la mise à jour via le script et le site de MHO n'est plus fonctionnelle. Nous travaillons activement à une résolution du problème.
    `,
    '1.0.0-alpha.31': `
        [Nouveauté] Ajout d'un champ de sélection d'objets avec recherche dans la liste de courses
        [Nouveauté] Ajout d'une fonctionnélité permettant de copier une carte d'outil externe (carte complète ou carte de ruine), puis de l'afficher dans MyHordes
    `,
    '1.0.0-alpha.30': `
        [Correction] Corrige de gros ralentissements dans toute l'interface de l'application
    `,
    '1.0.0-alpha.29': `
        [Correction] Corrige de gros ralentissements dans toute l'interface de l'application
    `,
    '1.0.0-alpha.28': `
        [Correction] Résout le problème d'affichage de la barre de menu du jeu quand l'option de traduction est activée

        [Amélioration] Ajout des traductions allemandes pour l'affichage de l'outil de traduction
    `,
    '1.0.0-alpha.27': `
        [Amélioration] Amélioration de la fonctionnalité de traduction (copie d'un libellé, afficher les résultats inexacts)
    `,
    '1.0.0-alpha.26': `
        [Amélioration] Amélioration de la fonctionnalité de traduction (copie d'un libellé, afficher les résultats inexacts)
    `,
    '1.0.0-alpha.25': `
        [Amélioration] Ajout d'une fonctionnalité de traduction des éléments de MyHordes
    `,
    '1.0.0-alpha.24': `
        [Amélioration] Ajout d'une fonctionnalité de traduction des éléments de MyHordes
    `,
    '1.0.0-alpha.23': `
        [Amélioration] Ajout d'une fonctionnalité de traduction des éléments de MyHordes
    `,
    '1.0.0-alpha.22': `
        [Amélioration] Ajout d'une fonctionnalité de traduction des éléments de MyHordes
    `,
    '1.0.0-alpha.21': `
        [Amélioration] Ajout d'une fonctionnalité de traduction des éléments de MyHordes
    `,
    '1.0.0-alpha.20': `
        [Amélioration] Ajout des traductions anglaises et allemandes, merci Katt et Shokolaw
    `,
    '1.0.0-alpha.19': `
        [Amélioration] Refonte des paramètres pour plus de lisibilité

        [Nouveauté] Ajout d'un champ de recherche dans la liste des chantiers
    `,
    '1.0.0-alpha.18': `
        [Correction] Typo

        [Amélioration] Ajout de l'info "Objet de camping" dans le tooltip amélioré
    `,
    '1.0.0-alpha.17': `
        [Nouveauté] Affichage du nombre de zombies morts sur la case aujourd'hui
    `,
    '1.0.0-alpha.16': `
        [Correction] Erreur 500 au chargement du script quand on n'est pas en ville
        [Correction] Comportement de la notification de fouille terminée
    `,
    '1.0.0-alpha.15': `
        [Amélioration] Ajout de certaines propriétés d'objets dans les tooltips améliorés

        [Nouveauté] Ajout d'une option pour être prévenu à la fin de la fouille
    `,
    '1.0.0-alpha.14': `
        [Amélioration] Ajout d'un niveau "trashlist" à la liste de courses, qui s'affiche en gris
        [Amélioration] Changement dans les couleurs des éléments de la liste de courses
        [Amélioration] Les couleurs des priorités d'affichent également sur l'image de l'objet dans la liste de courses intégrée
        [Amélioration] Affichage de certaines propriétés sur les tooltips des objets si l'option "afficher les tooltips détaillés" est activée

        [Nouveauté] [expérimental] Ajout d'une option pour demander une confirmation avant de faire des actions "dangereuses" (consomation de cyanure, consomation de drogue si déjà drogué)
    `,
    '1.0.0-alpha.13': `
        [Correction] Correctif affichage nom du script
    `,
    '1.0.0-alpha.12': `
        [Correction] Ajout à la liste de courses depuis la liste d'objets

        [Amélioration] Affichage des paramètre

        [Nouveauté] Affichage de la version
        [Nouveauté] Affichage du changelog après une mise à jour
    `,
};
