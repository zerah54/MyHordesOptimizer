using MyHordesOptimizerApi.Models.Import;
using System;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces.Import
{
    public interface IMyHordesImportService
    {
        Task ImportJobsAsync();
        Task ImportHeroSkill();
        Task ImportCauseOfDeath();
        void ImportCleanUpTypes();
        Task ImportBuildingAsync();
        void ImportRuins();
        void ImportPictos();
        Task ImportCategoriesAsync();
        Task ImportItemsAsync();
        Task ImportAllAsync(Action<ImportStepProgress> onStep = null);
        void ImportWishlistCategorie();
        void ImportDefaultWishlists();
        /// <param name="resume">
        /// Ignore les villes déjà importées depuis le classement (<c>Town.rankingImportedAt</c>).
        /// Indispensable pour venir à bout d'une saison ancienne, que le quota MyHordes ne laisse pas
        /// importer en une passe. À laisser à faux pour rafraîchir des villes déjà connues.
        /// </param>
        Task ImportTownsAsync(int? season = null, bool resume = false, Action<ImportStepProgress> onStep = null);
        Task ImportSingleTownAsync(int townId);
        Task RefreshUserNamesAsync(int? limit = null);
        Task RecomputeUserDirectoryStatsAsync();

        /// <summary>
        /// Reprise unique : renseigne <c>mhId</c> sur les quatre référentiels, et <c>uid</c> sur
        /// les pictos, en rapprochant chaque ligne de MyHordes sur son identité. Constate sans
        /// marquer d'obsolescence.
        /// </summary>
        Task<ReferentialBackfillReport> BackfillReferentialIdsAsync();
    }
}
