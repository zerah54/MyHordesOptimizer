ALTER TABLE TownCitizen
ADD COLUMN ghoulVoracity INT NULL DEFAULT -1 AFTER isGhoul;

ALTER TABLE TownCitizen
ADD COLUMN idLastUpdateInfoGhoulStatus INT NULL DEFAULT NULL REFERENCES LastUpdateInfo(idLastUpdateInfo) AFTER ghoulVoracity; 