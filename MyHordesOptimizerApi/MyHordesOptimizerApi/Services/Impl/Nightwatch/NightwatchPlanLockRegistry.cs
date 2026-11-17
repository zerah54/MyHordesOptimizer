using MyHordesOptimizerApi.Services.Impl.Locks;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Impl.Nightwatch
{
    /// <summary>Verrou d'une proposition de plan de veille ; la ville fait partie de la clé.</summary>
    public sealed record NightwatchPlanLockKey(int MapId, int PlanId);

    /// <summary>Verrous en mémoire des propositions de plan de veille, un détenteur par proposition.</summary>
    public sealed class NightwatchPlanLockRegistry : InMemoryLockRegistry<NightwatchPlanLockKey>
    {
        public NightwatchPlanLockRegistry(TimeProvider timeProvider) : base(timeProvider)
        {
        }

        /// <summary>Verrous actifs de la ville demandée.</summary>
        public IReadOnlyList<(NightwatchPlanLockKey Key, LockHolder Holder)> ActiveHoldersOf(int mapId)
        {
            return ActiveHolders(k => k.MapId == mapId);
        }
    }
}
