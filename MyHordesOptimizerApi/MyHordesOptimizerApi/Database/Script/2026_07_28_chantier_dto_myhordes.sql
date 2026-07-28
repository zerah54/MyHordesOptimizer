-- ============================================================================
-- Chantier « DTO MyHordes » — reprise de schéma complète (juillet 2026)
--
-- Ce fichier rassemble les sept scripts écrits pendant le chantier des 27 et 28 juillet 2026,
-- REGROUPÉS PAR TABLE : une seule instruction par table, même quand ses colonnes viennent de
-- sujets différents. Chaque section porte l'explication de chacune de ses colonnes.
--
-- POUR LA PRODUCTION UNIQUEMENT. La base de développement a déjà reçu ces sept scripts un par
-- un les 27 et 28 juillet : le rejouer y échouerait dès le premier ADD COLUMN, ces instructions
-- n'étant pas réexécutables.
--
-- Ce qu'il contient :
--   1. Item        : mhId, isObsolete, img_broken
--   2. Building    : mhId, isObsolete, displayOrder
--   3. Ruin        : mhId, isObsolete
--   4. Picto       : mhId, isObsolete, uid
--   5. Town        : idShaman, idGuide, idCata, hasExternalApi
--   6. TownCadaver : score -> soulPoints, et remise à NULL des valeurs existantes
--   7. Users       : nettoyage des avatars valant « false »
--
-- IL MANQUE VOLONTAIREMENT L'UNICITÉ DES RÉFÉRENTIELS. `2026_07_29_referentiels_unicite.sql`
-- reste un fichier séparé et doit passer PLUS TARD : les colonnes créées ici sont remplies par
-- le CODE (`POST /DataImport/*` après redémarrage), et poser la contrainte avant ce remplissage
-- scellerait un état qu'on n'a pas encore vérifié. Ce script porte lui-même les quatre requêtes
-- de contrôle à passer d'abord.
--
-- L'ORDRE DES CLAUSES `AFTER` À L'INTÉRIEUR D'UNE INSTRUCTION EST SIGNIFICATIF : MySQL les
-- applique l'une après l'autre. Il reproduit ici, colonne pour colonne, la disposition qu'ont
-- obtenue les sept scripts séquentiels en développement. Ne pas les réordonner « pour la
-- lisibilité » : les deux bases divergeraient.
--
-- Une remarque sur l'exécution : MySQL ne sait pas annuler une instruction de schéma. En cas
-- d'échec en cours de route, ce qui précède reste appliqué — reprendre à l'instruction fautive,
-- et non rejouer le fichier depuis le début. La seule qui dépende de l'état existant est le
-- CHANGE COLUMN de TownCadaver : il suppose que la colonne s'appelle encore `score` en
-- production.
-- ============================================================================


-- ############################################################################
-- LES QUATRE RÉFÉRENTIELS — Item, Building, Ruin, Picto
--
-- Les identifiants numériques de MyHordes ne sont PAS stables.
--
-- BuildingPrototype, ItemPrototype, ZonePrototype et PictoPrototype déclarent tous leur $id en
-- #[ORM\Id] #[ORM\GeneratedValue] : c'est un auto-incrément attribué au chargement des fixtures.
-- Il dépend donc de l'ordre de chargement sur l'instance concernée, et deux instances du jeu
-- (myhordes.de, myhordes.eu, une instance locale) peuvent numéroter différemment le même
-- prototype.
--
-- Mesuré le 2026-07-27 contre myhordes.de : 128 des 166 bâtiments portaient déjà un uid
-- différent en base et chez le jeu. L'id 12 valait small_wallimprove_#02 côté MyHordes et
-- item_home_def_#00 en base, l'id 13 exactement l'inverse.
--
-- Or MHO faisait de cet identifiant sa CLÉ PRIMAIRE, alors que ses données utilisateur — contenu
-- de banque, sacs, listes de courses, cases de carte, pictos gagnés — référencent ces
-- référentiels. Le jour où MyHordes renumérote les objets comme il l'a fait pour les bâtiments,
-- tout cela pointerait silencieusement ailleurs : sans erreur, sans log.
--
-- On sépare donc les trois rôles que cette unique colonne portait :
--   * l'IDENTITÉ        -> uid (img pour les ruines), stable, vient du jeu
--   * la CLÉ TECHNIQUE  -> idItem/idBuilding/idRuin/idPicto, appartient à MHO, et NE BOUGE PLUS
--   * la CORRESPONDANCE -> mhId, l'identifiant MyHordes du moment, mutable
--
-- Les clés primaires conservent leurs valeurs actuelles : AUCUNE reprise de données utilisateur
-- n'est nécessaire.
--
-- Les colonnes sont créées nullables et SANS contrainte d'unicité. Le remplissage a lieu par
-- code (il exige de rapprocher par uid avec la réponse de MyHordes, ce qu'un script SQL ne peut
-- pas faire), et l'unicité est posée ensuite, par `2026_07_29_referentiels_unicite.sql`, une
-- fois qu'on a la preuve qu'aucun doublon ne subsiste.
-- ############################################################################


-- ---------------------------------------------------------------------------
-- Item
--
-- mhId / isObsolete : voir le préambule des référentiels ci-dessus.
--
-- img_broken : icône de l'objet cassé. MyHordes n'émet `img_b` que lorsqu'il DIFFÈRE de `img`
-- (JSONv1Controller::getItemData : `if ($img_b !== $img) $data["{$field}_b"] = ...`). La colonne
-- est donc nullable, et NULL y signifie « cet objet n'a pas d'icône cassée propre » — pas « non
-- renseigné ». C'est au rendu de choisir le repli sur `img`, jamais à l'import de recopier la
-- valeur : ce serait détruire l'information. Relevé du 2026-07-27 contre myhordes.de : 20 objets
-- sur 383 en ont une.
-- ---------------------------------------------------------------------------
ALTER TABLE Item
    ADD COLUMN mhId       INT        NULL,
    ADD COLUMN isObsolete TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN img_broken VARCHAR(255)
                              CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci
                                     NULL     DEFAULT NULL
        AFTER img;


-- ---------------------------------------------------------------------------
-- Building
--
-- mhId / isObsolete : voir le préambule des référentiels ci-dessus.
--
-- displayOrder : rang d'affichage officiel. `order` (`BuildingPrototype::getOrderBy`) était
-- jusqu'ici le seul champ à contenu réel que MHO ne demandait pas à `/json/buildings`. Il donne
-- l'ordre du jeu, au lieu d'un tri maison.
--
-- LA COLONNE NE S'APPELLE PAS `order` : c'est un mot réservé de SQL, qui obligerait à l'échapper
-- dans chaque requête. `displayOrder` dit la même chose sans le piège.
--
-- NON UNIQUE, et c'est voulu : relevé le 2026-07-28 contre myhordes.de, les 166 bâtiments se
-- répartissent sur les valeurs 0 à 13, plusieurs partageant la même (Douves, Grand fossé et
-- Muraille rasoir sont tous à 0). C'est un rang DANS un groupe, pas un ordre total — trier une
-- liste complète demandera de le combiner à un second critère.
--
-- Nullable : un bâtiment que MyHordes ne renverrait plus (obsolète) garde sa valeur, et un
-- bâtiment jamais synchronisé n'en a pas encore.
-- ---------------------------------------------------------------------------
ALTER TABLE Building
    ADD COLUMN mhId         INT        NULL,
    ADD COLUMN isObsolete   TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN displayOrder INT(11)    NULL     DEFAULT NULL
        AFTER rarity;


-- ---------------------------------------------------------------------------
-- Ruin
--
-- Pas de colonne `uid` à créer : l'identité des ruines est portée par `img`, déjà présente.
-- Voir le préambule des référentiels ci-dessus.
-- ---------------------------------------------------------------------------
ALTER TABLE Ruin
    ADD COLUMN mhId       INT        NULL,
    ADD COLUMN isObsolete TINYINT(1) NOT NULL DEFAULT 0;


-- ---------------------------------------------------------------------------
-- Picto
--
-- Picto est le seul référentiel dépourvu de colonne d'identité : `/json/pictos` est un
-- dictionnaire indexé par le NOM du prototype (« r_ripflash_#00 »), que l'import jette
-- aujourd'hui. On l'ajoute ici, il sera rempli par la reprise.
-- ---------------------------------------------------------------------------
ALTER TABLE Picto
    ADD COLUMN mhId       INT          NULL,
    ADD COLUMN isObsolete TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN uid        VARCHAR(190) NULL;


-- ---------------------------------------------------------------------------
-- Town
--
-- idShaman / idGuide / idCata : les rôles de ville — Chaman, Guide de l'Outre-Monde,
-- Responsable de la catapulte. Un seul porteur par rôle et par ville à la fois, mais il peut
-- changer en cours de partie (mort, bannissement). MyHordes ne renvoie que le DERNIER porteur,
-- et seulement s'il est VIVANT (`if ($latest && $latest->getAlive())` dans
-- JSONv1Controller::getMapData) : le champ est omis sinon. Cette omission vaut « plus personne »
-- et doit remettre la colonne à NULL.
--
-- Aucune clé étrangère vers User n'est posée : MyHordes peut désigner un joueur que notre base
-- ne connaît pas encore, et une contrainte ferait alors échouer la synchronisation entière de la
-- ville pour une information d'affichage.
--
-- hasExternalApi : la ville a-t-elle activé l'option d'API externe de MyHordes ? Le jeu renvoie
-- `{"error":"ApiDisabled"}` À LA PLACE des données de carte quand l'option est coupée. La garde
-- vit dans `getMapData`, qui sert aussi bien `/json/map` que la branche `map` de `/json/me` : le
-- constat est donc gratuit, il suffit de lire la réponse.
--
-- NULLABLE, et le null compte : il signifie « on ne l'a pas encore constaté », ce qui n'est ni
-- oui ni non. Une ville jamais synchronisée n'a pas à être présumée dans un sens ou dans
-- l'autre. À quoi ça sert : une ville sans API externe ne transmettra jamais `baseDef`, donc
-- jamais le niveau de maison de ses citoyens. C'est la seule situation où la saisie manuelle de
-- ce niveau garde un sens — partout ailleurs elle serait écrasée à la synchronisation suivante.
-- L'autre erreur possible, `UnknownMap`, ne dit RIEN de l'option API : elle signale seulement un
-- identifiant inconnu. Le code ne l'interprète donc pas et laisse la colonne en l'état.
--
-- ORDRE DES CLAUSES : `hasExternalApi` vient en DERNIER tout en visant `AFTER score`, comme dans
-- les scripts séquentiels. La disposition finale est donc score, hasExternalApi, idShaman,
-- idGuide, idCata — celle de la base de développement.
-- ---------------------------------------------------------------------------
ALTER TABLE Town
    ADD COLUMN idShaman       INT(11)    NULL DEFAULT NULL AFTER score,
    ADD COLUMN idGuide        INT(11)    NULL DEFAULT NULL AFTER idShaman,
    ADD COLUMN idCata         INT(11)    NULL DEFAULT NULL AFTER idGuide,
    ADD COLUMN hasExternalApi TINYINT(1) NULL DEFAULT NULL AFTER score;


-- ---------------------------------------------------------------------------
-- TownCadaver
--
-- Points d'âme du citoyen, en remplacement d'un score de ville dupliqué.
--
-- `TownCadaver.score` contenait jusqu'ici `$citizen->getTown()?->getScore()` — le score de la
-- VILLE, recopié à l'identique sur chacun de ses cadavres. C'est ce que la liste des citoyens
-- affichait sous l'intitulé « Score », alors que le score de la ville a déjà sa place au niveau
-- de la ville (`Town.score`, affiché dans l'annuaire).
--
-- La colonne devient `soulPoints`, alimentée par `sp` (= `$citizen->getPoints()`), qui est bien
-- une valeur INDIVIDUELLE.
--
-- LES VALEURS EXISTANTES SONT REMISES À NULL, et c'est délibéré : ce sont des scores de ville,
-- ils ne veulent rien dire comme points d'âme. Les conserver ferait afficher une donnée fausse
-- avec un intitulé neuf, ce qui est pire que de n'afficher rien.
--
-- Qui sert `sp` :
--   * `playedMaps`   : OUI (relevé en réel, 127 entrées sur 127, distinct de `score` — mapId 585 :
--                      score=277, sp=66)
--   * `map.cadavers` : OUI — `getCadaversData` passe les champs demandés tels quels
--   * `/json/towns`  : NON — cette route filtre les sous-champs de `citizens` par une liste
--                      blanche qui ne contient pas `sp` (JSONv1Controller l. 1925)
-- La colonne restera donc nulle pour les villes que MHO n'a vues que par l'annuaire. Toutes les
-- écritures sont gardées : une source muette n'efface jamais ce qu'une autre a renseigné.
-- ---------------------------------------------------------------------------
ALTER TABLE TownCadaver
    CHANGE COLUMN score soulPoints INT(11) NULL DEFAULT NULL;

UPDATE TownCadaver
SET soulPoints = NULL;


-- ---------------------------------------------------------------------------
-- Users
--
-- Avatars stockés à « false ».
--
-- MyHordes n'est pas cohérent sur ce champ : selon la branche qui le produit, un joueur sans
-- avatar reçoit `null` (getUserData, qui n'écrit rien) ou le BOOLÉEN `false` — voir
-- `$media->getSource(200) ?: false` dans getCadaversInformation, et `$data['avatar'] = false`
-- dans getAuthorInformation.
--
-- Notre DTO typait ce champ en chaîne : le booléen y était converti puis stocké tel quel. La
-- base contient donc des avatars valant littéralement « false », que le site tente ensuite de
-- charger comme une URL.
--
-- `AvatarUrlConverter` empêche désormais ces valeurs d'entrer, mais il ne corrige pas celles qui
-- sont déjà là : cette instruction s'en charge.
--
-- NULL et non chaîne vide : une chaîne vide serait une URL vide, c'est-à-dire encore une valeur.
-- L'absence d'avatar doit se lire comme une absence.
--
-- La comparaison est insensible à la casse par défaut en utf8mb4_general_ci, ce qui couvre aussi
-- bien « false » que « False » selon la sérialisation qui a produit la ligne.
-- ---------------------------------------------------------------------------
UPDATE Users
SET avatar = NULL
WHERE avatar IN ('false', 'False', 'FALSE', '');
