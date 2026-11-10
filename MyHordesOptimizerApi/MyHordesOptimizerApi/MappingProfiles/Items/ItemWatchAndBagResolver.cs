using System;
using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.MappingProfiles.Items
{
    /// <summary>Impact en veille et extension de sac, depuis <c>item-extras.json</c>.</summary>
    public static class ItemWatchAndBagResolver
    {
        // MyHordes src/Service/InventoryHandler.php::getSize()
        private static readonly IReadOnlyDictionary<string, int> BagBonusByUid = new Dictionary<string, int>(StringComparer.Ordinal)
        {
            ["bagxl_#00"] = 3,
            ["cart_#00"] = 3,
            ["bag_#00"] = 2,
            ["pocket_belt_#00"] = 2,
        };

        /// <summary>
        /// Remplit <see cref="ItemWithoutRecipeDto.WatchImpact"/>, <see cref="ItemWithoutRecipeDto.BagCapacityBonus"/>
        /// et <see cref="ItemWithoutRecipeDto.BagExclusiveGroup"/> ; le groupe est pris dans <paramref name="catalog"/>.
        /// </summary>
        public static void Populate(
            IReadOnlyList<ItemWithoutRecipeDto> itemsToEnrich,
            IReadOnlyList<ItemWithoutRecipeDto> catalog,
            IReadOnlyDictionary<string, MyHordesItemExtrasCodeModel> extrasByUid)
        {
            var groups = catalog
                .Where(item => item.Uid != null && extrasByUid.GetValueOrDefault(item.Uid)?.BagExtensionType != null)
                .ToLookup(item => extrasByUid[item.Uid].BagExtensionType!.Value);

            foreach (var item in itemsToEnrich.Where(i => i.Uid != null))
            {
                var extras = extrasByUid.GetValueOrDefault(item.Uid);
                item.WatchImpact = extras?.WatchImpact ?? 0;
                item.BagCapacityBonus = BagBonusByUid.TryGetValue(item.Uid, out var bonus) ? bonus : null;
                item.BagExclusiveGroup = extras?.BagExtensionType is { } type
                    ? groups[type].Select(member => new ItemSummaryDto
                    {
                        Uid = member.Uid,
                        Img = member.Img,
                        ImgBroken = member.ImgBroken,
                        Label = member.Label,
                    }).ToList()
                    : null;
            }
        }
    }
}
