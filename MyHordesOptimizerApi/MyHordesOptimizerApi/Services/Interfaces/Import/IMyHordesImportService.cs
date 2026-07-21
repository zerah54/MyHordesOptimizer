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
        Task ImportTownsAsync(int? season = null, Action<ImportStepProgress> onStep = null);
        Task ImportSingleTownAsync(int townId);
        Task RefreshUserNamesAsync(int? limit = null);
        Task RecomputeUserDirectoryStatsAsync();
    }
}
