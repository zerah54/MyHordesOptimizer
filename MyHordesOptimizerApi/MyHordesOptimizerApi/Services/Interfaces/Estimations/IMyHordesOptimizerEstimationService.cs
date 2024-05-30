using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Services.Impl.Estimations;

namespace MyHordesOptimizerApi.Services.Interfaces.Estimations
{
    public interface IMyHordesOptimizerEstimationService
    {
        void UpdateEstimations(int townId, EstimationRequestDto request);
        EstimationRequestDto GetEstimations(int townId, int day);
        EstimationValueDto ApofooCalculateAttack(int townId, int dayAttack, bool beta = false);
        EstimationTuple CreateTupleFromValue(string key, EstimationValueDto value);
    }
}
