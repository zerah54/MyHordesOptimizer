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
        Task ImportAllAsync();
        void ImportWishlistCategorie();
        void ImportDefaultWishlists();
        Task ImportTownsAsync(int? season = null);
        Task ImportSingleTownAsync(int townId);
        Task RefreshUserNamesAsync(int? limit = null);
        Task RecomputeUserDirectoryStatsAsync();
    }
}
