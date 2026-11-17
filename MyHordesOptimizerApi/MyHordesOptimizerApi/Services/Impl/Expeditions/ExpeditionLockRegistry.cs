using MyHordesOptimizerApi.Services.Impl.Locks;
using System;

namespace MyHordesOptimizerApi.Services.Impl.Expeditions
{
    public enum ExpeditionLockKind
    {
        Expedition,
        Part,
        Citizen,
        Bag,
        PartOrders,
        CitizenOrders
    }

    /// <summary>Bloc verrouillable, tel que désigné par le client (sans la ville).</summary>
    public sealed record ExpeditionLockRef(ExpeditionLockKind Kind, int EntityId);

    /// <summary>Verrou d'un bloc d'expédition ; la ville fait partie de la clé.</summary>
    public sealed record ExpeditionLockKey(int MapId, ExpeditionLockKind Kind, int EntityId);

    /// <summary>Verrous en mémoire des blocs d'expédition, un détenteur par bloc.</summary>
    public sealed class ExpeditionLockRegistry : InMemoryLockRegistry<ExpeditionLockKey>
    {
        public ExpeditionLockRegistry(TimeProvider timeProvider) : base(timeProvider)
        {
        }
    }
}
