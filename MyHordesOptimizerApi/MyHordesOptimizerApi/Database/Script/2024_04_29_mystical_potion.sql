ALTER TABLE TownCitizen
ADD COLUMN isImmuneToSoul BIT NOT NULL DEFAULT 0,
ADD COLUMN nbPotionChamanique INT NOT NULL DEFAULT 0 AFTER isImmuneToSoul,
ADD COLUMN idLastUpdateChamanic INT AFTER nbPotionChamanique,
ADD FOREIGN KEY TownCitizen_fk_last_update_chamanic(idLastUpdateChamanic) REFERENCES LastUpdateInfo(idLastUpdateInfo);