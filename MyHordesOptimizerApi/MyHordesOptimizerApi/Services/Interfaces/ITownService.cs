using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface ITownService
    {
        LastUpdateInfoDto AddCitizenBath(int townId, int userId, int day);
        CitizenDto DeleteCitizenBath(int townId, int userId, int day);
        CitizenDto GetTownCitizen(int townId, int userId);

        LastUpdateInfoDto UpdateCitizenChamanicDetail(int townId, int userId, CitizenChamanicDetailDto chamanicDetailDto);
    }
}
