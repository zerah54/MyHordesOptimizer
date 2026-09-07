using System;
using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models.CitizenState;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl
{
    /// <summary>
    /// Ordonne un sac d'objets par ordre de consommation suggéré — glouton sur un score de risque
    /// de l'état résultant, en rejouant chaque candidat via <see cref="ICitizenDayStateEngine"/>.
    /// </summary>
    public class CitizenStateSuggestionEngine : ICitizenStateSuggestionEngine
    {
        // Même liste que CitizenStatusCascadeRules.WoundFamily (privée dans cette classe, dupliquée ici).
        private static readonly string[] WoundFamily =
            { "tg_meta_wound", "wound1", "wound2", "wound3", "wound4", "wound5", "wound6" };

        protected ICitizenDayStateEngine Engine { get; init; }

        public CitizenStateSuggestionEngine(ICitizenDayStateEngine engine)
        {
            Engine = engine;
        }

        public List<int> SuggestOrder(CitizenState startingState, IReadOnlyList<int> bagItemIds) =>
            SuggestOrderForScore(startingState, bagItemIds, ComputeRiskScore).Order;

        public List<SuggestedOrder> SuggestOrders(CitizenState startingState, IReadOnlyList<int> bagItemIds)
        {
            var results = new List<SuggestedOrder>();
            if (bagItemIds.Count == 0) return results;

            // Clé stable, jamais affichée telle quelle : le front (i18n) fait la correspondance vers un libellé localisé.
            results.Add(BuildSuggestedOrder("general", startingState, bagItemIds, ComputeRiskScore));

            if (BagAffectsAxis(startingState, bagItemIds, ThirstScore))
                results.Add(BuildSuggestedOrder("thirst", startingState, bagItemIds, ThirstScore));

            if (BagAffectsAxis(startingState, bagItemIds, WoundScore))
                results.Add(BuildSuggestedOrder("wound", startingState, bagItemIds, WoundScore));

            return results;
        }

        private SuggestedOrder BuildSuggestedOrder(string label, CitizenState startingState, IReadOnlyList<int> bagItemIds, Func<CitizenState, int> scoreFn)
        {
            var (order, finalState) = SuggestOrderForScore(startingState, bagItemIds, scoreFn);
            return new SuggestedOrder { Label = label, Order = order, FinalState = finalState };
        }

        // Vrai si au moins un objet du sac, consommé depuis l'état de départ, fait baisser ce score
        // — c'est-à-dire que le sac peut réellement soulager ce risque (pas juste que le risque existe).
        private bool BagAffectsAxis(CitizenState startingState, IReadOnlyList<int> bagItemIds, Func<CitizenState, int> axisScore)
        {
            var baseline = axisScore(startingState);
            if (baseline == 0) return false;

            foreach (var itemId in bagItemIds)
            {
                var trace = Engine.Simulate(startingState, new List<CitizenStateStep> { new ItemActionStep { ItemId = itemId } });
                if (axisScore(trace.Steps[0].StateAfter) < baseline) return true;
            }

            return false;
        }

        private (List<int> Order, CitizenState FinalState) SuggestOrderForScore(
            CitizenState startingState, IReadOnlyList<int> bagItemIds, Func<CitizenState, int> scoreFn)
        {
            var remaining = new List<int>(bagItemIds);
            var order = new List<int>();
            var current = startingState;

            while (remaining.Count > 0)
            {
                var bestIndex = 0;
                var bestTier = int.MaxValue;
                var bestScore = int.MaxValue;
                CitizenState bestState = current;

                for (var i = 0; i < remaining.Count; i++)
                {
                    var trace = Engine.Simulate(current, new List<CitizenStateStep> { new ItemActionStep { ItemId = remaining[i] } });
                    var resultState = trace.Steps[0].StateAfter;
                    var tier = ComputeDeferralTier(current, resultState);
                    var score = scoreFn(resultState);
                    if (tier < bestTier || (tier == bestTier && score < bestScore))
                    {
                        bestTier = tier;
                        bestScore = score;
                        bestIndex = i;
                        bestState = resultState;
                    }
                }

                order.Add(remaining[bestIndex]);
                current = bestState;
                remaining.RemoveAt(bestIndex);
            }

            return (order, current);
        }

        // Trié avant le score de risque : un candidat qui fait baisser le PDC (CitizenPdcRules) est
        // relégué en fin d'ordre plutôt que de gagner sur le seul gain de PA — couvre l'alcool
        // (perte du bonus "sobre" si HasSoberPdcPerk) et tout autre cas futur, sans cas particulier.
        // Appliqué à tous les scores (Général et par risque) : jamais sacrifier le PDC pour optimiser un axe.
        private static int ComputeDeferralTier(CitizenState before, CitizenState after) =>
            CitizenPdcRules.ComputeCurrentPdc(after) < CitizenPdcRules.ComputeCurrentPdc(before) ? 1 : 0;

        private static int ThirstScore(CitizenState state) =>
            state.Statuses.Contains("thirst2") ? 100 : state.Statuses.Contains("thirst1") ? 40 : 0;

        private static int WoundScore(CitizenState state) =>
            WoundFamily.Any(state.Statuses.Contains) ? 60 : 0;

        private static int ApScore(CitizenState state) =>
            (CitizenPointRules.GetMaxAp(state.Wounded) - state.Ap) * 2;

        private static int ComputeRiskScore(CitizenState state) => ThirstScore(state) + WoundScore(state) + ApScore(state);
    }
}
