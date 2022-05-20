using MyHordesOptimizerApi.Dtos.MyHordes.Import;

namespace MyHordesOptimizerApi.Services.Interfaces.Import
{
    public interface IMyHordesImportService
    {
        void ImportHeroSkill(ImportHeroSkillRequestDto request);
        void ImportItems(ImportItemsRequestDto request);
        void ImportRuins();
    }
}
