using System;
using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

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
            IReadOnlyDictionary<string, IEnumerable<string>> actionMetaByName)
        {
            var knownProperties = catalog.SelectMany(item => item.Properties ?? Enumerable.Empty<string>()).Distinct().ToList();

            var requiredPropertyByAction = actionMetaByName
                .ToDictionary(kvp => kvp.Key, kvp => ResolveRequiredProperty(kvp.Value, knownProperties), StringComparer.Ordinal);

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
