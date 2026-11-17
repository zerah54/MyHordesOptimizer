using MyHordesOptimizerApi.Services.Impl.Expeditions;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    /// <summary>Calcule, en lecture seule, les blocs de verrou touchés par une opération sur les expéditions.</summary>
    public interface IExpeditionLockScopeService
    {
        /// <summary>Bloc de consignes propriétaire d'une consigne : celui du citoyen, sinon ceux des parties liées.</summary>
        Task<IReadOnlyList<ExpeditionLockRef>> OwnersOfOrderAsync(int orderId);

        /// <summary>Blocs sac des citoyens utilisant ce sac.</summary>
        Task<IReadOnlyList<ExpeditionLockRef>> OwnersOfBagAsync(int bagId);

        /// <summary>Le citoyen, son sac et ses consignes.</summary>
        Task<IReadOnlyList<ExpeditionLockRef>> WithDescendantsOfCitizenAsync(int citizenId);

        /// <summary>La partie, ses consignes, puis les blocs de chacun de ses citoyens.</summary>
        Task<IReadOnlyList<ExpeditionLockRef>> WithDescendantsOfPartAsync(int partId);

        /// <summary>L'expédition, puis les blocs de chacune de ses parties.</summary>
        Task<IReadOnlyList<ExpeditionLockRef>> WithDescendantsOfExpeditionAsync(int expeditionId);

        /// <summary>Les blocs de toutes les expéditions de la ville pour ce jour.</summary>
        Task<IReadOnlyList<ExpeditionLockRef>> OfDayAsync(int mapId, int day);
    }
}
