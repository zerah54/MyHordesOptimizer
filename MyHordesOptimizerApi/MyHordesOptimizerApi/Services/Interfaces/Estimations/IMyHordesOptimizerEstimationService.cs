using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Services.Impl.Estimations;

namespace MyHordesOptimizerApi.Services.Interfaces.Estimations
{
    public interface IMyHordesOptimizerEstimationService
    {
        void UpdateEstimations(int townId, EstimationRequestDto request);
        EstimationRequestDto GetEstimations(int townId, int day);
        AttackSettingsDto GetAttackSettings(int townId, int day);
        /// <summary>Réglages saisis complétés des défauts appliqués quand ils sont absents.</summary>
        AttackSettingsDto GetAttackSettingsWithDefaults(int townId, int day);
        void UpdateAttackSettings(int townId, int day, AttackSettingsDto settings);
        EstimationResultDto CalculateAttack(int townId, int dayAttack, bool beta = false, AttackDifficulty difficulty = AttackDifficulty.Normal);
        EstimationTuple CreateTupleFromValue(string key, EstimationValueDto? value);
    }
}
