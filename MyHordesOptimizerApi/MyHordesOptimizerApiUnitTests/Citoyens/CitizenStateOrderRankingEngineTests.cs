using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Models.CitizenState;
using MyHordesOptimizerApi.Repository.Impl;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Interfaces;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Citoyens
{
    /// <summary>
    /// Moteur de classement de tous les ordres possibles (remplace CitizenStateSuggestionEngine) —
    /// scénarios validés en conversation (2026-08-29/30) rejoués comme cas de référence.
    /// </summary>
    public class CitizenStateOrderRankingEngineTests
    {
        private const int DrugItemId = 1; // "drug_8ap_1"/"drug_8ap_2" (Twinoïde) : plancher MaxAp+2
        private const int FoodItemId = 2; // "eat_7ap" : plancher MaxAp+1
        private const int WaterItemId = 3; // "water_tl0"/"water_tl1a"/"water_tl1b"/"water_tl2" : plancher MaxAp+0
        private const int BandageItemId = 4; // "bandage" : heal_wound
        private const int WoundItemId = 5; // "emt" (sport-élec) : +MaxAp, inflict_wound
        private const int AlcoholItemId = 6; // "alcohol" : plancher MaxAp+0, inflige "drunk"
        private const int WeakFoodItemId = 7; // "eat_5ap" : plancher MaxAp-2, moins bon que eat_7ap

        private static ICitizenStateOrderRankingEngine CreateEngine(Dictionary<int, string[]> itemActions) =>
            new CitizenStateOrderRankingEngine(new MyHordesCodeRepository(), new FakeItemActionsProvider(itemActions));

        [Fact]
        public void RankOrders_SacVide_RenvoieUneListeVide()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 6, Sp = 0 };

            engine.RankOrders(start, new List<int>()).Should().BeEmpty();
        }

        [Fact]
        public void RankOrders_DeuxTwinoUnSteakUneEau_ConsommerLesDeuxTwinoRendToujoursDependant()
        {
            // Scénario de référence de la conversation : Ap=6=MaxAp, aucun statut de départ. Une
            // drogue rend son plein PA à CHAQUE prise (drug_8ap_2 contient aussi "just_ap8") — seul le
            // statut infligé change (drogué puis dépendant). Consommer les 2 twino déclenche donc
            // toujours "dépendant" au moins, quel que soit l'ordre.
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [DrugItemId] = new[] { "drug_8ap_1", "drug_8ap_2" },
                [FoodItemId] = new[] { "eat_7ap" },
                [WaterItemId] = new[] { "water_tl0", "water_tl1a", "water_tl1b", "water_tl2" },
            });
            var start = new CitizenState { Ap = 6, Sp = 0, Statuses = new HashSet<string>() };

            var ranked = engine.RankOrders(start, new List<int> { DrugItemId, DrugItemId, FoodItemId, WaterItemId });

            ranked.Should().OnlyContain(r =>
                r.Tier == CitizenStateSeverityTier.Addicted || r.Tier == CitizenStateSeverityTier.Dehydrated || r.Tier == CitizenStateSeverityTier.Dead);
        }

        [Fact]
        public void RankOrders_TroisTwinoUnSteakSansEau_MeurtDeDeshydratation()
        {
            // Signalé en conversation (2026-08-30) : Ap=6, sac = 3 twino + B7, PAS d'eau. Budget total
            // = 6(départ)+8+8+8(3 twino, PLEIN PA à chaque prise)+7(B7) = 37, largement de quoi
            // franchir 3 paliers (33 pas cumulés : soif → déshydraté → mort) quel que soit l'ordre —
            // aucune eau pour jamais réinitialiser le compteur.
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [DrugItemId] = new[] { "drug_8ap_1", "drug_8ap_2" },
                [FoodItemId] = new[] { "eat_7ap" },
            });
            var start = new CitizenState { Ap = 6, Sp = 0, Statuses = new HashSet<string>() };

            var ranked = engine.RankOrders(start, new List<int> { DrugItemId, DrugItemId, DrugItemId, FoodItemId });

            ranked.Should().OnlyContain(r => r.Tier == CitizenStateSeverityTier.Dead);
        }

        [Fact]
        public void RankOrders_DeuxTwinoUnSteakUnAlcoolSansEau_MeurtDeDeshydratation()
        {
            // Signalé en conversation (2026-08-30) : sac B7 + 2 twino + alcool, Ap=6, PAS d'eau —
            // rien ne peut jamais réinitialiser le compteur de soif. Une drogue rend son plein PA à
            // chaque prise (drug_8ap_2 contient aussi "just_ap8") : budget total =
            // 6(départ)+7(B7)+8+8(2 twino)+6(alcool)=35, largement de quoi franchir 3 paliers (33 pas
            // cumulés : soif → déshydraté → mort) quel que soit l'ordre.
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [DrugItemId] = new[] { "drug_8ap_1", "drug_8ap_2" },
                [FoodItemId] = new[] { "eat_7ap" },
                [AlcoholItemId] = new[] { "alcohol" },
            });
            var start = new CitizenState { Ap = 6, Sp = 0, Statuses = new HashSet<string>() };

            var ranked = engine.RankOrders(start, new List<int> { DrugItemId, DrugItemId, FoodItemId, AlcoholItemId });

            ranked.Should().OnlyContain(r => r.Tier == CitizenStateSeverityTier.Dead);
        }

        [Fact]
        public void RankOrders_ObjetsIdentiquesEnDouble_NeGenerePasDeLignesDupliquees()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [FoodItemId] = new[] { "eat_7ap" },
                [DrugItemId] = new[] { "drug_8ap_1", "drug_8ap_2" },
            });
            var start = new CitizenState { Ap = 0, Sp = 0 };

            var ranked = engine.RankOrders(start, new List<int> { FoodItemId, DrugItemId, DrugItemId });

            // 3 objets dont 2 identiques (2 twino) : 3!/2! = 3 permutations distinctes, pas 6.
            ranked.Should().HaveCount(3);
        }

        [Fact]
        public void RankOrders_ObjetBlessantSansBandage_ToutesLesOccurrencesEnDernierePosition()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [WoundItemId] = new[] { "emt" },
                [FoodItemId] = new[] { "eat_7ap" },
            });
            var start = new CitizenState { Ap = 0, Sp = 0, Statuses = new HashSet<string>() };

            var ranked = engine.RankOrders(start, new List<int> { WoundItemId, FoodItemId });

            ranked.Should().OnlyContain(r => r.Order.Last() == WoundItemId);
        }

        [Fact]
        public void RankOrders_ObjetBlessantAvecBandage_ToutesLesOccurrencesEnPremierePosition()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [WoundItemId] = new[] { "emt" },
                [BandageItemId] = new[] { "bandage" },
                [FoodItemId] = new[] { "eat_7ap" },
            });
            var start = new CitizenState { Ap = 0, Sp = 0, Statuses = new HashSet<string>() };

            var ranked = engine.RankOrders(start, new List<int> { WoundItemId, BandageItemId, FoodItemId });

            ranked.Should().OnlyContain(r => r.Order.First() == WoundItemId);
        }

        [Fact]
        public void RankOrders_MeilleurTierEnPremier_MortApresLeReste()
        {
            // Un citoyen déjà à thirst2 : tout objet neutre (sans eau ni palliatif) le fait mourir
            // dès le 11e pas de déplacement induit. Avec de l'eau dans le sac, l'ordre qui boit
            // d'abord doit strictement dominer celui qui ne boit jamais.
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [WaterItemId] = new[] { "water_tl0", "water_tl1a", "water_tl1b", "water_tl2" },
                [DrugItemId] = new[] { "drug_8ap_1", "drug_8ap_2" },
            });
            var start = new CitizenState { Ap = 5, Sp = 0, Statuses = new HashSet<string> { "thirst2" } };

            var ranked = engine.RankOrders(start, new List<int> { WaterItemId, DrugItemId });

            ranked.First().Order.Should().Equal(WaterItemId, DrugItemId);
            ranked.First().Tier.Should().Be(CitizenStateSeverityTier.Thirsty);
            ranked.Last().Order.Should().Equal(DrugItemId, WaterItemId);
            ranked.Last().Tier.Should().Be(CitizenStateSeverityTier.Dead);
        }

        [Fact]
        public void RankOrders_UnSteakSeul_TotalDistanceEstLeBudgetConsomme()
        {
            // Ap=0 au départ + eat_7ap (plancher MaxAp+1=7, MaxAp=6 non blessé) = 7 pas au total.
            var engine = CreateEngine(new Dictionary<int, string[]> { [FoodItemId] = new[] { "eat_7ap" } });
            var start = new CitizenState { Ap = 0, Sp = 0, Statuses = new HashSet<string>() };

            var ranked = engine.RankOrders(start, new List<int> { FoodItemId });

            ranked.Should().ContainSingle().Which.TotalDistance.Should().Be(7);
        }

        [Fact]
        public void RankOrders_TroisTwinoUnSteakSansEau_TotalDistanceEstLaDistanceAvantLaMort()
        {
            // Même scénario que RankOrders_TroisTwinoUnSteakSansEau_MeurtDeDeshydratation : le 3e palier
            // de soif (mort) tombe à distance cumulée 33, quel que soit l'ordre — le budget total (37)
            // n'est jamais épuisé, ce qui distingue TotalDistance (arrêté à la mort) du budget brut.
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [DrugItemId] = new[] { "drug_8ap_1", "drug_8ap_2" },
                [FoodItemId] = new[] { "eat_7ap" },
            });
            var start = new CitizenState { Ap = 6, Sp = 0, Statuses = new HashSet<string>() };

            var ranked = engine.RankOrders(start, new List<int> { DrugItemId, DrugItemId, DrugItemId, FoodItemId });

            ranked.Should().OnlyContain(r => r.TotalDistance == 33);
        }

        [Fact]
        public void RankOrders_DeuxAlimentsDifferents_NeGardeQueLeMeilleur()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [FoodItemId] = new[] { "eat_7ap" },
                [WeakFoodItemId] = new[] { "eat_5ap" },
            });
            var start = new CitizenState { Ap = 0, Sp = 0, Statuses = new HashSet<string>() };

            var ranked = engine.RankOrders(start, new List<int> { WeakFoodItemId, FoodItemId });

            ranked.Should().HaveCount(1);
            ranked.Single().Order.Should().Equal(FoodItemId);
        }

        [Fact]
        public void RankOrders_DeuxAlcoolsIdentiques_NApparaissentQuUneFoisDansLOrdre()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [AlcoholItemId] = new[] { "alcohol" },
            });
            var start = new CitizenState { Ap = 0, Sp = 0, Statuses = new HashSet<string>() };

            var ranked = engine.RankOrders(start, new List<int> { AlcoholItemId, AlcoholItemId });

            ranked.Should().HaveCount(1);
            ranked.Single().Order.Should().Equal(AlcoholItemId);
        }

        private class FakeItemActionsProvider : ICitizenItemActionsProvider
        {
            private readonly Dictionary<int, string[]> _actionsByItemId;

            public FakeItemActionsProvider(Dictionary<int, string[]> actionsByItemId) => _actionsByItemId = actionsByItemId;

            public IReadOnlyList<string> GetActionNames(int itemId) =>
                _actionsByItemId.TryGetValue(itemId, out var names) ? names : Array.Empty<string>();
        }
    }
}
