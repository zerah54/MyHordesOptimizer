using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    public class AttackSettingsTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public AttackSettingsTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task SansReglage_RenvoieLesDefauts_PuisPutLesEnregistre_EtLaLectureResteOuverte()
        {
            int townId, alive, outsider;
            using (var scope = _factory.Services.CreateScope())
            {
                (townId, alive, _, outsider) = AttackTestSupport.SeedTown(scope.ServiceProvider.GetRequiredService<MhoContext>(), 5);
            }
            var client = AttackTestSupport.CreateClientFor(_factory, alive);

            var empty = JsonSerializer.Deserialize<AttackSettingsDto>(await client.GetStringAsync($"/AttaqueEstimation/AttackSettings/6?townId={townId}"), JsonOptions)!;
            empty.Souls.Should().BeNull();
            empty.Fireworks.Should().BeFalse();

            var put = await client.PutAsync($"/AttaqueEstimation/AttackSettings/6?townId={townId}", new StringContent("{\"souls\":2,\"spaLevel\":null,\"fireworks\":true}", Encoding.UTF8, "application/json"));
            put.StatusCode.Should().Be(HttpStatusCode.OK);

            var observer = AttackTestSupport.CreateClientFor(_factory, outsider);
            var saved = JsonSerializer.Deserialize<AttackSettingsDto>(await observer.GetStringAsync($"/AttaqueEstimation/AttackSettings/6?townId={townId}"), JsonOptions)!;
            saved.Souls.Should().Be(2);
            saved.SpaLevel.Should().BeNull();
            saved.Fireworks.Should().BeTrue();
        }

        [Fact]
        public async Task Get_RenvoieLeDefautResoluParLeServeur_EtSaSource()
        {
            int townId, alive;
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                (townId, alive, _, _) = AttackTestSupport.SeedTown(context, 5);
                context.TownEstimations.Add(new MyHordesOptimizerApi.Models.TownEstimation { IdTown = townId, Day = 5, IsPlanif = false });
                context.TownEstimations.Add(new MyHordesOptimizerApi.Models.TownEstimation { IdTown = townId, Day = 5, IsPlanif = true, _8min = 3000, _8max = 4000, Souls = "{\"8\":3}", SpaLevel = 1 });
                context.SaveChanges();
            }

            // Tour du J6 vide : le défaut vient du planificateur du J5.
            var settings = JsonSerializer.Deserialize<AttackSettingsDto>(
                await AttackTestSupport.CreateClientFor(_factory, alive).GetStringAsync($"/AttaqueEstimation/AttackSettings/6?townId={townId}"), JsonOptions)!;
            settings.DefaultSouls.Should().Be(3);
            settings.DefaultSpaLevel.Should().Be(1);
            settings.DefaultFromTdg.Should().BeFalse();
        }

        [Fact]
        public async Task Put_Etranger_403()
        {
            int townId, outsider;
            using (var scope = _factory.Services.CreateScope())
            {
                (townId, _, _, outsider) = AttackTestSupport.SeedTown(scope.ServiceProvider.GetRequiredService<MhoContext>(), 5);
            }
            var response = await AttackTestSupport.CreateClientFor(_factory, outsider)
                .PutAsync($"/AttaqueEstimation/AttackSettings/6?townId={townId}", new StringContent("{\"souls\":1,\"spaLevel\":null,\"fireworks\":false}", Encoding.UTF8, "application/json"));
            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }
    }
}
