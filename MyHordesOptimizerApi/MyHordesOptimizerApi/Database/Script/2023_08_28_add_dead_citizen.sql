﻿ALTER TABLE TownCitizen
    ADD COLUMN dead BIT NULL DEFAULT 0 AFTER isGhost;