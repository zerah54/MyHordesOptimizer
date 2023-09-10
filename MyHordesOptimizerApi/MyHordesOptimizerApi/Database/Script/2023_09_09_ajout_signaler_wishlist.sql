ALTER TABLE TownWishListItem
    ADD COLUMN shouldSignal BIT NULL DEFAULT 0 AFTER depot;

ALTER TABLE DefaultWishListItem
    ADD COLUMN depot BIT NULL DEFAULT 0 AFTER priority;

ALTER TABLE DefaultWishListItem
    ADD COLUMN shouldSignal BIT NULL DEFAULT 0 AFTER depot;