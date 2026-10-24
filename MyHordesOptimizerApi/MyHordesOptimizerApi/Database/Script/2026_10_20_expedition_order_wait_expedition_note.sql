-- ============================================================
-- Migration : expedition-order-wait-expedition-note
-- Description : consignes typées d'expédition :
--               - idTargetExpedition : « Attendre » une autre
--                 expédition du jour, à la place d'un citoyen ;
--               - note : précision libre (texte brut) affichée à la
--                 suite d'une consigne typée.
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API.
-- Syntaxe MariaDB (BEGIN NOT ATOMIC), comme les autres scripts.
-- ============================================================

-- ON DELETE SET NULL : supprimer l'expédition attendue fait attendre le groupe, comme pour idTargetUser.
DELIMITER
$$

BEGIN
NOT ATOMIC
ALTER TABLE ExpeditionOrder
    ADD COLUMN IF NOT EXISTS idTargetExpedition INT (11) NULL,
    ADD COLUMN IF NOT EXISTS note VARCHAR (255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

IF
NOT EXISTS (SELECT 1
                   FROM information_schema.TABLE_CONSTRAINTS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'ExpeditionOrder'
                     AND CONSTRAINT_NAME = 'ExpeditionOrder_fk_targetExpedition') THEN
ALTER TABLE ExpeditionOrder
    ADD CONSTRAINT ExpeditionOrder_fk_targetExpedition FOREIGN KEY (idTargetExpedition) REFERENCES Expedition (idExpedition) ON DELETE SET NULL;
END IF;
END $$

DELIMITER ;
