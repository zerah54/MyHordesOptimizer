using System.Collections.Generic;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface ICampingService
    {
        CampingOddsDto CalculateCamping(CampingParametersDto campingParametersDto);
        CampingBonusDto GetBonus();
        List<CampingResultDto> GetResults();
    }
}
