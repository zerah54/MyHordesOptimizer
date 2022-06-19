using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces.Import
{
    public interface IMyHordesImportService
    {
        Task ImportHeroSkill();
        void ImportRuins();
        Task ImportCategoriesAsync();
        void ImportItems();
    }
}
