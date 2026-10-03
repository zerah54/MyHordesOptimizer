-- ============================================================
-- Migration : mapcell-remaining-digs
-- Description : les fouilles restantes sont désormais STOCKÉES, et non
--               plus recalculées à l'affichage.
-- ============================================================
--
-- Avant : averagePotentialRemainingDig / maxPotentialRemainingDig portaient
-- un POTENTIEL (dotation + régénérations, remis à 0 quand la case était vue
-- épuisée) dont le site soustrayait la somme de TOUTES les fouilles réussies
-- enregistrées (MapCellDig). Une case vue épuisée après des fouilles réussies
-- tombait donc sous 0, et y restait même après une régénération.
--
-- Après : les deux colonnes portent directement ce qu'il RESTE à trouver
-- (estimation moyenne et plafond). Elles évoluent par événements côté API
-- (MapCellDigsExtensions, DigRegeneration) : observation -> ramenée dans sa
-- fourchette (épuisée : 0), régénération / excavation -> +, fouille réussie
-- -> -écart, sans descendre sous 0. Les noms des colonnes sont conservés.
--
-- isExcavated : case excavée par un Fouineur (champ `exc` de MyHordes).
-- NULL tant que MHO ne l'a pas relevé : un premier relevé ne déclenche pas
-- l'ajout d'objets de l'excavation, seule une transition 0 -> 1 le fait.
--
-- digsObservedDay : jour de la dernière observation de l'état de fouille de
-- la case. Avec isDryed, il permet de déduire une régénération quand une case
-- vue vide est retrouvée pleine (DigObservations). NULL pour l'existant : les
-- cases déjà marquées épuisées n'en bénéficient qu'après une nouvelle observation.
--
-- IDEMPOTENT : la conversion n'a lieu qu'avec l'ajout de la colonne
-- isExcavated, donc une seule fois. Elle doit être exécutée AVEC le
-- déploiement de l'API qui lit les colonnes sous leur nouveau sens.
-- ============================================================

DELIMITER
$$

BEGIN
NOT ATOMIC
    IF NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'MapCell'
                     AND COLUMN_NAME = 'isExcavated') THEN

ALTER TABLE MapCell
    ADD COLUMN isExcavated BIT(1) NULL AFTER tag;

-- Potentiel -> restant : ce que le site affichait jusqu'ici, borné à 0.
UPDATE MapCell mc
    LEFT JOIN (SELECT idCell, SUM (COALESCE (nbSucces, 0)) AS totalSucces
    FROM MapCellDig
    GROUP BY idCell) mcd
ON mcd.idCell = mc.idCell
    SET mc.averagePotentialRemainingDig = GREATEST(0, mc.averagePotentialRemainingDig - COALESCE (mcd.totalSucces, 0)), mc.maxPotentialRemainingDig = GREATEST(0, mc.maxPotentialRemainingDig - COALESCE (mcd.totalSucces, 0))
WHERE mc.isTown = 0
  AND (mc.averagePotentialRemainingDig IS NOT NULL
   OR mc.maxPotentialRemainingDig IS NOT NULL);

-- Une case marquée épuisée n'a plus rien à trouver, quelles qu'aient été les valeurs.
UPDATE MapCell
SET averagePotentialRemainingDig = 0,
    maxPotentialRemainingDig     = 0
WHERE isTown = 0
  AND isDryed = 1;
END IF;

    IF
NOT EXISTS (SELECT 1
                   FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'MapCell'
                     AND COLUMN_NAME = 'digsObservedDay') THEN

ALTER TABLE MapCell
    ADD COLUMN digsObservedDay INT(11) NULL AFTER isExcavated;
END IF;
END $$

DELIMITER ;
