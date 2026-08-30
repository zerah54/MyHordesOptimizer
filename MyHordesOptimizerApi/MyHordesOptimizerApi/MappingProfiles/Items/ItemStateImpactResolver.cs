using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;

namespace MyHordesOptimizerApi.MappingProfiles.Items
{
    /// <summary>
    /// Déduit, pour chaque objet, si le consommer affecte les PA/PE ou les statuts d'un citoyen —
    /// à partir des mêmes atomes <c>StatusEffect</c> que <see cref="Services.Impl.CitizenDayStateEngine"/>,
    /// sans table codée en dur. Sert à filtrer le catalogue pour le gestionnaire d'état.
    /// </summary>
    public static class ItemStateImpactResolver
    {
        public static IReadOnlyList<string> GetImpactfulItemUids(
            IReadOnlyList<ItemWithoutRecipeDto> items,
            IReadOnlyDictionary<string, MyHordesActionsCodeModel> actionsByName,
            IReadOnlyDictionary<string, MyHordesMetaResultCodeModel> metaResultsByName)
        {
            return items
                .Where(item => (item.Actions ?? Enumerable.Empty<string>())
                    .Any(actionName => ActionHasStateImpact(actionName, actionsByName, metaResultsByName)))
                .Select(item => item.Uid)
                .ToList();
        }

        private static bool ActionHasStateImpact(
            string actionName,
            IReadOnlyDictionary<string, MyHordesActionsCodeModel> actionsByName,
            IReadOnlyDictionary<string, MyHordesMetaResultCodeModel> metaResultsByName)
        {
            if (actionName is null || !actionsByName.TryGetValue(actionName, out var action)) return false;

            foreach (var resultKey in action.Result)
            {
                var key = resultKey?.ToString();
                if (key is null || !metaResultsByName.TryGetValue(key, out var metaResult)) continue;

                foreach (var atom in metaResult.AtomList)
                {
                    var effect = atom.AsStatusEffect();
                    if (effect is null) continue;

                    // Ap/Sp uniquement : ce sont les seuls PointType que le simulateur sait
                    // appliquer (Cp/Mp non gérés en v1, voir CitizenDayStateEngine.ApplyPointEffect).
                    var pointEffect = effect.PointType is PointType.Ap or PointType.Sp;
                    if (pointEffect || effect.StatusTo is not null || effect.StatusFrom is not null) return true;
                }
            }

            return false;
        }
    }
}
