using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IMyHordesFetcherService
    {
        IEnumerable<Item> GetItems(int? townId);
        Town GetTown();
        SimpleMeDto GetSimpleMe();
        IEnumerable<HeroSkill> GetHeroSkills();
        IEnumerable<CauseOfDeath> GetCausesOfDeath();
        IEnumerable<CleanUpType> GetCleanUpTypes();
        IEnumerable<ItemRecipe> GetRecipes();
        BankWrapper GetBank();
        CitizensWrapper GetCitizens(int townId);
        IEnumerable<MyHordesOptimizerRuin> GetRuins();
        MyHordesOptimizerMapDto GetMap(int townId);
        IEnumerable<MyHordesOptimizerMapDigDto> GetMapDigs(int townId);
        List<MyHordesOptimizerMapDigDto> CreateOrUpdateMapDigs(int? townId, int userId, List<MyHordesOptimizerMapDigDto> requests);
        void DeleteMapDigs(int idCell, int diggerId, int day);
        IEnumerable<MyHordesOptimizerMapUpdateDto> GetMapUpdates(int townId);
    }
}
