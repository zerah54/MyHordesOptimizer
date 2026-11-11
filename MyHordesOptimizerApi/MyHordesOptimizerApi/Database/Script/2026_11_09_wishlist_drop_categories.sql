-- À exécuter APRÈS le déploiement de l'API.
-- Retrait des anciennes catégories de liste de courses et du modèle « Opti J1 ».
DROP TABLE IF EXISTS WishlistCategorieItem;
DROP TABLE IF EXISTS WishlistCategorie;
DROP TABLE IF EXISTS DefaultWishlistItem;
