-- ============================================================
-- Migration : heroskill-tree
-- Description : arbre de compétences héros (Wiki > Pouvoirs).
-- ============================================================
--
-- capacities.json porte, en plus des 24 compétences historiques
-- (legacy = 1), 20 compétences de l'arbre actuel (super_*) : 5 groupes
-- de 4 niveaux. Colonnes ajoutées à HeroSkills :
--
-- legacy      : 1 pour une compétence de l'ancien système, 0 sinon
--               (arbre actuel et pouvoirs de powers.json).
-- groupSort   : ordre d'affichage du groupe (champ `sort`).
-- level       : niveau dans le groupe, de 0 à 3.
-- group_xx    : libellé du groupe, traduit à l'import comme les
--               libellés (repli sur l'allemand faute de traduction).
-- bullets_xx  : avantages du niveau, traduits de même, en tableau JSON.
--
-- Toutes NULL hors de l'arbre, et pour l'existant jusqu'au prochain
-- import : rejouer l'import des compétences héros (DataImport/HeroSkill)
-- après ce script pour les renseigner.
--
-- IDEMPOTENT : chaque colonne n'est ajoutée que si elle est absente.
-- ============================================================

DELIMITER
$$

BEGIN
NOT ATOMIC
    IF NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'HeroSkills'
                     AND COLUMN_NAME = 'legacy') THEN
ALTER TABLE HeroSkills
    ADD COLUMN `legacy` BIT(1) NULL AFTER `nbUses`;
END IF;

    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'HeroSkills'
                     AND COLUMN_NAME = 'groupSort') THEN
ALTER TABLE HeroSkills
    ADD COLUMN `groupSort` INT(11) NULL AFTER `legacy`;
END IF;

    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'HeroSkills'
                     AND COLUMN_NAME = 'level') THEN
ALTER TABLE HeroSkills
    ADD COLUMN `level` INT(11) NULL AFTER `groupSort`;
END IF;

    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'HeroSkills'
                     AND COLUMN_NAME = 'group_fr') THEN
ALTER TABLE HeroSkills
    ADD COLUMN `group_fr` TEXT NULL AFTER `level`;
END IF;

    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'HeroSkills'
                     AND COLUMN_NAME = 'group_en') THEN
ALTER TABLE HeroSkills
    ADD COLUMN `group_en` TEXT NULL AFTER `group_fr`;
END IF;

    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'HeroSkills'
                     AND COLUMN_NAME = 'group_es') THEN
ALTER TABLE HeroSkills
    ADD COLUMN `group_es` TEXT NULL AFTER `group_en`;
END IF;

    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'HeroSkills'
                     AND COLUMN_NAME = 'group_de') THEN
ALTER TABLE HeroSkills
    ADD COLUMN `group_de` TEXT NULL AFTER `group_es`;
END IF;

    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'HeroSkills'
                     AND COLUMN_NAME = 'bullets_fr') THEN
ALTER TABLE HeroSkills
    ADD COLUMN `bullets_fr` TEXT NULL AFTER `group_de`;
END IF;

    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'HeroSkills'
                     AND COLUMN_NAME = 'bullets_en') THEN
ALTER TABLE HeroSkills
    ADD COLUMN `bullets_en` TEXT NULL AFTER `bullets_fr`;
END IF;

    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'HeroSkills'
                     AND COLUMN_NAME = 'bullets_es') THEN
ALTER TABLE HeroSkills
    ADD COLUMN `bullets_es` TEXT NULL AFTER `bullets_en`;
END IF;

    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'HeroSkills'
                     AND COLUMN_NAME = 'bullets_de') THEN
ALTER TABLE HeroSkills
    ADD COLUMN `bullets_de` TEXT NULL AFTER `bullets_es`;
END IF;
END $$

DELIMITER ;
