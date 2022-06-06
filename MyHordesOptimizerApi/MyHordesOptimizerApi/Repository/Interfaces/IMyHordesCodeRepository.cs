using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Data.Ruins;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesCodeRepository
    {
        Dictionary<string, MyHordesRuinCodeModel> GetRuins();
        List<MyHordesCategoryCodeModel> GetCategories();
    }
}
