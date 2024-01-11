ALTER TABLE TownWishListItem
    ADD COLUMN shouldSignal BIT NULL DEFAULT 0 AFTER depot;

ALTER TABLE DefaultWishlistItem
    ADD COLUMN depot BIT NULL DEFAULT 0 AFTER priority;

ALTER TABLE DefaultWishlistItem
    ADD COLUMN shouldSignal BIT NULL DEFAULT 0 AFTER depot;