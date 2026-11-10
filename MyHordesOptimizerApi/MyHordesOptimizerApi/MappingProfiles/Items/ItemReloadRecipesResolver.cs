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
    /// Recharges présentées en recettes : une action de l'objet qui consomme un autre objet (pile, eau, jerrycan…)
    /// et transforme l'objet devient « objet + consommé → forme(s) obtenue(s) », sur la fiche de l'objet seulement.
    /// </summary>
    public static class ItemReloadRecipesResolver
    {
        /// <summary>Action faite depuis l'inventaire, partout : même type que les assemblages du citoyen.</summary>
        public const string RecipeType = "Recipe::ManualAnywhere";

        /// <summary>Actions qui passent la règle sans être des recharges : Nourrir le chien de l'Apprivoiseur.</summary>
        private static readonly HashSet<string> NotReloads = new(StringComparer.Ordinal) { "hero_tamer_3" };

        /// <summary>Recettes de recharge par uid de l'objet qui porte l'action, sans doublon entre variantes d'une même action.</summary>
        public static Dictionary<string, List<ItemRecipeDto>> Build(
            IReadOnlyList<ItemWithoutRecipeDto> catalog,
            IReadOnlyDictionary<string, MyHordesActionsCodeModel> actionsByName,
            IReadOnlyDictionary<string, MyHordesMetaResultCodeModel> metaResultsByName,
            IReadOnlyDictionary<string, JArray> resultGroupsByName)
        {
            var catalogByUid = catalog
                .Where(item => item.Uid != null)
                .ToDictionary(item => item.Uid, item => item, StringComparer.Ordinal);
            var recipesByUid = new Dictionary<string, List<ItemRecipeDto>>(StringComparer.Ordinal);

            foreach (var item in catalogByUid.Values)
            {
                var recipes = new List<ItemRecipeDto>();
                foreach (var actionName in item.Actions ?? Enumerable.Empty<string>())
                {
                    if (NotReloads.Contains(actionName) || actionsByName.GetValueOrDefault(actionName) is not { } action) continue;
                    if (ConsumedItem(action) is not { } consumed || !catalogByUid.TryGetValue(consumed.Uid, out var consumedItem)) continue;

                    var results = ActionOutcomeDecoder.Decode(action.Result, metaResultsByName, resultGroupsByName, catalogByUid, conditionalOnSuccess: false)
                        .Where(o => o.Kind == ActionOutcomeKind.Transformed && o.Item != null && catalogByUid.ContainsKey(o.Item.Uid))
                        .ToList();
                    if (results.Count == 0) continue;

                    var recipe = new ItemRecipeDto
                    {
                        Name = actionName,
                        Type = RecipeType,
                        Components = new List<ItemComponentRecipeDto>
                        {
                            new() { Item = Copy(item), Count = 1 },
                            new() { Item = Copy(consumedItem), Count = consumed.Count },
                        },
                        Result = results.Select(o => new ItemResultDto { Item = Copy(catalogByUid[o.Item!.Uid]), Probability = o.Probability }).ToList(),
                    };
                    if (!recipes.Any(existing => Key(existing) == Key(recipe))) recipes.Add(recipe);
                }

                if (recipes.Count > 0) recipesByUid[item.Uid] = recipes;
            }

            return recipesByUid;

            // Effets de premier niveau seulement, comme ItemWeaponChargesResolver.
            (string Uid, int Count)? ConsumedItem(MyHordesActionsCodeModel action) =>
                action.Result.OfType<string>()
                    .SelectMany(name => metaResultsByName.TryGetValue(name, out var metaResult) ? metaResult.AtomList : Enumerable.Empty<MetaResultAtom>())
                    .Select(atom => atom.AsItemEffect())
                    .Where(effect => effect?.ConsumeItem != null)
                    .Select(effect => ((string Uid, int Count)?)(effect!.ConsumeItem!, effect.ConsumeItemCount ?? 1))
                    .FirstOrDefault();
        }

        private static string Key(ItemRecipeDto recipe) =>
            string.Join("|", recipe.Components.Select(c => $"{c.Item.Uid}×{c.Count}"))
            + ">" + string.Join("|", recipe.Result.OrderBy(r => r.Item.Uid, StringComparer.Ordinal).Select(r => $"{r.Item.Uid}:{r.Probability:R}"));

        /// <summary>Copie sans recettes : l'instance du catalogue est un <see cref="ItemDto"/>, qui se sérialiserait en boucle.</summary>
        private static ItemWithoutRecipeDto Copy(ItemWithoutRecipeDto item) => new()
        {
            Id = item.Id,
            Uid = item.Uid,
            Img = item.Img,
            ImgBroken = item.ImgBroken,
            Label = item.Label,
            Description = item.Description,
            Category = item.Category,
            Deco = item.Deco,
            IsHeaver = item.IsHeaver,
            Guard = item.Guard,
            Properties = item.Properties,
            Actions = item.Actions,
        };
    }
}
