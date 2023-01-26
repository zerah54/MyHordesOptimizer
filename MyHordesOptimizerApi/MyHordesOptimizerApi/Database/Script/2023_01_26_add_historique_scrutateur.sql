ALTER TABLE MapCellDigUpdate ADD COLUMN directionRegen INT NULL;
ALTER TABLE MapCellDigUpdate ADD COLUMN levelRegen INT NULL;
ALTER TABLE MapCellDigUpdate ADD COLUMN tauxRegen INT NULL;

UPDATE MapCellDigUpdate SET directionRegen = 8, levelRegen = 0, tauxRegen = 25 WHERE directionRegen IS NULL;