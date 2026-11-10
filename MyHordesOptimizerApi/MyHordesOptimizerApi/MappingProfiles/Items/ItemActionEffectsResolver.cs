using System;
using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using Newtonsoft.Json.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Items
{
    /// <summary>
    /// Effets des actions d'un objet (Ouvrir, Découper, Purifier, Attaquer, devenir en veille),
    /// décodés depuis actions.json, avec fusion des variantes qui ne diffèrent que par leurs conditions.
    /// </summary>
    public static class ItemActionEffectsResolver
    {
        private const double ProbabilityTolerance = 1e-9;

        /// <summary>Libellés allemands (pivot des fixtures) des actions retenues hors ouverture.</summary>
        private static readonly IReadOnlyDictionary<string, ItemActionKind> KindByLabel = new Dictionary<string, ItemActionKind>(StringComparer.Ordinal)
        {
            ["Ausweiden"] = ItemActionKind.Slaughter,
            ["Reinigen (Wasser)"] = ItemActionKind.Purify,
            ["Reinigen (1AP) (Wasser)"] = ItemActionKind.Purify,
            ["Waffe einsetzen"] = ItemActionKind.Attack,
        };

        /// <summary>
        /// Remplit <see cref="ItemWithoutRecipeDto.ActionEffects"/> ; <paramref name="builtBuildingUids"/>
        /// <c>null</c> (ville inconnue) laisse <see cref="ItemActionEffectsDto.AppliesToTown"/> à <c>null</c>.
        /// </summary>
        public static void PopulateActionEffects(
            IReadOnlyList<ItemWithoutRecipeDto> itemsToEnrich,
            IReadOnlyList<ItemWithoutRecipeDto> catalog,
            IReadOnlyDictionary<string, MyHordesActionsCodeModel> actionsByName,
            IReadOnlyDictionary<string, MyHordesMetaResultCodeModel> metaResultsByName,
            IReadOnlyDictionary<string, JArray> resultGroupsByName,
            IReadOnlyDictionary<string, MyHordesMetaResultCodeModel> metaRequirementsByName,
            IReadOnlyDictionary<string, string> nightwatchActionByItemUid,
            IReadOnlySet<string>? builtBuildingUids)
        {
            var catalogByUid = catalog
                .Where(item => item.Uid != null)
                .ToDictionary(item => item.Uid, item => item, StringComparer.Ordinal);

            foreach (var item in itemsToEnrich)
            {
                if (item.Uid == null) continue;

                var effects = new List<ItemActionEffectsDto>();
                foreach (var actionName in item.Actions ?? Enumerable.Empty<string>())
                {
                    // item.Actions vient de la base et peut précéder actions.json : action inconnue ignorée.
                    if (actionsByName.GetValueOrDefault(actionName) is not { } action) continue;

                    var kind = Classify(actionName, action);
                    if (kind != null) effects.Add(Decode(actionName, action, kind.Value));
                }

                if (nightwatchActionByItemUid.TryGetValue(item.Uid, out var nightwatchActionName))
                {
                    var nightwatchAction = actionsByName.GetValueOrDefault(nightwatchActionName)
                        ?? throw new InvalidOperationException($"Action « {nightwatchActionName} » introuvable dans actions.json (objet « {item.Uid} »).");
                    effects.Add(Decode(nightwatchActionName, nightwatchAction, ItemActionKind.Nightwatch));
                }

                item.ActionEffects = MergeVariants(effects);
                foreach (var effect in item.ActionEffects)
                {
                    effect.AppliesToTown = builtBuildingUids == null
                        ? null
                        : effect.BuildingCondition == null || builtBuildingUids.Contains(effect.BuildingCondition.BuildingUid) == effect.BuildingCondition.Built;
                }
            }

            ItemActionEffectsDto Decode(string actionName, MyHordesActionsCodeModel action, ItemActionKind kind) => new()
            {
                ActionName = actionName,
                Kind = kind,
                ApCost = ItemOpenerResolver.ParseCostAndChance(action.Result).ApCost,
                BuildingCondition = FindBuildingCondition(action.Meta),
                Outcomes = ActionOutcomeDecoder.Decode(action.Result, metaResultsByName, resultGroupsByName, catalogByUid, kind == ItemActionKind.Open),
            };

            BuildingConditionDto? FindBuildingCondition(IEnumerable<string> meta)
            {
                var requirement = meta
                    .SelectMany(name => metaRequirementsByName.TryGetValue(name, out var metaRequirement)
                        ? metaRequirement.AtomList
                        : throw new InvalidOperationException($"Condition « {name} » introuvable dans meta-requirements.json."))
                    .Select(atom => atom.AsBuildingRequirement())
                    .FirstOrDefault(r => r != null);

                return requirement is { } r ? new BuildingConditionDto { BuildingUid = r.Uid, Built = r.Built } : null;
            }
        }

        /// <summary>
        /// Ouverture sans coût en PC (la variante Technicien est déjà exposée), sinon d'après le libellé ;
        /// <c>null</c> = ignorée, comme toute action sans résultat (ex. <c>can_t3</c>).
        /// </summary>
        private static ItemActionKind? Classify(string actionName, MyHordesActionsCodeModel action)
        {
            if (action.Result.Count == 0) return null;

            if (ItemOpenerResolver.IsOpeningAction(actionName))
            {
                return ItemOpenerResolver.ParseCostAndChance(action.Result).CpCost == null ? ItemActionKind.Open : null;
            }

            return action.Label != null && KindByLabel.TryGetValue(action.Label, out var kind) ? kind : null;
        }

        /// <summary>
        /// Par type et coût en PA : si toutes les variantes ont les mêmes issues, une seule entrée sans
        /// condition ; sinon seuls les doublons exacts (condition et issues) sont fusionnés. Ordre conservé.
        /// </summary>
        private static List<ItemActionEffectsDto> MergeVariants(List<ItemActionEffectsDto> effects)
        {
            var merged = new List<ItemActionEffectsDto>();
            foreach (var effect in effects)
            {
                var variants = effects.Where(e => e.Kind == effect.Kind && e.ApCost == effect.ApCost).ToList();
                if (variants.All(v => SameOutcomes(v.Outcomes, effect.Outcomes)))
                {
                    if (variants[0] != effect) continue;
                    effect.BuildingCondition = null;
                }
                else if (merged.Any(m => m.Kind == effect.Kind && m.ApCost == effect.ApCost
                    && m.BuildingCondition?.BuildingUid == effect.BuildingCondition?.BuildingUid
                    && m.BuildingCondition?.Built == effect.BuildingCondition?.Built
                    && SameOutcomes(m.Outcomes, effect.Outcomes)))
                {
                    continue;
                }

                merged.Add(effect);
            }

            return merged;
        }

        /// <summary>Mêmes issues, dans n'importe quel ordre (le décodeur n'en produit jamais deux de même clé).</summary>
        private static bool SameOutcomes(List<ActionOutcomeDto> left, List<ActionOutcomeDto> right) =>
            left.Count == right.Count && left.All(l => right.Any(r =>
                l.Kind == r.Kind && l.Item?.Uid == r.Item?.Uid && l.Quantity == r.Quantity && l.KillMin == r.KillMin && l.KillMax == r.KillMax
                && Math.Abs(l.Probability - r.Probability) < ProbabilityTolerance));
    }
}
