using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface ITownService
    {
        CitizenDto GetTownCitizen(int townId, int userId);
    }
}
