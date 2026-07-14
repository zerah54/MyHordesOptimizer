using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesApiRepository
    {
        Dictionary<string, MyHordesItem> GetItems();
        MyHordesMeResponseDto GetMe();
        Dictionary<string, MyHordesApiRuinDto> GetRuins();
        Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync();
        List<int> GetTownList(int? season = null);
        List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids);
        MyHordesMap GetMapDetails(int mapId);
    }
}
