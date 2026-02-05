# MyHordesOptimizer

[![(Client) Deploy Prod](https://github.com/zerah54/MyHordesOptimizer/actions/workflows/deploy-client-prod.yml/badge.svg)](https://github.com/zerah54/MyHordesOptimizer/actions/workflows/deploy-client-prod.yml)
[![(Server) Deploy Prod](https://github.com/zerah54/MyHordesOptimizer/actions/workflows/deploy-server-prod.yml/badge.svg)](https://github.com/zerah54/MyHordesOptimizer/actions/workflows/deploy-server-prod.yml)
[![Crowdin](https://badges.crowdin.net/myhordes-optimizer/localized.svg)](https://crowdin.com/project/myhordes-optimizer)

# A quoi ça sert ? 

MyHordes Optimizer est un site web à destination des joueurs du jeu par navigateur MyHordes. Il intègre de nombreuses fonctionnalités d'aide de jeu, ainsi qu'un script / une extension pouvant être ajouté au jeu pour améliorer son expérience en jeu.

Cet outil est en constante évolution, et les fonctionnalités suivantes peuvent évoluer à tout moment. D'autres fonctionnalités seront ajoutées à l'avenir.

# Fonctionnalités du site

Le site est disponible à l'adresse suivante : [https://myhordes-optimizer.web.app](https://myhordes-optimizer.web.app)

## Ma ville

### Carte des fouilles
Une carte de votre ville. Elle affiche les fouilles restantes sur la case en fonction des informations que nous connaissons de MyHordes. 

En cliquant sur une case, vous pouvez consulter des informations complémentaires à son sujet, ajouter une note à la case, et également modifier le nombre de fouilles réussies sur cette case.

### Banque
Affiche la liste des objets de la banque et leur quantité.

Si vous êtes incarnés, les objets qui ne sont pas dans la liste de courses sont suivis d'un bouton présentant un caddie. Un clic sur ce bouton les ajoute à la liste de courses.

### Citoyens
Affiche la liste des citoyens incarnés dans votre ville.

#### Citoyens
Dans cet onglet, la liste permet de renseigner l'état de vos actions héroïques, de vos améliorations de maison, le contenu de votre sac et le contenu de votre coffre.

#### Fouilles
Dans cet onglet, la liste permet d'ajouter des fouilles sur des cases citoyen par citoyen, afin d'alimenter la carte des fouilles.

### Liste de courses
Affiche une liste de courses commune à la ville. Cette liste peut être "toutes zones confondues", ou alors il est possible de créer une liste par zone de distance.

Un bouton permet également de copier cette liste au format forum dans le but de la partager facilement sur le forum du jeu.

Cette liste peut être alimentée par tous les citoyens, et permet de trier les objets par ordre d'importance. Chaque ligne contiendra plusieurs informations différentes.
  - L'image de l'objet
  - Le nom de l'objet
  - Est-ce que l'objet est un encombrant ou non
  - La priorité de l'objet. Il existe plusieurs priorités différentes
    - Haute
    - Moyenne
    - Basse
    - Non définie
    - Ne pas ramener
  - L'endroit où l'objet doit être rapporté
    - Banque : L'objet doit être rentré en ville
    - Zone de rappatriement : L'objet doit être laissé dehors en vue d'un éventuel montage d'objet
    - Non définie
  - Le nombre d'exemplaires de cet objet en banque
  - Le nombre d'exemplaires de cet objet disponible dans les sacs
  - Le stock total souhaité
  - La quantité manquante (stock souhaité - stock en banque - stock en sacs)
  - Faut-il signaler cet objet quand vous en trouvez un exemplaire

### Statistiques

#### Estimations
Cette page comprend une liste des estimations issues de la tour de guet du jeu. Les citoyens peuvent y enregistrer l'estimation qu'ils ont rencontrée, associée au bon pourcentage. La page affiche alors un graphique représentant ces différentes estimations, ainsi que les valeurs minimum et maximum théoriques pour ce jour, et enfin une estimation plus précise.

#### Scrutateur
La liste des régérénations du scrutateur, ainsi que des graphiques pour montrer représenter les directions du scrutateur.

#### Registre
Un analyseur du registre en jeu. Toutes les fonctionnalités suivantes fonctionneront une fois le registre de la ville collé dans la page.

##### Dés / Cartes
Vous pourrez voir qui a joué aux dés, aux cartes, ou les deux, afin de pouvoir rappeler à vos concitoyens de tenter leur chance.

##### Différentiel de la banque
Affiche les différentes entrées de la banque sous forme d'entrées / sorties, avec une option pour n'afficher que le différentiel réel (en retirant toutes les entrées qui ont une sortie identique)

##### Prises dans le puis
Liste les citoyens en fonction de leur nombre de prises dans le puis, afin de pouvoir leur rappeler de vider le puits si vous en avez besoin.

##### Fouilles
Affiche le nombre de fouilles ratées et le nombre de fouilles totales pour cette case. Permet également d'enregistrer cette information pour alimenter la carte des fouilles.

##### Entrées / Sorties
Affiche un graphique représentant les citoyens en ville ainsi que leurs entées / sorties et le temps passé hors de la ville.

## Outils

### Camping
Un simulateur de camping, permettant de mieux maitriser ses chances de survie en camping.

### Chances de survie
Un calculateur de probabilités de survie moyenne en fonction des chances de survie de chacun.

## Wiki

### Objets
Une liste des objets existant en jeu, à laquelle ont été ajoutées des informations liées à cet objet (décoration, propriétés, actions, etc)

### Recettes
Une liste des recettes en jeu.

### Pouvoirs
La liste des pouvoirs héroiques et le nombre de jours nécessaires pour pouvoir obtenir ce pouvoir.

### Bâtiments
La liste des bâtiments existant dans le jeu, les distances minimale et maximale où le bâtiment est trouvable, le bonus apporté en camping par ce bâtiment, le nombre de places disponibles sur ce bâtiment, et les objets qu'on peut trouver dedans.

### Informations diverses

#### Morts par désespoir
Un tableau de la façon dont les zombies vont mourir dans la nuit en fonction du nombre de zombies morts sur la case la veille. Un calculateur est également disponible afin d'anticiper les morts en chaine sur la case.

#### Attaque théorique
La liste des attaques théoriques maximales en fonction du jour.

#### Débordement
La liste des débordements théoriques maximaux en fonction du jour, ainsi qu'un calculateur pour préciser l'attaque en fonction du nombre de citoyens en ville.

#### Manuel des ermites
Les chances de réussite du manuel des ermites en fonction du jour et de l'état de dévastation de la ville.

#### Points d'âme
Le nombre de points d'âmes validés en fonction du jour de la mort

#### Points clean
Le nombre de points clean validés en fonction du jour de la mort si vous n'avez pas consommé de drogue lors de la ville.

# Script et extention de navigateur
Le script et l'extension de navigateur présentent les mêmes fonctionnalités, ce sont juste deux méthodes d'installation différentes.

## Installation

### Méthode 1 : Extension de navigateur

#### Firefox
Rendez-vous sur la [page de l'extension](https://addons.mozilla.org/fr/firefox/addon/myhordes-optimizer) pour l'installer.

#### Chrome
Rendez-vous sur la [page de l'extension](https://chromewebstore.google.com/detail/myhordes-optimizer/jolghobcgphmgaiachbipnpiimmgknno) pour l'installer.

### Méthode 2 : Script

Une fois le script installé, il faudra rafraîchir la page du jeu. Vous verrez alors apparaitre un nouveau bouton en haut de votre page MyHordes. Au survol, une fenêtre s'affiche, donnant accès aux options du script ainsi qu'à certaines de ses fonctionnalités.

#### Ordinateur
Il faut d'abord installer l'application de gestion des scripts de votre choix. Il en existe plusieurs, comme par exemple Tampermonkey ou Violentmonkey. Ensuite, il suffit de cliquer sur le [lien de téléchargement](https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js) du script, qui lancera la procédure d'installation. Enfin, il faudra confirmer dans la page qui se sera ouverte.

#### Android
  - Installer un navigateur acceptant les extensions, tel que Kiwi Browser ou Firefox ;
  - Rechercher l'extension de gestion des scripts de votre choix dans la barre de recherche de ce navigateur. Il en existe plusieurs, comme par exemple Tampermonkey ou Violentmonkey ;
  - Installer l'extension pour Chrome ;
  - Cliquer sur le [lien de téléchargement](https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js) du script ;
  - Confirmer l'installation dans la page qui se sera ouverte.

#### iOS

  - Télécharger l’application "UserScripts" ;
  - Ouvrir l'application "Raccourcis" ;
  - Appuyer sur le bouton "+" en haut à droite pour créer un nouveau raccourci ;
  - Rechercher l'action "Obtenir le contenu de l'URL" et l'ajouter ;
  - Rechercher l'action "Enregister le fichier" et l'ajouter ;
  - Configurer l'action "Obtenir le contenu de l'URL" en modifiant la valeur du paramètre "URL" par la valeur "Entrée de raccourci" ;
  - Configurer l'action "Recevoir l'entrée" en modifiant la valeur du premier paramètre "Images et 18 de plus" par la valeur "URL" uniquement ;
  - Configurer l'action "Recevoir l'entrée" en modifiant la valeur du second paramètre "Nulle part" par la valeur "Dans la feuille de partage" ;
  - Terminer la création du raccourci en appuyant sur le bouton "OK" en haut à droite ;
  - Enregistrer le fichier disponible sur le [lien de téléchargement](https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js) via un appui long sur le lien, en sélectionnant "Partager..." puis l'action "Enregister le fichier" ;
  - Autoriser l'action "Enregistrer le fichier" à l'envoyer 1 élement de l'app Safari vers "github.com" ;
  - Sélectionner l'onglet "Explorer", choisir l'emplacement "Sur mon iPhone", sélectionner le dossier "Userscripts" puis valider appuyant sur le bouton "Ouvrir" en haut à droite ;
  - Ouvrir l'application "Fichiers" ;
  - Retourner dans le dossier "Userscripts" ("Explorer" > "Sur mon iPhone" > "Userscripts") ;
  - Appuyer sur le bouton "..." en haut à droite et sélectionner "Options de présentation" ;
  - Activer l'option avancée "Afficher toutes les extensions de fichiers" ;
  - Renommer le fichier "my_hordes_optimizer.user.txt" en "my_hoydes_optimizer.user.js" ;
  - Confirmer le remplacement de l'extension via le choix "Utiliser ".js ;
  - Aller sur Safari ;
  - Appuyer sur le "Aa" dans la barre de recherche ;
  - Cliquer sur "Gérer les extensions" ;
  - Activer "Userscripts" ;
  - Appuyer sur le "Aa" dans la barre de recherche ;
  - Cliquer sur "Userscripts" ;
  - Vérifier que "MyHordes Optimizer" est bien activé.

## Outils 

### Banque 
Affiche la liste des objets de la banque et leur quantité.

Si vous êtes incarnés, les objets qui ne sont pas dans la liste de courses sont suivis d'un bouton présentant un caddie. Un clic sur ce bouton les ajoute à la liste de courses.

### Camping
Affiche un outil de prédiction des chances de survie en camping.

## Wiki

### Objets
Affiche la liste de tous les objets existant dans MyHordes (ainsi que des informations complémentaires à leur sujet).

Si vous êtes incarné, les objets qui ne sont pas dans la liste de courses sont suivis d'un bouton présentant un caddie. Un clic sur ce bouton les ajoute à la liste de courses.

### Recettes
Affiche la liste de toutes les recettes de l'application.

### Pouvoirs
Présente tout simplement la liste des pouvoirs héros, leur description et le nombre de jours avant obtention.

### Bâtiments
Affiche la liste de tous les bâtiments existant dans le jeu, leur distance de la ville, ainsi que la liste des objets qu'on peut obtenir en les fouillant et leurs probabilités d'obtention.

## Outils Externes 

### MyHordes Optimizer
En cochant l'option "Mettre à jour MyHordesOptimizer", quand vous cliquerez sur le bouton "Mettre à jour les outils externes", la mise à jour de MyHordes Optimizer se fera automatiquement. Vous rendez également accessibles d'autres options de mise à jour avancées.

  - Nombre de zombies tués : Enregistre le nombre de zombies tués sur la case
  - Mise à jour en ville dévastée : Lorsque la ville est dévastée, récupère les informations sur la case pour les envoyer à MyHordes Optimizer.
  - Actions héroïques : Enregistre les actions héroïques disponibles / utilisées
  - Améliorations de la maison : Enregistre les informations concernant votre maison
  - Détail de mon sac et de ceux de mon escorte : Enregistre le contenu de votre sac ainsi que ceux de vos escortés
  - États : Enregistre vos différents états (rassasié, soif, etc... Attention : n'enregistre pas l'état goule)
  - Entregistrer les fouilles réussies : Enregistre les fouilles réussies pour restituer des statistiques sur les fouilles dans une carte dédiée

### Gest'Hordes
En cochant l'option "Mettre à jour Gest'Hordes", quand vous cliquerez sur le bouton "Mettre à jour les outils externes", la mise à jour de Gest'Hordes se fera automatiquement. Vous rendez également accessibles d'autres options de mise à jour avancées.

  - Nombre de zombies tués : Enregistre le nombre de zombies tués sur la case
  - Mise à jour en ville dévastée : Lorsque la ville est dévastée, récupère les informations sur la case pour les envoyer à Gest'Hordes.
  - Actions héroïques : Enregistre les actions héroïques disponibles / utilisées
  - Améliorations de la maison : Enregistre les informations concernant votre maison
  - États : Enregistre l'état clair

### Big Broth'Hordes
En cochant l'option "Mettre à jour BigBroth'Hordes", quand vous cliquerez sur le bouton "Mettre à jour les outils externes", la mise à jour de BigBroth'Hordes se fera automatiquement.

### Fata Morgana 
En cochant l'option "Mettre à jour Fata Morgana", quand vous cliquerez sur le bouton "Mettre à jour les outils externes", la mise à jour de Fata Morgana se fera automatiquement.

### Affichage des cartes issues des outils externes 
Depuis l'interface, vous pouvez cocher une option permettant d'afficher des cartes directement dans MyHordes. Une fois cette option cochée, vous trouverez dans les différents outils externes des boutons pour "copier" une carte, que ce soit une carte de la ville ou une carte de ruine. Une fois la carte copiée, il suffit de retourner dans MyHordes et de cliquer sur l'icône de carte pour pouvoir consulter la carte dans une fenêtre qui peut être déplacée et redimensionnée.

Pour les cartes de BBH et de GH, vous pourrez voir votre emplacement sur la carte. La visibilité des expéditions n'est pas encore prise en compte.

Pour la carte de la ruine, vous pouvez simuler votre emplacement en cliquant sur une des cases, ce qui fait se déplacer un point sur la carte.

## Affichage

### Affichage des tooltips détaillés 
Modifie les tooltips natifs de l'application pour afficher en plus la liste des recettes dans lesquelles l'objet survolé apparait ainsi que quelques informations complémentaires (nombre de points d'action rendus par un aliment par exemple).

### Navigation rapide vers le chantier recommandé 
Dans l'interface, vous pouvez cocher le bouton "Navigation rapide vers le chantier recommandé", ce qui activera la fonctionnalité de navigation rapide. Il s'agit simplement, lorsqu'il existe un chantier recommandé, de pouvoir cliquer dessus pour être automatiquement redirigé vers la ligne du chantier dans la liste.

### Champs de recherches supplémentaires 
En cochant cette option, vous pourrez choisir des champs de recherches à afficher dans votre interface. Sont actuellement disponibles : un champ de recherche sur la liste des chantiers, un champ de recherche dans les destinataires d'un message dans sa maison, un champ de recherche sur les entrées du registre.

### Affichage de la liste de courses dans la page 
En cochant cette option, la liste de courses apparaitra lorsque vous vous trouverez dans le desert ou dans l'atelier. Cette liste contient des informations de priorité, de quantité en banque, de quantité dans les sacs, de quantité totale requise, et de quantité manquante.

La liste de courses dans l'atelier ne présentera que les éléments pouvant obtenus à l'atelier. Celle dans le désert affichera tous les éléments sans distinction.

Dans le désert, les objets dans le sac ou au sol également présents dans la liste de course se verront attribuer une bordure dont la couleur indique la priorité de l'élément. 

### Affichage du nombre de zombies tués sur la case 
En cochant cette option, un nouvel encart apparaitra sous la carte dans l'Outre-Monde. Il compte le nombre de zombies qui ont été tués sur la case depuis la dernière attaque, et calcule le nombre de zombies qui vont mourir de désespoir lors de la prochaine attaque.

### Affichage de l'outil de traduction
En cochant cette option, un outil de traduction s'affichera dans l'interface. Vous pourrez désormais sélectionner une langue d'origine, puis saisir le texte à rechercher dans les autres langues. Le texte doit impérativement être un texte de MyHordes, puisque nous allons en chercher la traduction dans les fichiers de traduction du jeu.

### Afficher les PA manquants pour réparer les chantiers
En pandémonium, les chantiers subissent des dégats lors de l'attaque. Cette option va montrer combien de pa manquent pour que le chantier ne risque pas d'être détruit lors de la prochaine attaque.

### Prédictions de camping dans les informations du secteur
En cochant cette option, vous verrez apparaitre un nouvel encart dans les informations du secteur de votre case. Cet encart vous permettra de saisir diverses informations pour calculer vos chances de survie sur cette case. Certaines informations, comme par exemple le type de ville, ne sont pas visibles car elles sont déjà pré-renseignées et tiennent compte de votre ville actuelle.

### Informations diverses issues de MyHordes Optimizer
Sur la carte du site de MyHordes Optimizer, vous pouvez saisir des notes sur chaque case. Quand cette option est cochée, la note associée s'affiche sur votre case quand vous vous déplacez dans l'Outre-Monde.

### Affiche les estimations enregistrées sur la page de la tour de guet
Quand cette option est cochée, un nouvel encart apparait sur la page de la tour de guet, permettant de consulter, enregistrer et copier les valeurs des estimations.

### Ajoute un bouton permettant de copier le contenu du registre
Quand cette option est cochée, sur chaque regitre un bouton est ajouté permettant d'en copier le contenu.

### Affiche un compteur permettant de gérer l'anti-abus
Quand cette option est cochée, un compteur qui liste vos prises en banque est ajouté aux pages de banque et puits. Le compteur dans MyHordes tient compte des minutes "glissantes", il suffit donc d'attendre qu'une ligne disparaisse pour pouvoir prendre de nouveau un objet en banque.

### Ouvre automatiquement le menu "Utiliser un objet de mon sac"
Quand cette option est cochée, au chargement d'une case dans l'Outre-Monde un clic sur le bouton d'ouverture du sac sera simulé pour que votre sac soit ouvert par défaut.

### Définir des options d'escorte par défaut
En cochant cette option, deux autres options représentant les options d'escorte dans l'Outre-Monde seront disponibles. Vous pourrez ainsi choisir quelles options vous voulez voir cochées ou non par défaut quand vous activez votre escorte.

## Notifications

### Avertissement en cas de fermeture de la page
Dans l'interface, vous pouvez cocher l'option "Demander confirmation avant de quitter la page", ce qui activera la fonctionnalité. Une fois activée, si vous êtes dans le désert et que votre attente d'escorte n'est pas activée, ou si vous n'avez pas relâché votre escorte, alors au moment de fermer la fenêtre ou l'onglet vous verrez apparaitre un avertissement demandant de confirmer votre action.

### Avertissement en cas d'inactivité
Dans l'interface, vous pouvez cocher l'option "Me notifier si je suis inactif depuis 5 minutes sur la page", ce qui activera la fonctionnalité. Une fois activée, si vous êtes dans le désert et que votre attente d'escorte n'est pas activée, ou si vous n'avez pas relâché votre escorte, alors au bout de 5 minutes sans actios sur la page une notification de navigateur vous avertira.

### Notification à la fin de la fouille
Si vous cochez l'option "Me notifier à la fin de la fouille", vous recevrez une notification de votre navigateur quelques secondes avant la fin de votre fouille à condition que votre navigateur soit toujours ouvert sur la page du désert.

### Notification de nouveau message
Si vous cochez l'option "Me notifier si je reçois un nouveau message", vous recevrez une notification de votre navigateur lors d'un changement dans votre compteur de messages reçus.

# Contribuer au projet

<details>

<summary> 🐳 Configuration de la base de données avec Docker (Recommandé)</summary>

Le projet utilise maintenant PostgreSQL avec Docker pour simplifier la configuration de l'environnement de développement.

### Prérequis
- [Docker](https://www.docker.com/get-started) installé sur votre machine
- [Docker Compose](https://docs.docker.com/compose/install/) (inclus avec Docker Desktop)

### Installation rapide

1. **Créer le fichier de configuration**
   - `cp .env.example .env`

2. **Modifier les mots de passe** dans `.env` (⚠️ Changez tous les mots de passe par défaut !)

3. **Démarrer les services en développement**
   - `docker-compose --profile dev up -d`

   Cela démarre :
   - PostgreSQL Production (port 5432)
   - PostgreSQL Développement (port 5433)
   - PgAdmin (http://localhost:5050)
   
5. **Configurer les serveurs dans PgAdmin**
   - Clic droit sur "Servers" → "Register" → "Server"
   - **Pour Production** :
     - Host : `postgres-prod`
     - Port : `5432`
     - Database : `mho_prod`
     - Username : `mho_user_prod`
     - Password : celui défini dans `.env`
   - **Pour Développement** :
     - Host : `postgres-dev`
     - Port : `5432`
     - Database : `mho_dev`
     - Username : `mho_user_dev`
     - Password : celui défini dans `.env`

### Commandes utiles

#### Démarrer en développement (avec PgAdmin)
`docker-compose --profile dev up -d`

#### Démarrer en production (sans PgAdmin)
`docker-compose up -d`

#### Voir les logs
`docker-compose logs -f`

#### Arrêter les services
`docker-compose --profile dev down`

#### Réinitialiser la base de dev (⚠️ supprime toutes les données !)
```
docker-compose stop postgres-dev
docker volume rm myhordesoptimizer_postgres-dev-data
docker-compose --profile dev up -d postgres-dev
```
</details>

## Installer le site web en local

### Côté front 
- Installer Node et Angular
- Ouvrir une console à la racine du dossier MyHordesOptimizerWebsite
  - `npm install` pour installer les dépendances
  - `npm run start` pour lancer le projet

### Côté back (sans Docker)

⚠️ **Note** : Le projet utilise maintenant PostgreSQL. La section ci-dessous est conservée pour référence, mais il est recommandé d'utiliser Docker (voir section précédente).

- Installer PostgreSQL (ou MySQL legacy) et .NET
- Créer une base de données vide
- **Si PostgreSQL** : Lancer les migrations Entity Framework
- **Si MySQL** : Lancer tous les scripts qui se trouvent dans `MyHordesOptimizerApi > MyHordesOptimizerApi > Database > Scripts` pour initier la base de données
- Créer un fichier `appsettings.Development.json` pour remplacer les valeurs "dummy" du appsettings.json
  - `ConnectionStrings > DefaultConnection` : Chaîne de connexion à votre base de données
  - `Authentication > Username` et `Authentication > Password` sont des valeurs de votre choix qui serviront pour l'authentification basique des appels
  - `Authentication > JWT > Secret` : Générer un secret 64 caractères sur ce site https://jwtsecret.com/generate
- Lancer le projet avec le profil Development
- Ouvrir une console
  - `curl --location --globoff --request POST 'https://localhost:5001/DataImport/all?userKey=••••••' --header 'Authorization: ••••••'` Pour peupler la base de données
