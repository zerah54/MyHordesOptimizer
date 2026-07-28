using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using System.Collections.Generic;
using System.Threading.Tasks;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Buildings;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IMyHordesFetcherService
    {
        IEnumerable<ItemDto> GetItems(int? townId);
        Task<SimpleMeDto> GetSimpleMeAsync();
        IEnumerable<HeroSkillDto> GetHeroSkills();
        IEnumerable<CauseOfDeathDto> GetCausesOfDeath();
        IEnumerable<CleanUpTypeDto> GetCleanUpTypes();
        IEnumerable<ItemRecipeDto> GetRecipes();
        BankLastUpdateDto GetBank();
        BankLastUpdateDto GetBank(int townId);
        Task<bool> ImportUserPictosAsync(int userId);
        CitizensLastUpdateDto GetCitizens(int townId);
        IEnumerable<MyHordesOptimizerRuinDto> GetRuins(int? townId);
        IEnumerable<BuildingDto> GetBuildings();
        MyHordesOptimizerMapDto GetMap(int townId);
        IEnumerable<MyHordesOptimizerMapDigDto> GetMapDigs(int townId);
        List<MyHordesOptimizerMapDigDto> CreateOrUpdateMapDigs(int townId, int userId, List<MyHordesOptimizerMapDigDto> requests);
        void DeleteMapDigs(int idCell, int diggerId, int day);
        IEnumerable<MyHordesOptimizerMapUpdateDto> GetMapUpdates(int townId);
    }
}
