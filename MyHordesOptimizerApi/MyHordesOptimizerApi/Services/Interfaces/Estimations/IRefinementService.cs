using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Services.Impl.Estimations.Refinement;

namespace MyHordesOptimizerApi.Services.Interfaces.Estimations
{
    public interface IRefinementService
    {
        /// <summary>Entrées du scan de l'attaque du jour, null si aucune estimation n'est saisie.</summary>
        RefinementInput? GetInput(int townId, int day);

        /// <summary>Vue de l'affinage, recalculé d'abord s'il est périmé.</summary>
        RefinementViewDto Get(int townId, int day);

        /// <exception cref="RefinementConflictException">Saisies modifiées de façon incompatible depuis GetInput.</exception>
        RefinementViewDto Upload(int townId, int day, RefinementInput uploaded, uint[] seeds);
    }
}
