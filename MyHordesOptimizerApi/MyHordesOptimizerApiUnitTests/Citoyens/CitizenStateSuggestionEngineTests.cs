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
    /// Glouton qui ordonne un sac d'objets par score de risque décroissant, en rejouant chaque
    /// candidat via <see cref="ICitizenDayStateEngine"/> — mêmes actions.json/meta-results.json
    /// réels que CitizenDayStateEngineTests (aucune dépendance DB).
    /// </summary>
    public class CitizenStateSuggestionEngineTests
    {
        private const int NeutralItemId = 1; // action "can" : pas d'impact PA/PE/statut (vérifié dans ItemStateImpactResolverTests)
        private const int ThirstTl1ItemId = 2; // action "water_tl1a" : retire thirst1 (meta-result "drink_ap_2", atome StatusFrom pur)
        private const int BandageItemId = 3; // action "bandage" : purge la famille blessure
        private const int AlcoholItemId = 4; // action "alcohol" : +6 PA mais inflige "drunk"

        private static ICitizenStateSuggestionEngine CreateEngine(Dictionary<int, string[]> itemActions)
        {
            var dayEngine = new CitizenDayStateEngine(new MyHordesCodeRepository(), new FakeItemActionsProvider(itemActions));
            return new CitizenStateSuggestionEngine(dayEngine);
        }

        [Fact]
        public void SuggestOrder_CitoyenAssoiffe_MetLObjetQuiSoulageLaSoifEnPremier()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [NeutralItemId] = new[] { "can" },
                [ThirstTl1ItemId] = new[] { "water_tl1a" },
            });
            var start = new CitizenState { Ap = 6, Sp = 0, Statuses = new HashSet<string> { "thirst1" } };

            var order = engine.SuggestOrder(start, new List<int> { NeutralItemId, ThirstTl1ItemId });

            order[0].Should().Be(ThirstTl1ItemId);
        }

        [Fact]
        public void SuggestOrder_CitoyenBlesse_MetLeBandageEnPremier()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [NeutralItemId] = new[] { "can" },
                [BandageItemId] = new[] { "bandage" },
            });
            var start = new CitizenState { Ap = 6, Sp = 0, Wounded = true, Statuses = new HashSet<string> { "tg_meta_wound", "wound3" } };

            var order = engine.SuggestOrder(start, new List<int> { NeutralItemId, BandageItemId });

            order[0].Should().Be(BandageItemId);
        }

        [Fact]
        public void SuggestOrder_AlcoolFaitBaisserLePdc_EstToujoursPlaceEnDernierMemeSiMeilleurScoreImmediat()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [NeutralItemId] = new[] { "can" },
                [AlcoholItemId] = new[] { "alcohol" },
            });
            var start = new CitizenState { Ap = 0, Sp = 0, HasSoberPdcPerk = true, Statuses = new HashSet<string>() };

            var order = engine.SuggestOrder(start, new List<int> { AlcoholItemId, NeutralItemId });

            order.Last().Should().Be(AlcoholItemId);
        }

        [Fact]
        public void SuggestOrder_AlcoolSansPerkSobre_NAffecteAucunPdcNiPlaceEnDernier()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [NeutralItemId] = new[] { "can" },
                [AlcoholItemId] = new[] { "alcohol" },
            });
            var start = new CitizenState { Ap = 0, Sp = 0, Statuses = new HashSet<string>() };

            var order = engine.SuggestOrder(start, new List<int> { AlcoholItemId, NeutralItemId });

            // Sans le perk PDC, l'alcool reste le meilleur choix par score de risque (gain de PA) :
            // comportement inchangé par rapport à avant l'introduction du PDC.
            order.First().Should().Be(AlcoholItemId);
        }

        [Fact]
        public void SuggestOrder_ObjetPresentEnDouble_ApparaitDeuxFoisDansLOrdre()
        {
            var engine = CreateEngine(new Dictionary<int, string[]> { [NeutralItemId] = new[] { "can" } });
            var start = new CitizenState { Ap = 6, Sp = 0 };

            var order = engine.SuggestOrder(start, new List<int> { NeutralItemId, NeutralItemId });

            order.Should().HaveCount(2);
            order.Should().AllBeEquivalentTo(NeutralItemId);
        }

        [Fact]
        public void SuggestOrder_SacVide_RenvoieUneListeVide()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 6, Sp = 0 };

            var order = engine.SuggestOrder(start, new List<int>());

            order.Should().BeEmpty();
        }

        [Fact]
        public void SuggestOrders_SacVide_RenvoieUneListeVide()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 6, Sp = 0 };

            var orders = engine.SuggestOrders(start, new List<int>());

            orders.Should().BeEmpty();
        }

        [Fact]
        public void SuggestOrders_CitoyenSain_NeContientQueLEntreeGenerale()
        {
            var engine = CreateEngine(new Dictionary<int, string[]> { [NeutralItemId] = new[] { "can" } });
            var start = new CitizenState { Ap = 6, Sp = 0 };

            var orders = engine.SuggestOrders(start, new List<int> { NeutralItemId });

            orders.Should().ContainSingle();
            orders[0].Label.Should().Be("general");
            orders[0].Order.Should().Equal(NeutralItemId);
        }

        [Fact]
        public void SuggestOrders_CitoyenAssoiffeAvecEauDansLeSac_AjouteUneEntreeAntiSoif()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [NeutralItemId] = new[] { "can" },
                [ThirstTl1ItemId] = new[] { "water_tl1a" },
            });
            var start = new CitizenState { Ap = 6, Sp = 0, Statuses = new HashSet<string> { "thirst1" } };

            var orders = engine.SuggestOrders(start, new List<int> { NeutralItemId, ThirstTl1ItemId });

            var antiSoif = orders.Should().ContainSingle(o => o.Label == "thirst").Subject;
            antiSoif.Order[0].Should().Be(ThirstTl1ItemId);
            antiSoif.FinalState.Statuses.Should().NotContain("thirst1");
        }

        [Fact]
        public void SuggestOrders_CitoyenBlesseAvecBandageDansLeSac_AjouteUneEntreeAntiBlessure()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [NeutralItemId] = new[] { "can" },
                [BandageItemId] = new[] { "bandage" },
            });
            var start = new CitizenState { Ap = 6, Sp = 0, Wounded = true, Statuses = new HashSet<string> { "tg_meta_wound", "wound3" } };

            var orders = engine.SuggestOrders(start, new List<int> { NeutralItemId, BandageItemId });

            var antiBlessure = orders.Should().ContainSingle(o => o.Label == "wound").Subject;
            antiBlessure.Order[0].Should().Be(BandageItemId);
            antiBlessure.FinalState.Statuses.Should().NotContain("wound3");
        }

        [Fact]
        public void SuggestOrders_CitoyenAssoiffeSansObjetPourLaSoifDansLeSac_NAjoutePasDentreeAntiSoif()
        {
            var engine = CreateEngine(new Dictionary<int, string[]> { [NeutralItemId] = new[] { "can" } });
            var start = new CitizenState { Ap = 6, Sp = 0, Statuses = new HashSet<string> { "thirst1" } };

            var orders = engine.SuggestOrders(start, new List<int> { NeutralItemId });

            orders.Should().NotContain(o => o.Label == "thirst");
        }

        [Fact]
        public void SuggestOrders_EntreeGeneraleExposeLEtatFinalApresLaSequenceComplete()
        {
            var engine = CreateEngine(new Dictionary<int, string[]> { [AlcoholItemId] = new[] { "alcohol" } });
            var start = new CitizenState { Ap = 0, Sp = 0, Statuses = new HashSet<string>() };

            var orders = engine.SuggestOrders(start, new List<int> { AlcoholItemId });

            orders[0].FinalState.Ap.Should().Be(6); // alcohol (actions.json) : +6 PA
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
