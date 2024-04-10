using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface ITownService
    {
        CitizenDto AddCitizenBath(int townId, int userId, int day);
        CitizenDto DeleteCitizenBath(int townId, int userId, int day);
        CitizenDto GetTownCitizen(int townId, int userId);
    }
}
