using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface ICampingService
    {
        int CalculateCamping(CampingParametersDto campingParametersDto);
        CampingBonusDto GetBonus();
    }
}
