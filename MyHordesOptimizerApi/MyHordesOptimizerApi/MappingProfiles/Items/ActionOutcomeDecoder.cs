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
    /// Décode le <c>result</c> d'une action (jetons de meta-results.json et groupes pondérés) en issues
    /// probabilisées : consommé, cassé, transformé, objets produits, zombies tués.
    /// </summary>
    public static class ActionOutcomeDecoder
    {
        private const string DoNothing = "do_nothing";

        // Le jeu code « tuer tous les zombies » par kills(999999) (ActionEffectProvider.php, effet kill_all_zombie).
        private const int KillAllZombiesThreshold = 999999;

        /// <summary>
        /// Décode <paramref name="result"/> ; avec <paramref name="conditionalOnSuccess"/>, les branches
        /// <c>do_nothing</c> (échec) sont écartées et les probabilités renormalisées sur les succès.
        /// </summary>
        public static List<ActionOutcomeDto> Decode(
            IEnumerable<object> result,
            IReadOnlyDictionary<string, MyHordesMetaResultCodeModel> metaResultsByName,
            IReadOnlyDictionary<string, JArray> resultGroupsByName,
            IReadOnlyDictionary<string, ItemWithoutRecipeDto> catalogByUid,
            bool conditionalOnSuccess)
        {
            var outcomes = new List<ActionOutcomeDto>();

            foreach (var token in result)
            {
                Walk(token as JToken ?? new JValue(token), 1);
            }

            return outcomes
                .GroupBy(o => (o.Kind, o.Item?.Uid, o.Quantity, o.KillMin, o.KillMax))
                .Select(g =>
                {
                    var merged = g.First();
                    merged.Probability = g.Sum(o => o.Probability);
                    return merged;
                })
                .ToList();

            void Walk(JToken token, double p)
            {
                if (token.Type == JTokenType.String)
                {
                    DecodeMetaResult(token.Value<string>()!, p);
                }
                else if (token is JObject obj && obj["group"] is { } group)
                {
                    DecodeGroup(group, p);
                }
                else
                {
                    throw new InvalidOperationException($"Jeton de résultat inattendu : {token}");
                }
            }

            void DecodeGroup(JToken group, double p)
            {
                JArray branches;
                if (group.Type == JTokenType.String)
                {
                    var groupName = group.Value<string>()!;
                    if (!resultGroupsByName.TryGetValue(groupName, out branches!))
                        throw new InvalidOperationException($"Groupe « {groupName} » introuvable dans result-groups.json.");
                }
                else
                {
                    branches = (JArray)group;
                }

                var kept = branches
                    .Where(branch => !conditionalOnSuccess || !BranchTokens(branch).Any(t => t.Type == JTokenType.String && t.Value<string>() == DoNothing))
                    .ToList();

                foreach (var (branch, share) in WeightedShares(kept))
                {
                    foreach (var token in BranchTokens(branch))
                    {
                        Walk(token, p * share);
                    }
                }
            }

            void DecodeMetaResult(string key, double p)
            {
                if (!metaResultsByName.TryGetValue(key, out var metaResult))
                    throw new InvalidOperationException($"Effet « {key} » introuvable dans meta-results.json.");

                foreach (var atom in metaResult.AtomList)
                {
                    var itemEffect = atom.AsItemEffect();
                    if (itemEffect != null)
                    {
                        if (itemEffect.ConsumeSource == true) outcomes.Add(new ActionOutcomeDto { Kind = ActionOutcomeKind.Consumed, Probability = p });
                        if (itemEffect.BreakSource == true) outcomes.Add(new ActionOutcomeDto { Kind = ActionOutcomeKind.Broken, Probability = p });
                        if (itemEffect.MorphSource == true && itemEffect.MorphSourceType != null)
                            outcomes.Add(new ActionOutcomeDto { Kind = ActionOutcomeKind.Transformed, Probability = p, Item = Summary(itemEffect.MorphSourceType) });

                        if (itemEffect.Spawn != null)
                        {
                            // Entrées [[uid, quantité], poids].
                            foreach (var (entry, share) in WeightedShares(itemEffect.Spawn.ToList()))
                            {
                                outcomes.Add(new ActionOutcomeDto
                                {
                                    Kind = ActionOutcomeKind.Produced,
                                    Probability = p * share,
                                    Item = Summary(entry[0]![0]!.Value<string>()!),
                                    Quantity = entry[0]![1]!.Value<int>(),
                                });
                            }
                        }
                    }

                    var zoneEffect = atom.AsZoneEffect();
                    if (zoneEffect?.ZombieMin != null)
                    {
                        var killsAll = zoneEffect.ZombieMin >= KillAllZombiesThreshold;
                        outcomes.Add(new ActionOutcomeDto
                        {
                            Kind = ActionOutcomeKind.Kill,
                            Probability = p,
                            KillMin = killsAll ? null : zoneEffect.ZombieMin,
                            KillMax = killsAll ? null : zoneEffect.ZombieMax,
                        });
                    }
                }
            }

            ItemSummaryDto Summary(string uid)
            {
                if (!catalogByUid.TryGetValue(uid, out var item))
                    throw new InvalidOperationException($"Objet « {uid} » introuvable au référentiel.");

                return new ItemSummaryDto { Uid = item.Uid, Img = item.Img, ImgBroken = item.ImgBroken, Label = item.Label };
            }
        }

        /// <summary>Part de chaque entrée <c>[x, poids]</c> ; somme nulle → tirage uniforme, comme RandomGenerator::pickEntryFromRawRandomArray.</summary>
        private static IEnumerable<(JToken Entry, double Share)> WeightedShares(IReadOnlyList<JToken> entries)
        {
            var totalWeight = entries.Sum(entry => entry[1]!.Value<double>());
            return entries.Select(entry => (entry, totalWeight == 0 ? 1.0 / entries.Count : entry[1]!.Value<double>() / totalWeight));
        }

        /// <summary>Résultats d'une branche <c>[résultats, poids]</c> : tableau ou chaîne seule.</summary>
        private static IEnumerable<JToken> BranchTokens(JToken branch) =>
            branch[0] is JArray tokens ? tokens : new[] { branch[0]! };
    }
}
