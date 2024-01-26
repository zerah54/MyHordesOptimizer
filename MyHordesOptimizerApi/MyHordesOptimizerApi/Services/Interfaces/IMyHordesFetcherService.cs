using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IMyHordesFetcherService
    {
        IEnumerable<ItemDto> GetItems(int? townId);
        SimpleMeDto GetSimpleMe();
        IEnumerable<HeroSkillDto> GetHeroSkills();
        IEnumerable<CauseOfDeathDto> GetCausesOfDeath();
        IEnumerable<CleanUpTypeDto> GetCleanUpTypes();
        IEnumerable<ItemRecipeDto> GetRecipes();
        BankLastUpdateDto GetBank();
        CitizensLastUpdateDto GetCitizens(int townId);
        IEnumerable<MyHordesOptimizerRuinDto> GetRuins(int? townId);
        MyHordesOptimizerMapDto GetMap(int townId);
        IEnumerable<MyHordesOptimizerMapDigDto> GetMapDigs(int townId);
        List<MyHordesOptimizerMapDigDto> CreateOrUpdateMapDigs(int? townId, int userId, List<MyHordesOptimizerMapDigDto> requests);
        void DeleteMapDigs(int idCell, int diggerId, int day);
        IEnumerable<MyHordesOptimizerMapUpdateDto> GetMapUpdates(int townId);
    }
}
