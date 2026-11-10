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
    /// Armes déchargées : attaques de la forme chargée (D4) et nombre de charges obtenu à la recharge (D7),
    /// en suivant les transformations des actions d'attaque déjà décodées.
    /// </summary>
    public static class ItemWeaponChargesResolver
    {
        private const double ProbabilityTolerance = 1e-9;
        private const int MaxChainLength = 10;

        /// <summary>
        /// Remplit <see cref="ItemWithoutRecipeDto.ReloadCharges"/> et ajoute aux formes vides les attaques de leur
        /// forme chargée ; <paramref name="catalog"/> doit porter ses <see cref="ItemWithoutRecipeDto.ActionEffects"/>.
        /// </summary>
        public static void PopulateReloads(
            IReadOnlyList<ItemWithoutRecipeDto> itemsToEnrich,
            IReadOnlyList<ItemWithoutRecipeDto> catalog,
            IReadOnlyDictionary<string, MyHordesActionsCodeModel> actionsByName,
            IReadOnlyDictionary<string, MyHordesMetaResultCodeModel> metaResultsByName,
            IReadOnlyDictionary<string, JArray> resultGroupsByName)
        {
            var catalogByUid = catalog
                .Where(item => item.Uid != null)
                .ToDictionary(item => item.Uid, item => item, StringComparer.Ordinal);
            // Instantané avant écriture : une attaque empruntée ne fait pas d'une forme vide une forme qui attaque.
            var ownAttacksByUid = catalog
                .Where(item => item.Uid != null)
                .Select(item => (item.Uid, Attacks: item.ActionEffects.Where(e => e.Kind == ItemActionKind.Attack && e.ViaLoadedForm == null).ToList()))
                .Where(entry => entry.Attacks.Count > 0)
                .ToDictionary(entry => entry.Uid, entry => entry.Attacks, StringComparer.Ordinal);
            var enrichByUid = itemsToEnrich
                .Where(item => item.Uid != null)
                .ToDictionary(item => item.Uid, item => item, StringComparer.Ordinal);

            var reloads = catalog
                .Where(item => item.Uid != null && !ownAttacksByUid.ContainsKey(item.Uid))
                .Select(item => (Empty: item, Targets: ReloadTargets(item)))
                .Where(reload => reload.Targets.Count > 0)
                .Select(reload => (reload.Empty, reload.Targets, Chains: reload.Targets.Select(t => Chain(t.Item!.Uid)).ToList()))
                .ToList();

            foreach (var (empty, targets, chains) in reloads)
            {
                if (enrichByUid.TryGetValue(empty.Uid, out var enrichedEmpty))
                {
                    var loaded = targets.OrderByDescending(t => t.Probability).First().Item!;
                    enrichedEmpty.ActionEffects.AddRange(ownAttacksByUid[loaded.Uid].Select(attack => new ItemActionEffectsDto
                    {
                        ActionName = attack.ActionName,
                        Kind = attack.Kind,
                        ApCost = attack.ApCost,
                        BuildingCondition = attack.BuildingCondition,
                        AppliesToTown = attack.AppliesToTown,
                        ViaLoadedForm = loaded,
                        Outcomes = attack.Outcomes,
                    }));
                }

                if (chains.Any(chain => chain == null)) continue;

                var distribution = targets.Zip(chains)
                    .GroupBy(pair => pair.Second!.Count)
                    .Select(g => new ChargeChanceDto { Charges = g.Key, Probability = g.Sum(pair => pair.First.Probability) })
                    .ToList();
                foreach (var form in chains.SelectMany(chain => chain!).Prepend(empty.Uid))
                {
                    if (enrichByUid.TryGetValue(form, out var enrichedForm)) enrichedForm.ReloadCharges = distribution;
                }
            }

            // Première recharge (ordre de item.Actions) : consomme un autre objet et transforme en une forme qui attaque.
            List<ActionOutcomeDto> ReloadTargets(ItemWithoutRecipeDto empty)
            {
                foreach (var actionName in empty.Actions ?? Enumerable.Empty<string>())
                {
                    if (actionsByName.GetValueOrDefault(actionName) is not { } action || !ConsumesOtherItem(action)) continue;

                    var targets = ActionOutcomeDecoder.Decode(action.Result, metaResultsByName, resultGroupsByName, catalogByUid, conditionalOnSuccess: false)
                        .Where(o => o.Kind == ActionOutcomeKind.Transformed && ownAttacksByUid.ContainsKey(o.Item!.Uid))
                        .ToList();
                    if (targets.Count > 0) return targets;
                }

                return new List<ActionOutcomeDto>();
            }

            // ponytail: effets de premier niveau seulement (eau, pile, jerrycan) ; descendre dans les groupes si une recharge y consomme un jour.
            bool ConsumesOtherItem(MyHordesActionsCodeModel action) =>
                action.Result.OfType<string>().Any(name => metaResultsByName.TryGetValue(name, out var metaResult)
                    && metaResult.AtomList.Any(atom => atom.AsItemEffect()?.ConsumeItem != null));

            // Formes qui attaquent traversées tir après tir (une par charge) ; null si un tir ne transforme pas à coup sûr.
            List<string>? Chain(string loadedUid)
            {
                var chain = new List<string>();
                for (var uid = loadedUid; ownAttacksByUid.TryGetValue(uid, out var attacks); )
                {
                    if (chain.Count == MaxChainLength)
                        throw new InvalidOperationException($"Chaîne de tirs de « {loadedUid} » au-delà de {MaxChainLength} transformations.");

                    var next = attacks
                        .Select(attack => attack.Outcomes.FirstOrDefault(o => o.Kind == ActionOutcomeKind.Transformed && Math.Abs(o.Probability - 1) < ProbabilityTolerance)?.Item?.Uid)
                        .Distinct()
                        .ToList();
                    if (next.Count != 1 || next[0] == null) return null;

                    chain.Add(uid);
                    uid = next[0]!;
                }

                return chain;
            }
        }
    }
}
