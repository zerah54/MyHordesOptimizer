using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IMyHordesFetcherService
    {
        IEnumerable<Item> GetItems(int? townId);
        Town GetTown();
        SimpleMe GetSimpleMe();
        IEnumerable<HeroSkill> GetHeroSkills();
        IEnumerable<ItemRecipe> GetRecipes();
        BankWrapper GetBank();
        CitizensWrapper GetCitizens(int townId);
        IEnumerable<MyHordesOptimizerRuin> GetRuins();
        IEnumerable<MyHordesOptimizerCellDto> GetCells(int townId);
    }
}
