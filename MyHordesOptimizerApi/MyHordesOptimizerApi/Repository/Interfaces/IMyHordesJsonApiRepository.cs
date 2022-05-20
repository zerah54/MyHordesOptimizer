using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesJsonApiRepository
    {
        Dictionary<string, MyHordesJsonItem> GetItems();
        MyHordesMeResponseDto GetMe();
        Dictionary<string, MyHordesApiRuinDto> GetRuins();
    }
}
