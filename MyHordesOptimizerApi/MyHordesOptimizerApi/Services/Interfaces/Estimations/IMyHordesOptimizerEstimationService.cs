using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;

namespace MyHordesOptimizerApi.Services.Interfaces.Estimations
{
    public interface IMyHordesOptimizerEstimationService
    {
        void UpdateEstimations(int townId, EstimationRequestDto request);
        EstimationRequestDto GetEstimations(int townId, int day);
    }
}
