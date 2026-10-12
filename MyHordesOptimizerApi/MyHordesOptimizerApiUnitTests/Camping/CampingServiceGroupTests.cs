using FluentAssertions;
using MyHordesOptimizerApi.Data.Building;
using MyHordesOptimizerApi.Data.Buildings;
using MyHordesOptimizerApi.Data.Camping;
using MyHordesOptimizerApi.Data.CauseOfDeath;
using MyHordesOptimizerApi.Data.Citizens;
using MyHordesOptimizerApi.Data.Heroes;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Data.Jobs;
using MyHordesOptimizerApi.Data.Ruins;
using MyHordesOptimizerApi.Data.Wishlist;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using Newtonsoft.Json.Linq;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Camping
{
    /// <summary>
    /// Chances d'un groupe de campeurs : chacun subit la foule de ceux cachés avant lui, seuls les
    /// premiers tiennent dans le bâtiment, et l'aménagement de la zone est donné en niveau.
    /// </summary>
    public class CampingServiceGroupTests
    {
        private static CampingService NewService()
        {
            return new CampingService(null!, new CampingCodeRepository(), null!);
        }

        private static CampingGroupCamperDto Camper(string job)
        {
            return new CampingGroupCamperDto { Job = job, Campings = 0 };
        }

        /// <summary>Désert à 10 km, de nuit, zone aménagée à 30, un citoyen déjà caché.</summary>
        private static CampingGroupParametersDto DesertGroup(params CampingGroupCamperDto[] campers)
        {
            return new CampingGroupParametersDto
            {
                TownType = TownType.RNE,
                Distance = 10,
                Night = true,
                ImprovementLevel = 30,
                HiddenCampers = 1,
                Campers = campers.ToList()
            };
        }

        [Fact]
        public void CalculateGroup_ChancesSelonLeRang()
        {
            var result = NewService().CalculateGroup(DesertGroup(Camper("basic"), Camper("survivalist")));

            // 80 (jamais campé) + 30 (zone) - 25 (désert) + 10 (nuit), puis -10 de foule au second rang
            result.Odds.Should().HaveCount(2);
            result.Odds[0].Probability.Should().Be(95);
            result.Odds[0].BoundedProbability.Should().Be(90);
            result.Odds[0].Details["zone"].Should().Be(30);
            result.Odds[0].Details["zoneBuilding"].Should().Be(-25);
            result.Odds[0].Details["campers"].Should().Be(0);
            result.Odds[1].Probability.Should().Be(85);
            result.Odds[1].BoundedProbability.Should().Be(85);
            result.Odds[1].Details["campers"].Should().Be(-10);
            result.ExpectedSurvivors.Should().BeApproximately(1.75, 1e-9);
        }

        [Fact]
        public void CalculateGroup_MeilleurOrdre_LeSurvivantNonPlafonneSeCacheEnPremier()
        {
            var result = NewService().CalculateGroup(DesertGroup(Camper("basic"), Camper("survivalist")));

            // Survivant d'abord : 95 (plafond 100) + 85 ; l'inverse perd 5 au plafond de 90
            result.BestOrder.Should().Equal(1, 0);
            result.BestExpectedSurvivors.Should().BeApproximately(1.8, 1e-9);
        }

        [Fact]
        public void CalculateGroup_OrdreDejaOptimal_EstGarde()
        {
            var result = NewService().CalculateGroup(DesertGroup(Camper("basic"), Camper("basic")));

            result.BestOrder.Should().Equal(0, 1);
            result.BestExpectedSurvivors.Should().BeApproximately(result.ExpectedSurvivors, 1e-9);
        }

        [Fact]
        public void CalculateGroup_BatimentPlein_LesSuivantsSontDansLeDesert()
        {
            var group = new CampingGroupParametersDto
            {
                TownType = TownType.RNE,
                Distance = 10,
                RuinBonus = 10,
                RuinCapacity = 1,
                Campers = new List<CampingGroupCamperDto> { Camper("basic"), Camper("basic") }
            };

            var result = NewService().CalculateGroup(group);

            result.Odds[0].Details["zoneBuilding"].Should().Be(10);
            result.Odds[0].BoundedProbability.Should().Be(90);
            result.Odds[1].Details["zoneBuilding"].Should().Be(-25);
            result.Odds[1].BoundedProbability.Should().Be(55);
        }

        [Fact]
        public void CalculateGroup_BatimentEnseveli_TroisTasParPlace()
        {
            var group = new CampingGroupParametersDto
            {
                TownType = TownType.RNE,
                Distance = 10,
                RuinBuryCount = 6,
                Campers = new List<CampingGroupCamperDto> { Camper("basic"), Camper("basic"), Camper("basic") }
            };

            var result = NewService().CalculateGroup(group);

            result.Odds.Select(odds => odds.Details["zoneBuilding"]).Should().Equal(15, 15, -25);
        }

        /// <summary>Un campeur seul à 10 km, zone très aménagée (au-dessus des plafonds) : seule la ligne « previous » varie.</summary>
        private static CampingGroupParametersDto Alone(CampingGroupCamperDto camper)
        {
            return new CampingGroupParametersDto
            {
                TownType = TownType.RNE,
                Distance = 10,
                ImprovementLevel = 200,
                Campers = new List<CampingGroupCamperDto> { camper }
            };
        }

        [Theory]
        // R1 : Campeur pro jusqu'à 6 campings (80, 70, 60, 40, 30, 20 puis 0…)
        [InlineData(1, 5, 20)]
        [InlineData(1, 6, -100)]
        // R2 : limite portée à 8
        [InlineData(2, 6, 0)]
        [InlineData(2, 7, -50)]
        // Sans Repos : jamais Campeur pro
        [InlineData(0, 1, 60)]
        public void CalculateGroup_NiveauDeRepos_CampeurProSousLaLimiteDuNiveau(int recluseLevel, int campings, int previous)
        {
            var camper = new CampingGroupCamperDto { Job = "basic", Campings = campings, ProCamper = true, RecluseLevel = recluseLevel };

            var result = NewService().CalculateGroup(Alone(camper));

            result.Odds[0].Details["previous"].Should().Be(previous);
        }

        [Fact]
        public void CalculateGroup_Repos4_PlafondA99()
        {
            var r3 = NewService().CalculateGroup(Alone(new CampingGroupCamperDto { Job = "basic", RecluseLevel = 3 }));
            var r4 = NewService().CalculateGroup(Alone(new CampingGroupCamperDto { Job = "basic", RecluseLevel = 4 }));

            r3.Odds[0].BoundedProbability.Should().Be(90);
            r4.Odds[0].BoundedProbability.Should().Be(99);
        }

        [Fact]
        public void CalculateGroup_ReposInconnu_CasesSaisiesALaMain()
        {
            var camper = new CampingGroupCamperDto { Job = "basic", Campings = 6, ProCamper = true, R4 = true };

            var result = NewService().CalculateGroup(Alone(camper));

            // Campeur pro coché : la limite du niveau n'est pas connue, elle ne s'applique pas
            result.Odds[0].Details["previous"].Should().Be(0);
            result.Odds[0].BoundedProbability.Should().Be(99);
        }

        [Fact]
        public void CalculateCamping_AmeliorationsEtObjetsDeDefense_InchangeAvecLeCalculDeGroupe()
        {
            var odds = NewService().CalculateCamping(new CampingParametersDto
            {
                TownType = TownType.RNE,
                Job = "basic",
                Distance = 10,
                Improve = 2,
                ObjectImprove = 1,
                RuinBonus = -25,
                RuinCapacity = -1
            });

            odds.Details["zone"].Should().Be(19);
            odds.Probability.Should().Be(80 + 19 - 25);
        }

        /// <summary>Valeurs de Data/Camping/CampingBonus.json, sans lecture de fichier.</summary>
        private sealed class CampingCodeRepository : IMyHordesCodeRepository
        {
            public MyHordesCampingBonusModel GetCampingBonus() => new()
            {
                Tomb = 8,
                Pande = -30,
                Improve = 5,
                ObjectImprove = 9,
                Lighthouse = 25,
                CampItems = 5,
                ZombieVest = -3,
                ZombieNoVest = -7,
                Night = 10,
                Devastated = -50,
                DistChances = new List<int> { -100, -75, -50, -25, -10, 0, 0, 0, 0, 0, 0, 0, 5, 7, 10, 15, 20 },
                CrowdChances = new List<int> { 0, 0, -10, -30, -50, -70 },
                PandaProCamperByAlreadyCamped = new List<int> { 50, 45, 40, 30, 20, 10, 0 },
                PandaNoProCamperByAlreadyCamped = new List<int> { 50, 30, 20, 10, 0 },
                NormalProCamperByAlreadyCamped = new List<int> { 80, 70, 60, 40, 30, 20, 0 },
                NormalNoProCamperByAlreadyCamped = new List<int> { 80, 60, 35, 15, 0 },
                CommonByAlreadyCamped = new List<int> { -50, -100, -200, -400, -1000, -2000, -5000 },
                BuriedBonus = 15,
                DesertBonus = -25
            };

            public List<MyHordesCampingResultModel> GetCampingResults() => new()
            {
                new MyHordesCampingResultModel { Probability = 100, Strict = false, Label = new Dictionary<string, string> { ["fr"] = "test" } }
            };

            public Dictionary<string, MyHordesRuinCodeModel> GetRuins() => throw new NotSupportedException();
            public List<MyHordesCategoryCodeModel> GetCategories() => throw new NotSupportedException();
            public Dictionary<string, List<string>> GetItemsProperties() => throw new NotSupportedException();
            public Dictionary<string, List<string>> GetItemsActions() => throw new NotSupportedException();
            public Dictionary<string, string> GetItemsCatapult() => throw new NotSupportedException();
            public Dictionary<string, MyHordesActionsCodeModel> GetActions() => throw new NotSupportedException();
            public Dictionary<string, Dictionary<string, dynamic[]>> GetItemsDropRates() => throw new NotSupportedException();
            /// <summary>Le groupe Repos de capacities.json, et un pouvoir sans groupe (ignoré).</summary>
            public List<MyHordesHerosCapacitiesCodeModel> GetHeroCapacities() => new()
            {
                Recluse(0, 6),
                Recluse(1, 8),
                Recluse(2, 8),
                Recluse(3, 8, ("props.limit.camping.cap", 0.99)),
                new MyHordesHerosCapacitiesCodeModel { Name = "hero_generic_return" }
            };

            private static MyHordesHerosCapacitiesCodeModel Recluse(int level, int limit, params (string Key, double Value)[] extra)
            {
                var properties = new Dictionary<string, JToken>
                {
                    ["features.pro.camper"] = true,
                    ["props.limit.camping.pro"] = limit
                };
                foreach (var (key, value) in extra)
                {
                    properties[key] = value;
                }
                return new MyHordesHerosCapacitiesCodeModel { Name = $"super_recluse{level}", Sort = 4, Level = level, CitizenProperties = properties };
            }
            public List<MyHordesCauseOfDeathModel> GetCausesOfDeath() => throw new NotSupportedException();
            public List<MyHordesCleanUpTypeModel> GetCleanUpTypes() => throw new NotSupportedException();
            public Dictionary<string, MyHordesRecipeCodeModel> GetRecipes() => throw new NotSupportedException();
            public List<MyHordesOptimizerWishlistItemCategorie> GetWishlistItemCategories() => throw new NotSupportedException();
            public List<MyHordesOptimizerDefaultWishlist> GetDefaultWishlists() => throw new NotSupportedException();
            public Dictionary<string, BuildingCodeModel> GetBuildings() => throw new NotSupportedException();
            public Dictionary<string, BuildingHardResourcesCodeModel> GetBuildingHardResources() => throw new NotSupportedException();
            public Dictionary<string, Dictionary<string, string>> GetBuildingAvailability() => throw new NotSupportedException();
            public Dictionary<string, JobCodeModel> GetJobs() => throw new NotSupportedException();
            public Dictionary<string, MyHordesCitizenStatusCodeModel> GetCitizenStatuses() => throw new NotSupportedException();
            public Dictionary<string, MyHordesMetaResultCodeModel> GetMetaResults() => throw new NotSupportedException();
        }
    }
}
