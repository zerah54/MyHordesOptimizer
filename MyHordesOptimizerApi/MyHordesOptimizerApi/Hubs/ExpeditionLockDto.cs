using MyHordesOptimizerApi.Services.Impl.Expeditions;
using System;

namespace MyHordesOptimizerApi.Hubs
{
    /// <summary>État d'un verrou de bloc diffusé aux clients ; <see cref="HolderUserId"/> null = libre.</summary>
    public sealed class ExpeditionLockDto
    {
        public string Kind { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public int? HolderUserId { get; set; }
        public string? HolderConnectionId { get; set; }

        /// <summary>Type de bloc depuis son nom client ; false si inconnu.</summary>
        public static bool TryParseKind(string name, out ExpeditionLockKind kind)
        {
            foreach (var candidate in Enum.GetValues<ExpeditionLockKind>())
            {
                if (KindName(candidate) == name)
                {
                    kind = candidate;
                    return true;
                }
            }
            kind = default;
            return false;
        }

        /// <summary>Nom du type de bloc côté client (kebab-case).</summary>
        public static string KindName(ExpeditionLockKind kind)
        {
            return kind switch
            {
                ExpeditionLockKind.Expedition => "expedition",
                ExpeditionLockKind.Part => "part",
                ExpeditionLockKind.Citizen => "citizen",
                ExpeditionLockKind.Bag => "bag",
                ExpeditionLockKind.PartOrders => "part-orders",
                ExpeditionLockKind.CitizenOrders => "citizen-orders",
                _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null)
            };
        }
    }
}
