-- ============================================================
-- Migration : pre-town-simulated-citizens
-- Description : nombre de citoyens simulés d'une pré-ville (chiffrage Chantiers / Veilles avant le lancement).
-- IDEMPOTENT. À exécuter AVANT le déploiement de l'API.
-- ============================================================

ALTER TABLE PreTown
    ADD COLUMN IF NOT EXISTS simulatedCitizens INT (11) NOT NULL DEFAULT 40;
