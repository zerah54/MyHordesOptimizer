-- ============================================================
-- Migration : utf8mb4-textes-libres
-- Description : passe en utf8mb4 toutes les colonnes de texte libre
--               (saisi dans MHO, écrit par les joueurs dans MyHordes,
--               ou textes d'affichage importés de MyHordes).
--
-- Pourquoi : une colonne NVARCHAR est toujours en utf8mb3 (3 octets),
-- quel que soit le jeu par défaut de la base. utf8mb3 accepte les
-- accents et la plupart des symboles, mais refuse les caractères sur
-- 4 octets (émojis notamment) : « Incorrect string value » à l'écriture.
-- Les colonnes TEXT héritent, elles, du jeu de leur table à sa création,
-- qui n'est pas toujours utf8mb4 (cf. 2025_04_19_fix_cadavers_encoding).
--
-- Ne convertit que les colonnes de la liste qui ne sont pas déjà en
-- utf8mb4, en conservant leur type, leur nullabilité, leur valeur par
-- défaut et leur commentaire (lus dans information_schema). Les clés
-- (uid, name de référentiel, jobUID, état…) restent en utf8mb3 : elles
-- sont en ASCII et liées par des clés étrangères à d'autres colonnes
-- utf8mb3.
--
-- Collation : utf8mb4_unicode_ci, celle de la base depuis
-- 2026_07_03_citizen_unification.sql.
--
-- IDEMPOTENT. Indépendant du déploiement de l'API (avant ou après).
-- Syntaxe MariaDB (BEGIN NOT ATOMIC, EXECUTE IMMEDIATE), comme les
-- autres scripts. Réécrit les tables concernées : quelques secondes.
-- ============================================================

DELIMITER
$$

BEGIN
NOT ATOMIC
    DECLARE
done BOOLEAN DEFAULT FALSE;
    DECLARE
v_table VARCHAR(64);
    DECLARE
v_column VARCHAR(64);
    DECLARE
v_type LONGTEXT;
    DECLARE
v_nullable VARCHAR(3);
    DECLARE
v_default LONGTEXT;
    DECLARE
v_comment LONGTEXT;
    DECLARE
columns_to_convert CURSOR FOR
SELECT c.TABLE_NAME, c.COLUMN_NAME, c.COLUMN_TYPE, c.IS_NULLABLE, c.COLUMN_DEFAULT, c.COLUMN_COMMENT
FROM information_schema.COLUMNS c
WHERE c.TABLE_SCHEMA = DATABASE()
  AND c.CHARACTER_SET_NAME IS NOT NULL
  AND c.CHARACTER_SET_NAME <> 'utf8mb4'
  AND (c.TABLE_NAME, c.COLUMN_NAME) IN (
    -- Texte saisi dans MHO
                                        ('Expedition', 'label'), ('ExpeditionPart', 'label'),
                                        ('ExpeditionPart', 'path'),
                                        ('ExpeditionOrder', 'text'), ('MapCell', 'note'), ('UserNote', 'note'),
                                        ('TownNote', 'note'),
    -- Texte écrit par les joueurs dans MyHordes (importé)
                                        ('Users', 'name'), ('Town', 'name'), ('TownCitizen', 'nameInTown'),
                                        ('TownCitizen', 'homeMessage'), ('TownCadaver', 'cadaverName'),
                                        ('TownCadaver', 'deathMessage'),
                                        ('TownCadaver', 'townMessage'), ('TownPublicCitizen', 'name'),
                                        ('TownPublicCitizen', 'message'),
                                        ('TownPublicCitizen', 'comment'),
    -- Textes d'affichage de MyHordes (importés)
                                        ('Item', 'label_fr'), ('Item', 'label_en'), ('Item', 'label_es'),
                                        ('Item', 'label_de'), ('Item', 'description_fr'), ('Item', 'description_en'),
                                        ('Item', 'description_es'), ('Item', 'description_de'), ('Ruin', 'label_fr'),
                                        ('Ruin', 'label_en'), ('Ruin', 'label_es'), ('Ruin', 'label_de'),
                                        ('Ruin', 'description_fr'), ('Ruin', 'description_en'),
                                        ('Ruin', 'description_es'),
                                        ('Ruin', 'description_de'), ('Building', 'label_fr'), ('Building', 'label_en'),
                                        ('Building', 'label_es'), ('Building', 'label_de'),
                                        ('Building', 'description_fr'),
                                        ('Building', 'description_en'), ('Building', 'description_es'),
                                        ('Building', 'description_de'),
                                        ('Category', 'label_fr'), ('Category', 'label_en'), ('Category', 'label_es'),
                                        ('Category', 'label_de'), ('Recipe', 'action_fr'), ('Recipe', 'action_en'),
                                        ('Recipe', 'action_es'), ('Recipe', 'action_de'),
                                        ('Recipe', 'forcedErrorMessage'),
                                        ('HeroSkills', 'label_fr'), ('HeroSkills', 'label_en'),
                                        ('HeroSkills', 'label_es'),
                                        ('HeroSkills', 'label_de'), ('HeroSkills', 'description_fr'),
                                        ('HeroSkills', 'description_en'),
                                        ('HeroSkills', 'description_es'), ('HeroSkills', 'description_de'),
                                        ('HeroSkills', 'group_fr'),
                                        ('HeroSkills', 'group_en'), ('HeroSkills', 'group_es'),
                                        ('HeroSkills', 'group_de'),
                                        ('HeroSkills', 'bullets_fr'), ('HeroSkills', 'bullets_en'),
                                        ('HeroSkills', 'bullets_es'),
                                        ('HeroSkills', 'bullets_de'), ('CauseOfDeath', 'label_fr'),
                                        ('CauseOfDeath', 'label_en'),
                                        ('CauseOfDeath', 'label_es'), ('CauseOfDeath', 'label_de'),
                                        ('CauseOfDeath', 'description_fr'),
                                        ('CauseOfDeath', 'description_en'), ('CauseOfDeath', 'description_es'),
                                        ('CauseOfDeath', 'description_de'),
                                        ('Picto', 'nameFr'), ('Picto', 'nameEn'), ('Picto', 'nameEs'),
                                        ('Picto', 'nameDe'), ('Picto', 'descFr'), ('Picto', 'descEn'),
                                        ('Picto', 'descEs'), ('Picto', 'descDe'), ('WishlistCategorie', 'label_fr'),
                                        ('WishlistCategorie', 'label_en'), ('WishlistCategorie', 'label_es'),
                                        ('WishlistCategorie', 'label_de'),
                                        ('DefaultWishlistItem', 'label_fr'), ('DefaultWishlistItem', 'label_en'),
                                        ('DefaultWishlistItem', 'label_es'),
                                        ('DefaultWishlistItem', 'label_de'), ('TownCitizen', 'jobName')
    );
DECLARE
CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

OPEN columns_to_convert;
convert_loop
: LOOP
        FETCH columns_to_convert INTO v_table, v_column, v_type, v_nullable, v_default, v_comment;
        IF
done THEN
            LEAVE convert_loop;
END IF;
        -- COLUMN_TYPE ne porte pas le jeu de caractères (varchar(255), text, longtext…).
        -- MariaDB renvoie COLUMN_DEFAULT sous forme d'expression ('NULL' ou littéral entre quotes).
EXECUTE IMMEDIATE CONCAT(
        'ALTER TABLE `', v_table, '` MODIFY COLUMN `', v_column, '` ', v_type,
        ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        IF(v_nullable = 'YES', ' NULL', ' NOT NULL'),
        IF(v_default IS NULL OR v_default = 'NULL', '', CONCAT(' DEFAULT ', v_default)),
        IF(v_comment = '', '', CONCAT(' COMMENT ', QUOTE(v_comment))));
END LOOP;
CLOSE columns_to_convert;
END $$

DELIMITER ;

-- Vérification : colonnes de texte restées hors utf8mb4. Ne doivent rester
-- que des clés ou codes en ASCII (uid, name de référentiel, jobUID, img,
-- icon, state, type, direction, preinscritJob, preinscritHeroic…).
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, CHARACTER_SET_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND CHARACTER_SET_NAME IS NOT NULL
  AND CHARACTER_SET_NAME <> 'utf8mb4'
ORDER BY TABLE_NAME, ORDINAL_POSITION;
