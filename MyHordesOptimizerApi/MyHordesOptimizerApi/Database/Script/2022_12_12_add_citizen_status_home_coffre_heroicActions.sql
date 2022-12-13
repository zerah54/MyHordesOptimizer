﻿-- Heroic actions
ALTER TABLE TownCitizen
ADD COLUMN hasRescue BIT NULL DEFAULT NULL;

ALTER TABLE TownCitizen
ADD COLUMN APAGcharges INT NULL DEFAULT NULL;

ALTER TABLE TownCitizen
ADD COLUMN hasUppercut BIT NULL DEFAULT NULL;

ALTER TABLE TownCitizen
ADD COLUMN hasSecondWind BIT NULL DEFAULT NULL;

ALTER TABLE TownCitizen
ADD COLUMN hasLuckyFind BIT NULL DEFAULT NULL;

ALTER TABLE TownCitizen
ADD COLUMN hasCheatDeath BIT NULL DEFAULT NULL;

ALTER TABLE TownCitizen
ADD COLUMN hasHeroicReturn BIT NULL DEFAULT NULL;

ALTER TABLE TownCitizen
ADD COLUMN idLastUpdateInfoHeroicAction INT NULL DEFAULT NULL REFERENCES LastUpdateInfo(idLastUpdateInfo) AFTER hasHeroicReturn; 

-- Home
ALTER TABLE TownCitizen
ADD COLUMN houseLevel INT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN hasAlarm BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN chestLevel INT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN hasCurtain BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN houseDefense INT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN kitchenLevel INT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN laboLevel INT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN hasLock BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN restLevel INT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN idLastUpdateInfoHome INT NULL DEFAULT NULL REFERENCES LastUpdateInfo(idLastUpdateInfo) AFTER restLevel; 

-- Status
ALTER TABLE TownCitizen
ADD COLUMN isCleanBody BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isCamper BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isAddict BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isDrugged BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isDrunk BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isGhoul BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isQuenched BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isConvalescent BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isSated BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isCheatingDeathActive BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isHangOver BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isImmune BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isInfected BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isTerrorised BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isThirsty BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isDesy BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isTired BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isHeadWounded BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isHandWounded BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isArmWounded BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isLegWounded BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isEyeWounded BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN isFootWounded BIT NULL DEFAULT 0;

ALTER TABLE TownCitizen
ADD COLUMN idLastUpdateInfoStatus INT NULL DEFAULT NULL REFERENCES LastUpdateInfo(idLastUpdateInfo) AFTER isFootWounded; 