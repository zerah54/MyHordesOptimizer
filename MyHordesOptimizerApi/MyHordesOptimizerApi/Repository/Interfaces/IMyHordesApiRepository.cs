using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesApiRepository
    {
        Dictionary<string, MyHordesItem> GetItems();
        MyHordesUserDetailsDto GetMe();
        MyHordesUserDetailsDto GetUserPictos(int userId);
        List<MyHordesUserDto> GetUsersIdentity(List<int> ids);
        Dictionary<string, MyHordesApiPictoDto> GetPictos();
        Dictionary<string, MyHordesApiRuinDto> GetRuins();
        Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync();
        List<int> GetTownList(int? season = null);
        List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids);
        MyHordesMap GetMapDetails(int mapId);
    }
}
