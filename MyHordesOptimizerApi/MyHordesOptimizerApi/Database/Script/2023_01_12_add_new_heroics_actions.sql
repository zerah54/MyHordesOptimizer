﻿ALTER TABLE TownCitizen
ADD COLUMN hasBreakThrough BIT NULL DEFAULT NULL AFTER hasHeroicReturn;

ALTER TABLE TownCitizen
ADD COLUMN hasBrotherInArms BIT NULL DEFAULT NULL AFTER hasBreakThrough;