using MyHordesOptimizerApi.Services.Impl.Locks;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Impl.BuildingPlans
{
    /// <summary>Verrou d'une proposition de plan ; la ville fait partie de la clé.</summary>
    public sealed record PlanLockKey(int MapId, int PlanId);

    /// <summary>Verrous en mémoire des propositions de plan, un détenteur par proposition.</summary>
    public sealed class BuildingPlanLockRegistry : InMemoryLockRegistry<PlanLockKey>
    {
        public BuildingPlanLockRegistry(TimeProvider timeProvider) : base(timeProvider)
        {
        }

        /// <summary>Verrous actifs de la ville demandée.</summary>
        public IReadOnlyList<(PlanLockKey Key, LockHolder Holder)> ActiveHoldersOf(int mapId)
        {
            return ActiveHolders(k => k.MapId == mapId);
        }
    }
}
