using System;
using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models.CitizenState;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl
{
    /// <summary>
    /// Classe tous les ordres de consommation distincts du sac (dédupliqués par multiset), du plus
    /// optimisé au pire, sur un modèle de trajet à budget nominal — pas le moteur pas-à-pas de
    /// <see cref="CitizenDayStateEngine"/> (celui-ci applique le mécanisme réel de plancher/plafond,
    /// hors de propos ici). Règles fixées en conversation (2026-08-29/30) :
    /// - Valeur PA/PE d'un objet = plancher absolu (MaxAp/MaxSp + pointValue) atteint à consommation
    ///   fraîche, indépendant de l'AP courant — pas le mécanisme réel de plancher relatif.
    /// - Distance totale = PA+PE de départ + PA/PE de chaque consommable (verrou "une fois par jour"
    ///   par catégorie : repas/drogue/boisson).
    /// - Seuil de soif : identique au jeu réel (WalkingDistance > 10 déclenche le palier suivant et
    ///   remet le compteur à 0) ; boire réinitialise aussi ce compteur, inconditionnellement.
    /// - Objet blessant (résultat "inflict_wound") : contrainte de placement, pas un critère de score
    ///   — en dernier si pas de soin ("heal_wound") dans le sac, sinon en tout premier.
    /// - Gravité finale = pire statut atteint : mort > déshydraté > dépendant > blessé > soif >
    ///   alcoolisé > drogué > rien. Départage des ex-æquo : palier atteint le plus tard (distance
    ///   cumulée la plus grande).
    /// </summary>
    public class CitizenStateOrderRankingEngine : ICitizenStateOrderRankingEngine
    {
        private const int ThirstThreshold = 10;

        protected IMyHordesCodeRepository Repository { get; init; }
        protected ICitizenItemActionsProvider ItemActionsProvider { get; init; }

        public CitizenStateOrderRankingEngine(IMyHordesCodeRepository repository, ICitizenItemActionsProvider itemActionsProvider)
        {
            Repository = repository;
            ItemActionsProvider = itemActionsProvider;
        }

        public List<RankedOrder> RankOrders(CitizenState startingState, IReadOnlyList<int> bagItemIds)
        {
            if (bagItemIds.Count == 0) return new List<RankedOrder>();

            var actions = Repository.GetActions();
            var metaResults = Repository.GetMetaResults();
            var maxAp = CitizenPointRules.GetMaxAp(startingState.Wounded);
            var maxSp = CitizenPointRules.GetMaxSp(startingState.IsEclaireur, startingState.HasBike, startingState.HasShoes);

            var profiles = bagItemIds.Distinct()
                .ToDictionary(id => id, id => BuildProfile(id, actions, metaResults, maxAp, maxSp, startingState.IsRoleGhoul));

            var consideredItemIds = ReduceSingleUseDuplicates(bagItemIds, profiles);

            var hasHealItem = consideredItemIds.Any(id => profiles[id].HasHeal);
            var woundItems = consideredItemIds.Where(id => profiles[id].Gate == ConsumableGate.WoundItem).ToList();
            // Soustraction de multiset (pas Except : il dédoublonnerait aussi les objets non blessants
            // en double, ex. le 2e twino d'un sac de 2 twino disparaîtrait).
            var freeItems = new List<int>(consideredItemIds);
            foreach (var woundItem in woundItems) freeItems.Remove(woundItem);

            var results = new List<RankedOrder>();
            foreach (var freePermutation in GenerateDistinctPermutations(freeItems))
            {
                var order = hasHealItem
                    ? woundItems.Concat(freePermutation).ToList()
                    : freePermutation.Concat(woundItems).ToList();

                var (tier, tierDistance, totalDistance, finalState) = SimulateOrder(order, profiles, startingState);
                results.Add(new RankedOrder { Order = order, Tier = tier, TierReachedAtDistance = tierDistance, TotalDistance = totalDistance, FinalState = finalState });
            }

            return results
                .OrderBy(r => r.Tier)
                .ThenByDescending(r => r.TierReachedAtDistance ?? int.MaxValue)
                .ToList();
        }

        // Gates dont toute prise au-delà de la 1re est un no-op strict (aucun effet, même secondaire) :
        // contrairement à Drink (fait baisser la soif à chaque prise) et Drug (plein PA à chaque prise,
        // seul le statut infligé change), Food/Alcohol ne rendent rien du tout la 2e fois.
        private static readonly HashSet<ConsumableGate> SingleUseGates = new() { ConsumableGate.Food, ConsumableGate.Alcohol };

        // Sur-représenter ces objets dans les permutations n'a aucun intérêt (ils ne se distinguent
        // que par la place du no-op) : on ne garde que le meilleur par gate, doublons exclus des
        // suggestions plutôt que simulés en pure perte.
        private static List<int> ReduceSingleUseDuplicates(IReadOnlyList<int> bagItemIds, Dictionary<int, ConsumableProfile> profiles)
        {
            var bestIdPerGate = new Dictionary<ConsumableGate, int>();
            var bestValuePerGate = new Dictionary<ConsumableGate, int>();
            foreach (var itemId in bagItemIds)
            {
                var gate = profiles[itemId].Gate;
                if (!SingleUseGates.Contains(gate)) continue;
                var value = profiles[itemId].ApValue + profiles[itemId].SpValue;
                if (!bestValuePerGate.TryGetValue(gate, out var currentBest) || value > currentBest)
                {
                    bestValuePerGate[gate] = value;
                    bestIdPerGate[gate] = itemId;
                }
            }

            var keptPerGate = new HashSet<ConsumableGate>();
            var result = new List<int>();
            foreach (var itemId in bagItemIds)
            {
                var gate = profiles[itemId].Gate;
                if (!SingleUseGates.Contains(gate)) { result.Add(itemId); continue; }
                if (itemId != bestIdPerGate[gate]) continue;
                if (!keptPerGate.Add(gate)) continue;
                result.Add(itemId);
            }
            return result;
        }

        private enum ConsumableGate { None, WoundItem, Alcohol, Drug, Food, Drink }

        private class ConsumableProfile
        {
            public int ApValue;
            public int SpValue;
            public ConsumableGate Gate;
            public bool InflictsWound;
            public bool HasHeal;
        }

        private ConsumableProfile BuildProfile(int itemId,
            Dictionary<string, MyHordesActionsCodeModel> actions,
            Dictionary<string, MyHordesMetaResultCodeModel> metaResults,
            int maxAp, int maxSp, bool isRoleGhoul)
        {
            var profile = new ConsumableProfile();
            var isAlcohol = false;
            var isDrug = false;
            var isFood = false;
            var isDrink = false;

            foreach (var actionName in ItemActionsProvider.GetActionNames(itemId))
            {
                if (!actions.TryGetValue(actionName, out var action)) continue;
                // Même filtre de rôle que CitizenDayStateEngine.ApplyItemAction : une variante "goule"
                // (ex. water_g qui blesse au lieu de désaltérer) ne doit jamais compter pour un citoyen
                // normal, et inversement.
                if (action.Meta.Contains("role_ghoul") && !isRoleGhoul) continue;
                if (action.Meta.Contains("not_role_ghoul") && isRoleGhoul) continue;
                // "drug_2" (prise suivante, addict garanti) n'est jamais la valeur nominale — seule
                // "drug_1" (1re prise) sert de référence.
                if (action.Meta.Contains("drug_2")) continue;
                if (action.Meta.Contains("drug_1")) isDrug = true;
                if (action.Meta.Contains("eat_ap")) isFood = true;

                foreach (var resultKeyObj in action.Result)
                {
                    var key = resultKeyObj?.ToString();
                    if (key is null) continue;
                    if (key == "inflict_wound") profile.InflictsWound = true;
                    if (key == "heal_wound") profile.HasHeal = true;
                    if (key == "drink_ap_1") isDrink = true;

                    if (!metaResults.TryGetValue(key, out var metaResult)) continue;
                    foreach (var atom in metaResult.AtomList)
                    {
                        var effect = atom.AsStatusEffect();
                        if (effect is null) continue;

                        if (effect.PointType == PointType.Ap && effect.PointRelativeToMax == RelativeMaxPoint.RelativeToMax)
                            profile.ApValue = Math.Max(profile.ApValue, maxAp + (effect.PointValue ?? 0));
                        if (effect.PointType == PointType.Sp && effect.PointRelativeToMax == RelativeMaxPoint.RelativeToMax)
                            profile.SpValue = Math.Max(profile.SpValue, maxSp + (effect.PointValue ?? 0));
                        if (effect.StatusTo is "drunk" or "hungover") isAlcohol = true;
                    }
                }
            }

            // Priorité de classement : un objet blessant reste géré par la contrainte de placement même
            // s'il rend aussi du PA (ex. sport-élec) ; sinon la 1re catégorie reconnue l'emporte.
            profile.Gate = profile.InflictsWound ? ConsumableGate.WoundItem
                : isAlcohol ? ConsumableGate.Alcohol
                : isDrug ? ConsumableGate.Drug
                : isFood ? ConsumableGate.Food
                : isDrink ? ConsumableGate.Drink
                : ConsumableGate.None;

            return profile;
        }

        private (CitizenStateSeverityTier Tier, int? TierReachedAtDistance, int TotalDistance, CitizenState FinalState) SimulateOrder(
            List<int> order, Dictionary<int, ConsumableProfile> profiles, CitizenState startingState)
        {
            var distanceCounter = 0;
            var cumulativeDistance = 0;
            var thirstLevel = startingState.Statuses.Contains("thirst2") ? 2 : startingState.Statuses.Contains("thirst1") ? 1 : 0;
            var thirstChangedAt = 0;
            var hasEatenToday = startingState.Statuses.Contains("haseaten");
            var hasDrankToday = startingState.Statuses.Contains("hasdrunk");
            var hasUsedDrugToday = startingState.HasUsedDrugToday;
            var everDrugged = startingState.Statuses.Contains("drugged");
            int? drugFirstUseDistance = everDrugged ? 0 : null;
            var addicted = startingState.Statuses.Contains("addict");
            int? addictedAtDistance = addicted ? 0 : null;
            var wounded = startingState.Wounded;
            var woundChangedAt = 0;
            var drunk = startingState.Statuses.Contains("drunk") || startingState.Statuses.Contains("hungover");
            int? drunkAtDistance = drunk ? 0 : null;
            var isDead = false;
            int? deadAtDistance = null;

            void WalkDistance(int amount)
            {
                var remaining = amount;
                while (remaining > 0 && !isDead)
                {
                    var toNextOverflow = ThirstThreshold + 1 - distanceCounter;
                    var step = Math.Min(remaining, toNextOverflow);
                    distanceCounter += step;
                    cumulativeDistance += step;
                    remaining -= step;

                    if (distanceCounter > ThirstThreshold)
                    {
                        distanceCounter = 0;
                        if (thirstLevel == 2)
                        {
                            isDead = true;
                            deadAtDistance = cumulativeDistance;
                        }
                        else
                        {
                            thirstLevel++;
                            thirstChangedAt = cumulativeDistance;
                        }
                    }
                }
            }

            WalkDistance(startingState.Ap + startingState.Sp);

            foreach (var itemId in order)
            {
                if (isDead) break;
                var profile = profiles[itemId];
                var apGain = 0;
                var spGain = 0;

                switch (profile.Gate)
                {
                    case ConsumableGate.Food:
                        if (!hasEatenToday)
                        {
                            apGain = profile.ApValue;
                            spGain = profile.SpValue;
                            hasEatenToday = true;
                        }
                        break;
                    case ConsumableGate.Drug:
                        // Contrairement à repas/boisson, une drogue rend le PLEIN PA à CHAQUE prise
                        // (drug_8ap_2 contient aussi "just_ap8") — seul le statut infligé change
                        // (drogué la 1re fois, dépendant garanti à partir de la 2e).
                        apGain = profile.ApValue;
                        spGain = profile.SpValue;
                        if (!everDrugged) { everDrugged = true; drugFirstUseDistance = cumulativeDistance; }
                        if (!hasUsedDrugToday)
                        {
                            hasUsedDrugToday = true;
                        }
                        else if (!addicted)
                        {
                            addicted = true;
                            addictedAtDistance = cumulativeDistance;
                        }
                        break;
                    case ConsumableGate.Drink:
                        // "drink_no_ap" (déjà très assoiffé) : aucun PA même à la 1re utilisation.
                        if (thirstLevel < 2 && !hasDrankToday)
                        {
                            apGain = profile.ApValue;
                            spGain = profile.SpValue;
                            hasDrankToday = true;
                        }
                        if (thirstLevel > 0)
                        {
                            thirstLevel--;
                            thirstChangedAt = cumulativeDistance;
                        }
                        distanceCounter = 0; // reset_thirst_counter : inconditionnel, même sans soif à éteindre
                        break;
                    case ConsumableGate.WoundItem:
                        if (!wounded)
                        {
                            apGain = profile.ApValue;
                            spGain = profile.SpValue;
                        }
                        break;
                    case ConsumableGate.Alcohol:
                        if (!drunk)
                        {
                            apGain = profile.ApValue;
                            spGain = profile.SpValue;
                            drunk = true;
                            drunkAtDistance = cumulativeDistance;
                        }
                        break;
                    case ConsumableGate.None:
                        apGain = profile.ApValue;
                        spGain = profile.SpValue;
                        break;
                }

                if (profile.HasHeal && wounded)
                {
                    wounded = false;
                    woundChangedAt = cumulativeDistance;
                }
                if (profile.InflictsWound)
                {
                    wounded = true;
                    woundChangedAt = cumulativeDistance;
                }

                WalkDistance(apGain + spGain);
            }

            // Gravité = pire statut PRÉSENT EN FIN DE TRAJET (pas "jamais atteint pendant le trajet") :
            // la soif se soigne, la blessure aussi (bandage) — seuls dépendant/drogué/alcoolisé
            // persistent une fois déclenchés, faute de mécanisme de cure dans le périmètre retenu.
            CitizenStateSeverityTier tier;
            int? tierDistance;
            if (isDead) { tier = CitizenStateSeverityTier.Dead; tierDistance = deadAtDistance; }
            else if (thirstLevel == 2) { tier = CitizenStateSeverityTier.Dehydrated; tierDistance = thirstChangedAt; }
            else if (addicted) { tier = CitizenStateSeverityTier.Addicted; tierDistance = addictedAtDistance; }
            else if (wounded) { tier = CitizenStateSeverityTier.Wounded; tierDistance = woundChangedAt; }
            else if (thirstLevel == 1) { tier = CitizenStateSeverityTier.Thirsty; tierDistance = thirstChangedAt; }
            else if (drunk) { tier = CitizenStateSeverityTier.Drunk; tierDistance = drunkAtDistance; }
            else if (everDrugged) { tier = CitizenStateSeverityTier.Drugged; tierDistance = drugFirstUseDistance; }
            else { tier = CitizenStateSeverityTier.None; tierDistance = null; }

            var finalState = new CitizenState
            {
                Ap = startingState.Ap,
                Sp = startingState.Sp,
                Wounded = wounded,
                IsEclaireur = startingState.IsEclaireur,
                HasBike = startingState.HasBike,
                HasShoes = startingState.HasShoes,
                IsDead = isDead,
                IsRoleGhoul = startingState.IsRoleGhoul,
                HasUsedDrugToday = hasUsedDrugToday,
                Statuses = BuildFinalStatuses(startingState, thirstLevel, hasEatenToday, hasDrankToday, wounded, drunk, everDrugged, addicted),
            };

            return (tier, tierDistance, cumulativeDistance, finalState);
        }

        private static HashSet<string> BuildFinalStatuses(CitizenState startingState, int thirstLevel,
            bool hasEatenToday, bool hasDrankToday, bool wounded, bool drunk, bool everDrugged, bool addicted)
        {
            var statuses = new HashSet<string>(startingState.Statuses);
            statuses.Remove("thirst1");
            statuses.Remove("thirst2");
            if (thirstLevel == 1) statuses.Add("thirst1");
            if (thirstLevel == 2) statuses.Add("thirst2");
            if (hasEatenToday) statuses.Add("haseaten");
            if (hasDrankToday) statuses.Add("hasdrunk");
            if (wounded) statuses.Add("tg_meta_wound"); else statuses.Remove("tg_meta_wound");
            if (drunk) statuses.Add("drunk");
            if (everDrugged) statuses.Add("drugged");
            if (addicted) statuses.Add("addict");
            return statuses;
        }

        // Génère les permutations distinctes d'un multiset (pas de génération N! suivie d'un
        // dédoublonnage) : compte les occurrences, choisit récursivement la prochaine valeur parmi
        // celles encore disponibles.
        private static IEnumerable<List<int>> GenerateDistinctPermutations(IReadOnlyList<int> items)
        {
            var counts = items.GroupBy(i => i).ToDictionary(g => g.Key, g => g.Count());
            return Permute(counts, items.Count);
        }

        private static IEnumerable<List<int>> Permute(Dictionary<int, int> counts, int remaining)
        {
            if (remaining == 0)
            {
                yield return new List<int>();
                yield break;
            }

            foreach (var key in counts.Keys.ToList())
            {
                if (counts[key] == 0) continue;
                counts[key]--;
                foreach (var rest in Permute(counts, remaining - 1))
                {
                    rest.Insert(0, key);
                    yield return rest;
                }
                counts[key]++;
            }
        }
    }
}
