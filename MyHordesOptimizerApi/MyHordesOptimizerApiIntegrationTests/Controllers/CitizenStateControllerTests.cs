using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.CitizenState;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    public class CitizenStateControllerTests : ControllerTestBase
    {
        public CitizenStateControllerTests(MyHordesOptimizerApplicationFactory factory) : base(factory)
        {
        }

        public override Task InitializeAsync() => Task.CompletedTask;
        public override Task DisposeAsync() => Task.CompletedTask;

        [Fact]
        public async Task GetItemsWithStateImpact_RenvoieUneListeDUids()
        {
            var response = await Client.GetAsync("CitizenState/ItemsWithStateImpact");
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var uids = await response.Content.ReadFromJsonAsync<List<string>>();
            uids.Should().NotBeNull();
        }

        [Fact]
        public async Task PostCitizenDay_DeplacementsProches_DecrementeLApAChaqueEtape()
        {
            var request = new CitizenDayStateRequestDto
            {
                StartingState = new CitizenStateDto { Ap = 6, Sp = 0 },
                Steps = new()
                {
                    new CitizenStateStepDto { Type = "move", IsNearZone = true },
                    new CitizenStateStepDto { Type = "move", IsNearZone = true },
                }
            };

            var response = await Client.PostAsJsonAsync("CitizenState/CitizenDay", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var trace = await response.Content.ReadFromJsonAsync<CitizenStateTraceDto>();
            trace!.Steps.Should().HaveCount(2);
            trace.Steps[0].StateAfter.Ap.Should().Be(5);
            trace.Steps[1].StateAfter.Ap.Should().Be(4);
        }

        [Fact]
        public async Task PostCitizenDay_ItemIdInconnu_RenvoieUnEtatInchangeSansErreur()
        {
            var request = new CitizenDayStateRequestDto
            {
                StartingState = new CitizenStateDto { Ap = 4, Sp = 1 },
                Steps = new() { new CitizenStateStepDto { Type = "item", ItemId = -999999 } }
            };

            var response = await Client.PostAsJsonAsync("CitizenState/CitizenDay", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var trace = await response.Content.ReadFromJsonAsync<CitizenStateTraceDto>();
            trace!.Steps[0].StateAfter.Ap.Should().Be(4);
            trace.Steps[0].StateAfter.Sp.Should().Be(1);
        }

        [Fact]
        public async Task PostCitizenDay_TypeEtapeInconnu_RenvoieBadRequest()
        {
            var request = new CitizenDayStateRequestDto
            {
                StartingState = new CitizenStateDto { Ap = 4, Sp = 1 },
                Steps = new() { new CitizenStateStepDto { Type = "bogus" } }
            };

            var response = await Client.PostAsJsonAsync("CitizenState/CitizenDay", request);

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task PostCitizenDay_MortParDeshydratation_ArreteLaTraceAvantLaDerniereEtape()
        {
            var request = new CitizenDayStateRequestDto
            {
                StartingState = new CitizenStateDto { Ap = 20, Sp = 0, WalkingDistance = 10, Statuses = new() { "thirst2" } },
                Steps = new()
                {
                    new CitizenStateStepDto { Type = "move", IsNearZone = true },
                    new CitizenStateStepDto { Type = "move", IsNearZone = true },
                }
            };

            var response = await Client.PostAsJsonAsync("CitizenState/CitizenDay", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var trace = await response.Content.ReadFromJsonAsync<CitizenStateTraceDto>();
            trace!.Steps.Should().HaveCount(1);
            trace.Steps[0].StateAfter.IsDead.Should().BeTrue();
        }

        [Fact]
        public async Task PostCitizenDay_MonteAVeloPuisDescend_MetAJourHasBikeEtLeSp()
        {
            var request = new CitizenDayStateRequestDto
            {
                StartingState = new CitizenStateDto { Ap = 6, Sp = 0 },
                Steps = new()
                {
                    new CitizenStateStepDto { Type = "mount_bike" },
                    new CitizenStateStepDto { Type = "dismount_bike" },
                }
            };

            var response = await Client.PostAsJsonAsync("CitizenState/CitizenDay", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var trace = await response.Content.ReadFromJsonAsync<CitizenStateTraceDto>();
            trace!.Steps.Should().HaveCount(2);
            trace.Steps[0].StateAfter.HasBike.Should().BeTrue();
            trace.Steps[0].StateAfter.Sp.Should().Be(2);
            trace.Steps[1].StateAfter.HasBike.Should().BeFalse();
            trace.Steps[1].StateAfter.Sp.Should().Be(0);
        }

        [Fact]
        public async Task PostCitizenDay_EquipeDesBaskets_MetAJourHasShoesEtLeSp()
        {
            var request = new CitizenDayStateRequestDto
            {
                StartingState = new CitizenStateDto { Ap = 6, Sp = 0 },
                Steps = new() { new CitizenStateStepDto { Type = "equip_shoes" } }
            };

            var response = await Client.PostAsJsonAsync("CitizenState/CitizenDay", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var trace = await response.Content.ReadFromJsonAsync<CitizenStateTraceDto>();
            trace!.Steps[0].StateAfter.HasShoes.Should().BeTrue();
            trace.Steps[0].StateAfter.Sp.Should().Be(1);
        }

        [Fact]
        public async Task PostCitizenDay_RamasseObjetDefenseZone_MetAJourHasDefenceCpItem()
        {
            var request = new CitizenDayStateRequestDto
            {
                StartingState = new CitizenStateDto { Ap = 6, Sp = 0, HasDefenceCpItem = false },
                Steps = new() { new CitizenStateStepDto { Type = "pickup_defence_cp_item" } }
            };

            var response = await Client.PostAsJsonAsync("CitizenState/CitizenDay", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var trace = await response.Content.ReadFromJsonAsync<CitizenStateTraceDto>();
            trace!.Steps[0].StateAfter.HasDefenceCpItem.Should().BeTrue();
        }

        [Fact]
        public async Task PostCitizenDay_DevientGoule_MetAJourIsRoleGhoul()
        {
            var request = new CitizenDayStateRequestDto
            {
                StartingState = new CitizenStateDto { Ap = 6, Sp = 0, IsRoleGhoul = false },
                Steps = new() { new CitizenStateStepDto { Type = "become_ghoul" } }
            };

            var response = await Client.PostAsJsonAsync("CitizenState/CitizenDay", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var trace = await response.Content.ReadFromJsonAsync<CitizenStateTraceDto>();
            trace!.StartingState.IsRoleGhoul.Should().BeFalse();
            trace.Steps[0].StateAfter.IsRoleGhoul.Should().BeTrue();
        }

        [Fact]
        public async Task PostCitizenDay_ChampsPdc_FontLAllerRetourEtLePdcEstCalcule()
        {
            var request = new CitizenDayStateRequestDto
            {
                StartingState = new CitizenStateDto
                {
                    Ap = 6,
                    Sp = 0,
                    HasShield = true,
                    HasDefenceCpItem = true,
                    IsGuide = true,
                    ZoneCitizenCount = 3,
                    HasBaseZoneControlPerk = true,
                },
                Steps = new()
            };

            var response = await Client.PostAsJsonAsync("CitizenState/CitizenDay", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var trace = await response.Content.ReadFromJsonAsync<CitizenStateTraceDto>();
            trace!.StartingState.HasShield.Should().BeTrue();
            trace.StartingState.HasDefenceCpItem.Should().BeTrue();
            trace.StartingState.IsGuide.Should().BeTrue();
            trace.StartingState.ZoneCitizenCount.Should().Be(3);
            trace.StartingState.HasBaseZoneControlPerk.Should().BeTrue();
            // 2 (base) + 2 (bouclier) + 1 (defence_cp) + 3 (guide) + 1 (perk base) = 9
            trace.StartingState.Pdc.Should().Be(9);
        }

        [Fact]
        public async Task PostCitizenDay_PdcFourniEnEntree_EstIgnoreEtRecalcule()
        {
            var request = new CitizenDayStateRequestDto
            {
                StartingState = new CitizenStateDto { Ap = 6, Sp = 0, Pdc = 999 },
                Steps = new()
            };

            var response = await Client.PostAsJsonAsync("CitizenState/CitizenDay", request);

            var trace = await response.Content.ReadFromJsonAsync<CitizenStateTraceDto>();
            trace!.StartingState.Pdc.Should().Be(2);
        }

        [Fact]
        public async Task PostRankOrders_SacVide_RenvoieUneListeVide()
        {
            var request = new SuggestOrderRequestDto
            {
                StartingState = new CitizenStateDto { Ap = 6, Sp = 0 },
                BagItemIds = new List<int>()
            };

            var response = await Client.PostAsJsonAsync("CitizenState/RankOrders", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var ranked = await response.Content.ReadFromJsonAsync<List<RankedOrderDto>>();
            ranked.Should().NotBeNull();
            ranked.Should().BeEmpty();
        }

        [Fact]
        public async Task PostRankOrders_SacNonVide_RenvoieUnOrdreClasse()
        {
            var request = new SuggestOrderRequestDto
            {
                StartingState = new CitizenStateDto { Ap = 6, Sp = 0 },
                BagItemIds = new List<int> { -999999 } // item inconnu : ignoré par le moteur (comme PostCitizenDay_ItemIdInconnu)
            };

            var response = await Client.PostAsJsonAsync("CitizenState/RankOrders", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var ranked = await response.Content.ReadFromJsonAsync<List<RankedOrderDto>>();
            ranked.Should().NotBeNull();
            ranked!.Should().ContainSingle(r => r.Tier == "none");
        }
    }
}
