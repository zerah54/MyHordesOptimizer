namespace MyHordesOptimizerApi.Services.Caching
{
    /// <summary>
    /// Clés de cache mémoire des référentiels à invalidation manuelle (groupe A). Centralisées ici
    /// pour que le contrôleur qui lit le cache (Fetcher/Parameters/WishList) et celui qui l'invalide
    /// après import (MyHordesDataImportController, AdminController) utilisent toujours la même clé.
    /// </summary>
    public static class ReferentialCacheKeys
    {
        public const string Items = "referentiel:items";
        public const string Ruins = "referentiel:ruins";
        public const string Buildings = "referentiel:buildings";
        public const string HeroSkills = "referentiel:heroskills";
        public const string CausesOfDeath = "referentiel:causesofdeath";
        public const string CleanUpTypes = "referentiel:cleanuptypes";
        public const string Recipes = "referentiel:recipes";
        public const string Parameters = "referentiel:parameters";
        public const string WishListCategories = "referentiel:wishlistcategories";
        public const string WishListTemplates = "referentiel:wishlisttemplates";

        // Groupe B (TTL, voir TownController) mais avec un point d'écriture identifiable
        // (Admin/seasons/{season}/finish|unfinish) : centralisées ici pour la même raison que le
        // groupe A, TownController (lecture) et AdminController (écriture) doivent partager la clé.
        public const string Seasons = "referentiel:seasons";
        public const string SeasonPhases = "referentiel:season-phases";
    }
}
