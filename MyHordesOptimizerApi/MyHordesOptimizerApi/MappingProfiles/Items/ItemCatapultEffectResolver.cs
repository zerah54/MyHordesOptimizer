using System;
using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.MappingProfiles.Items
{
    /// <summary>
    /// Déduit, pour chaque objet, son effet catapulte réel — devenir précis et effet de zone pour
    /// les armes — à partir de son action catapulte, résolue via actions.json et meta-results.json,
    /// sans table de correspondance codée en dur. Remplace l'ancienne propriété booléenne
    /// <c>fragile</c>.
    /// </summary>
    public static class ItemCatapultEffectResolver
    {
        private const string ConsumeItemResult = "consume_item";
        private const string CataKillPrefix = "cata_kill_";

        private static readonly IReadOnlyDictionary<string, CatapultFate> MorphFateByIdentifier =
            new Dictionary<string, CatapultFate>(StringComparer.Ordinal)
            {
                ["morph_cata_fine"] = CatapultFate.Intact,
                ["morph_cata_break"] = CatapultFate.Broken,
                ["morph_cata_undef"] = CatapultFate.Transformed,
                ["morph_cata_remains"] = CatapultFate.Transformed,
                ["morph_cata_moldy"] = CatapultFate.Transformed,
                ["morph_cata_scrap"] = CatapultFate.Transformed,
                ["morph_cata_break_staff"] = CatapultFate.Transformed,
            };

        public static void PopulateCatapultEffects(
            IReadOnlyList<ItemWithoutRecipeDto> itemsToEnrich,
            IReadOnlyList<ItemWithoutRecipeDto> catalog,
            IReadOnlyDictionary<string, string> catapultActionByItemUid,
            IReadOnlyDictionary<string, MyHordesActionsCodeModel> actionsByName,
            IReadOnlyDictionary<string, MyHordesMetaResultCodeModel> metaResultsByName)
        {
            var catalogByUid = catalog
                .Where(item => item.Uid != null)
                .ToDictionary(item => item.Uid, item => item, StringComparer.Ordinal);

            foreach (var item in itemsToEnrich)
            {
                if (item.Uid == null || !catapultActionByItemUid.TryGetValue(item.Uid, out var actionName)) continue;

                if (!actionsByName.TryGetValue(actionName, out var action))
                    throw new InvalidOperationException(
                        $"Action catapulte « {actionName} » introuvable dans actions.json (objet « {item.Uid} »).");

                item.CatapultEffect = Resolve(item.Uid, actionName, action.Result, metaResultsByName, catalogByUid);
            }
        }

        private static CatapultEffectDto Resolve(
            string itemUid,
            string actionName,
            IEnumerable<object> result,
            IReadOnlyDictionary<string, MyHordesMetaResultCodeModel> metaResultsByName,
            IReadOnlyDictionary<string, ItemWithoutRecipeDto> catalogByUid)
        {
            var effect = new CatapultEffectDto();
            CatapultFate? fate = null;
            string morphTargetUid = null;
            var sawConsumeItem = false;

            foreach (var token in result)
            {
                var key = token?.ToString();
                if (key is null) continue;

                if (key == ConsumeItemResult)
                {
                    sawConsumeItem = true;
                    continue;
                }

                if (MorphFateByIdentifier.TryGetValue(key, out var morphFate))
                {
                    var metaResult = ResolveMetaResult(key, itemUid, actionName, metaResultsByName);
                    var itemEffect = metaResult.AtomList.Select(a => a.AsItemEffect()).FirstOrDefault(e => e != null)
                        ?? throw new InvalidOperationException(
                            $"Effet « {key} » sans atome ItemEffect (objet « {itemUid} », action « {actionName} »).");

                    fate = morphFate;
                    morphTargetUid = itemEffect.MorphSourceType;
                    continue;
                }

                if (key.StartsWith(CataKillPrefix, StringComparison.Ordinal))
                {
                    var metaResult = ResolveMetaResult(key, itemUid, actionName, metaResultsByName);
                    var zoneEffect = metaResult.AtomList.Select(a => a.AsZoneEffect()).FirstOrDefault(e => e != null)
                        ?? throw new InvalidOperationException(
                            $"Effet « {key} » sans atome ZoneEffect (objet « {itemUid} », action « {actionName} »).");

                    effect.Radius = (CatapultRadius)(zoneEffect.ZombieKillRange ?? zoneEffect.EscapeRange ?? 0);
                    if (zoneEffect.Escape.HasValue)
                    {
                        effect.RepelSeconds = zoneEffect.Escape;
                    }
                    else
                    {
                        effect.KillMin = zoneEffect.ZombieMin;
                        effect.KillMax = zoneEffect.ZombieMax;
                    }
                }
            }

            if (fate is null)
            {
                if (!sawConsumeItem)
                    throw new InvalidOperationException(
                        $"Action catapulte « {actionName} » sans devenir défini pour l'objet « {itemUid} ».");
                fate = CatapultFate.Destroyed;
            }

            effect.Fate = fate.Value;

            if (fate == CatapultFate.Transformed)
            {
                if (morphTargetUid == null || !catalogByUid.TryGetValue(morphTargetUid, out var target))
                    throw new InvalidOperationException(
                        $"Objet transformé « {morphTargetUid} » introuvable au référentiel (objet « {itemUid} »).");

                effect.MorphTarget = new ItemSummaryDto
                {
                    Uid = target.Uid,
                    Img = target.Img,
                    ImgBroken = target.ImgBroken,
                    Label = target.Label,
                };
            }

            return effect;
        }

        private static MyHordesMetaResultCodeModel ResolveMetaResult(
            string key, string itemUid, string actionName,
            IReadOnlyDictionary<string, MyHordesMetaResultCodeModel> metaResultsByName)
        {
            if (!metaResultsByName.TryGetValue(key, out var metaResult))
                throw new InvalidOperationException(
                    $"Effet « {key} » introuvable dans meta-results.json (objet « {itemUid} », action « {actionName} »).");

            return metaResult;
        }
    }
}
