using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using Newtonsoft.Json.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Items
{
    /// <summary>
    /// Déduit, pour une action, l'objet-propriété qu'un citoyen doit posséder pour l'effectuer
    /// (ex. un ouvre-boîte pour "open_metalbox"), à partir du meta "have_&lt;propriété&gt;" des
    /// fixtures MyHordes — sans table de correspondance codée en dur.
    /// </summary>
    public static class ItemOpenerResolver
    {
        private const string HavePrefix = "have_";
        private const string HdSuffix = "_hd";

        public static string ResolveRequiredProperty(IEnumerable<string> actionMeta, IEnumerable<string> knownPropertyNames)
        {
            if (actionMeta == null) return null;

            var propertySet = new HashSet<string>(knownPropertyNames, StringComparer.Ordinal);

            foreach (var meta in actionMeta)
            {
                if (meta == null || !meta.StartsWith(HavePrefix, StringComparison.Ordinal)) continue;

                var candidate = meta[HavePrefix.Length..];
                if (candidate.EndsWith(HdSuffix, StringComparison.Ordinal))
                {
                    candidate = candidate[..^HdSuffix.Length];
                }

                if (propertySet.Contains(candidate)) return candidate;
            }

            return null;
        }

        private static readonly Regex ApCostPattern = new(@"^minus_(\d+)ap$", RegexOptions.Compiled);
        private static readonly Regex CpCostPattern = new(@"^minus_(\d+)cp$", RegexOptions.Compiled);

        /// <summary>
        /// Extrait, depuis le <c>result</c> brut d'une action (mélange de tokens et d'objets
        /// <c>{"group": [...]}</c> tel qu'extrait de <c>actions.json</c>) : le coût en PA
        /// (<c>minus_Xap</c>), le coût en PC (<c>minus_Xcp</c>), et la chance de réussite déduite
        /// d'un groupe de probabilité contenant une branche <c>do_nothing</c> (l'échec). Un
        /// <c>group</c> exprimé sous forme de chaîne (référence à un groupe nommé, utilisée
        /// ailleurs dans le jeu) est ignoré : ce n'est pas une chance exploitable ici.
        /// </summary>
        public static (int? ApCost, int? CpCost, double? SuccessRate) ParseCostAndChance(IEnumerable<object> result)
        {
            if (result == null) return (null, null, null);

            int? apCost = null;
            int? cpCost = null;
            double? successRate = null;

            foreach (var token in result)
            {
                if (token is string tokenText)
                {
                    var apMatch = ApCostPattern.Match(tokenText);
                    if (apMatch.Success) apCost = int.Parse(apMatch.Groups[1].Value);

                    var cpMatch = CpCostPattern.Match(tokenText);
                    if (cpMatch.Success) cpCost = int.Parse(cpMatch.Groups[1].Value);
                }
                else if (token is JObject jObject && jObject["group"] is JArray branches)
                {
                    successRate = ComputeSuccessRate(branches);
                }
            }

            return (apCost, cpCost, successRate);
        }

        /// <summary>
        /// Poids non garantis sommer à 100 (ex. quatre branches de poids 1 ailleurs dans le jeu) :
        /// toujours normaliser par le poids total, jamais lire un poids comme un pourcentage brut.
        /// </summary>
        private static double? ComputeSuccessRate(JArray branches)
        {
            double totalWeight = 0;
            double failureWeight = 0;
            var foundFailureBranch = false;

            foreach (var branch in branches)
            {
                if (branch is not JArray branchArray || branchArray.Count != 2) return null;
                if (branchArray[0] is not JArray actionsInBranch) return null;
                if (branchArray[1].Type != JTokenType.Integer && branchArray[1].Type != JTokenType.Float) return null;

                var weight = branchArray[1].Value<double>();
                totalWeight += weight;

                if (actionsInBranch.Any(a => a.Type == JTokenType.String && a.Value<string>() == "do_nothing"))
                {
                    failureWeight += weight;
                    foundFailureBranch = true;
                }
            }

            if (!foundFailureBranch || totalWeight <= 0) return null;

            return (totalWeight - failureWeight) / totalWeight;
        }

        /// <summary>
        /// Une action qui ouvre/consomme un contenant est nommée "open_*", ou fait partie de la
        /// famille "can"/"can_t*" (la conserve). Convention de nommage des fixtures MyHordes,
        /// vérifiée exhaustivement sans faux positif sur le référentiel actuel — à revoir si un
        /// jour une action mal nommée s'y glisse.
        /// </summary>
        private static bool IsOpeningAction(string actionName)
        {
            return actionName.StartsWith("open_", StringComparison.Ordinal)
                || actionName == "can"
                || actionName.StartsWith("can_t", StringComparison.Ordinal);
        }

        private static ItemSummaryDto ToSummary(ItemWithoutRecipeDto item)
        {
            return new ItemSummaryDto { Uid = item.Uid, Img = item.Img, ImgBroken = item.ImgBroken, Label = item.Label };
        }

        /// <summary>
        /// Remplit <see cref="ItemWithoutRecipeDto.OpenedWith"/> et <see cref="ItemWithoutRecipeDto.Opens"/>
        /// sur <paramref name="itemsToEnrich"/>, en cherchant les objets liés dans
        /// <paramref name="catalog"/> — le catalogue COMPLET, pas seulement le lot à enrichir. Un lot
        /// partiel (ex. le contenu de la banque d'une ville) ne doit pas donner l'impression qu'un
        /// objet n'a pas d'ouvre-boîte simplement parce que celui-ci n'est pas dans ce lot.
        /// </summary>
        public static void PopulateOpenerRelations(
            IReadOnlyList<ItemWithoutRecipeDto> itemsToEnrich,
            IReadOnlyList<ItemWithoutRecipeDto> catalog,
            IReadOnlyDictionary<string, MyHordesActionsCodeModel> actionsByName)
        {
            var knownProperties = catalog.SelectMany(item => item.Properties ?? Enumerable.Empty<string>()).Distinct().ToList();

            var requiredPropertyByAction = actionsByName
                .ToDictionary(kvp => kvp.Key, kvp => ResolveRequiredProperty(kvp.Value.Meta, knownProperties), StringComparer.Ordinal);

            var openersByProperty = catalog
                .SelectMany(item => (item.Properties ?? Enumerable.Empty<string>()).Select(property => (property, item)))
                .GroupBy(entry => entry.property, entry => entry.item, StringComparer.Ordinal)
                .ToDictionary(group => group.Key, group => group.Select(ToSummary).ToList(), StringComparer.Ordinal);

            foreach (var item in itemsToEnrich)
            {
                var openingActions = (item.Actions ?? Enumerable.Empty<string>()).Where(IsOpeningAction).ToList();
                var requiredProperties = openingActions
                    .Select(action => requiredPropertyByAction.GetValueOrDefault(action))
                    .Where(property => property != null)
                    .Distinct()
                    .ToList();

                if (openingActions.Count > 0)
                {
                    item.OpenedWith = requiredProperties
                        .SelectMany(property => openersByProperty.GetValueOrDefault(property) ?? new List<ItemSummaryDto>())
                        .DistinctBy(summary => summary.Uid)
                        .ToList();

                    var toolFreeActionCosts = openingActions
                        .Where(action => requiredPropertyByAction.GetValueOrDefault(action) == null)
                        .Select(action => actionsByName.GetValueOrDefault(action))
                        .Where(actionModel => actionModel != null)
                        .Select(actionModel => (actionModel, cost: ParseCostAndChance(actionModel.Result)))
                        .ToList();

                    item.OpenApCost = toolFreeActionCosts.Select(t => t.cost.ApCost).FirstOrDefault(c => c.HasValue);
                    item.OpenSuccessRate = toolFreeActionCosts.Select(t => t.cost.SuccessRate).FirstOrDefault(c => c.HasValue);
                    item.TechnicianOpenCpCost = toolFreeActionCosts
                        .Where(t => t.actionModel.Meta.Contains("profession_tech"))
                        .Select(t => t.cost.CpCost)
                        .FirstOrDefault(c => c.HasValue);
                }
            }

            var boxesByProperty = catalog
                .SelectMany(item => (item.Actions ?? Enumerable.Empty<string>())
                    .Where(IsOpeningAction)
                    .Select(action => requiredPropertyByAction.GetValueOrDefault(action))
                    .Where(property => property != null)
                    .Distinct()
                    .Select(property => (property, item)))
                .GroupBy(entry => entry.property, entry => entry.item, StringComparer.Ordinal)
                .ToDictionary(group => group.Key, group => group.Select(ToSummary).ToList(), StringComparer.Ordinal);

            foreach (var item in itemsToEnrich)
            {
                item.Opens = (item.Properties ?? Enumerable.Empty<string>())
                    .SelectMany(property => boxesByProperty.GetValueOrDefault(property) ?? new List<ItemSummaryDto>())
                    .DistinctBy(summary => summary.Uid)
                    .ToList();
            }
        }
    }
}
