using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>Les âmes partent avec les estimations, sur « Enregistrer » ; l'addon, qui poste sans âmes, ne les efface pas.</summary>
    public class EstimationSoulsTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public EstimationSoulsTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private (int townId, HttpClient client) SeedAndLogin()
        {
            using var scope = _factory.Services.CreateScope();
            var (townId, alive, _, _) = AttackTestSupport.SeedTown(scope.ServiceProvider.GetRequiredService<MhoContext>(), 5);
            return (townId, AttackTestSupport.CreateClientFor(_factory, alive));
        }

        private static Task<HttpResponseMessage> Post(HttpClient client, int townId, string body) =>
            client.PostAsync($"/AttaqueEstimation/Estimations?townId={townId}", new StringContent(body, Encoding.UTF8, "application/json"));

        private async Task<EstimationRequestDto> Get(HttpClient client, int townId) =>
            JsonSerializer.Deserialize<EstimationRequestDto>(await client.GetStringAsync($"/AttaqueEstimation/Estimations/5?townId={townId}"), JsonOptions)!;

        [Fact]
        public async Task Post_AvecAmes_GetLesRenvoie()
        {
            var (townId, client) = SeedAndLogin();

            var post = await Post(client, townId, "{\"day\":5,\"estim\":{\"_33\":{\"min\":3000,\"max\":4000}},\"planif\":{},\"estimSouls\":{\"33\":2},\"estimSpaLevel\":2}");
            post.StatusCode.Should().Be(HttpStatusCode.OK);

            var dto = await Get(client, townId);
            dto.EstimSouls.Should().ContainKey(33).WhoseValue.Should().Be(2);
            dto.EstimSpaLevel.Should().Be(2);
            dto.PlanifSouls.Should().BeEmpty();
            dto.PlanifSpaLevel.Should().Be(0);
        }

        [Fact]
        public async Task Post_SansChampsDAmes_CommeLAddon_LesConserve()
        {
            var (townId, client) = SeedAndLogin();
            await Post(client, townId, "{\"day\":5,\"estim\":{},\"planif\":{},\"planifSouls\":{\"0\":1},\"planifSpaLevel\":1}");

            var post = await Post(client, townId, "{\"day\":5,\"estim\":{},\"planif\":{\"_0\":{\"min\":3000,\"max\":4000}}}");
            post.StatusCode.Should().Be(HttpStatusCode.OK);

            using var check = _factory.Services.CreateScope();
            var row = check.ServiceProvider.GetRequiredService<MhoContext>().TownEstimations.AsNoTracking().Single(e => e.IdTown == townId && e.Day == 5 && e.IsPlanif);
            row.Souls.Should().Be("{\"0\":1}");
            row.SpaLevel.Should().Be(1);
            row._0min.Should().Be(3000);
        }

        [Fact]
        public async Task Post_AmesVides_LesEfface()
        {
            var (townId, client) = SeedAndLogin();
            await Post(client, townId, "{\"day\":5,\"estim\":{},\"planif\":{},\"estimSouls\":{\"33\":1}}");

            await Post(client, townId, "{\"day\":5,\"estim\":{},\"planif\":{},\"estimSouls\":{}}");

            (await Get(client, townId)).EstimSouls.Should().BeEmpty();
        }

        [Fact]
        public async Task Post_PalierInconnuOuNiveauHorsBornes_400()
        {
            var (townId, client) = SeedAndLogin();
            (await Post(client, townId, "{\"day\":5,\"estim\":{},\"planif\":{},\"estimSouls\":{\"0\":1}}")).StatusCode.Should().Be(HttpStatusCode.BadRequest);
            (await Post(client, townId, "{\"day\":5,\"estim\":{},\"planif\":{},\"planifSpaLevel\":4}")).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
    }
}
