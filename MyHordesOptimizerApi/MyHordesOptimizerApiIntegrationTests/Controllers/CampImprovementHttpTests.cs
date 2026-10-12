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
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>Saisie de l'aménagement d'une zone pour le camping : POST Map/Cell/CampImprovement.</summary>
    public class CampImprovementHttpTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;
        private const int CellX = 3;
        private const int CellY = 4;
        private const int TownCellX = 6;
        private const int TownCellY = 6;

        private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public CampImprovementHttpTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        /// <summary>Ville au jour 5, une case hors ville aménagée à <paramref name="level"/> le jour <paramref name="levelDay"/>, et la case de la ville.</summary>
        private (int townId, int userId) SeedTown(int? level, int? levelDay)
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, aliveUserId, _, _) = AttackTestSupport.SeedTown(context, Day);
            context.MapCells.Add(new MapCell { IdTown = townId, X = CellX, Y = CellY, IsTown = false, CampImprovementLevel = level, CampImprovementDay = levelDay });
            context.MapCells.Add(new MapCell { IdTown = townId, X = TownCellX, Y = TownCellY, IsTown = true });
            context.SaveChanges();
            return (townId, aliveUserId);
        }

        private MapCell StoredCell(int townId)
        {
            using var scope = _factory.Services.CreateScope();
            return scope.ServiceProvider.GetRequiredService<MhoContext>().MapCells.AsNoTracking()
                .Single(cell => cell.IdTown == townId && cell.X == CellX && cell.Y == CellY);
        }

        private static StringContent Json(string json)
        {
            return new StringContent(json, Encoding.UTF8, "application/json");
        }

        [Fact]
        public async Task Ajouts_PartentDuNiveauCourant_EtDatentDuJourDeLaVille()
        {
            // 40 au jour 3 : deux nuits plus tard il reste 10
            var (townId, userId) = SeedTown(40, 3);

            var response = await AttackTestSupport.CreateClientFor(_factory, userId)
                .PostAsync($"/Map/Cell/CampImprovement?townId={townId}", Json($"{{\"x\":{CellX},\"y\":{CellY},\"improvements\":1,\"defenseObjects\":2}}"));

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var result = JsonSerializer.Deserialize<CampImprovementDto>(await response.Content.ReadAsStringAsync(), JsonOptions)!;
            result.Level.Should().Be(10 + 5 + 18);
            result.Day.Should().Be(Day);
            var cell = StoredCell(townId);
            cell.CampImprovementLevel.Should().Be(33);
            cell.CampImprovementDay.Should().Be(Day);
            // Pas un relevé du contenu de la case : sa fraîcheur ne bouge pas
            cell.IdLastUpdateInfo.Should().BeNull();
        }

        [Fact]
        public async Task NiveauConstate_RemplaceLeNiveauConnu()
        {
            var (townId, userId) = SeedTown(50, Day);

            var response = await AttackTestSupport.CreateClientFor(_factory, userId)
                .PostAsync($"/Map/Cell/CampImprovement?townId={townId}", Json($"{{\"x\":{CellX},\"y\":{CellY},\"improvements\":1,\"defenseObjects\":0,\"level\":12}}"));

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            StoredCell(townId).CampImprovementLevel.Should().Be(17);
        }

        [Fact]
        public async Task SaisieInvalide_OuCaseDeLaVille_Refusee()
        {
            var (townId, userId) = SeedTown(null, null);
            var client = AttackTestSupport.CreateClientFor(_factory, userId);

            var withoutTown = await client.PostAsync("/Map/Cell/CampImprovement", Json($"{{\"x\":{CellX},\"y\":{CellY}}}"));
            withoutTown.StatusCode.Should().Be(HttpStatusCode.BadRequest);

            var negativeLevel = await client.PostAsync($"/Map/Cell/CampImprovement?townId={townId}", Json($"{{\"x\":{CellX},\"y\":{CellY},\"level\":-1}}"));
            negativeLevel.StatusCode.Should().Be(HttpStatusCode.BadRequest);

            var townCell = await client.PostAsync($"/Map/Cell/CampImprovement?townId={townId}", Json($"{{\"x\":{TownCellX},\"y\":{TownCellY},\"improvements\":1}}"));
            townCell.IsSuccessStatusCode.Should().BeFalse();

            StoredCell(townId).CampImprovementLevel.Should().BeNull();
        }

        [Fact]
        public async Task SansJeton_Renvoie401()
        {
            var (townId, _) = SeedTown(null, null);

            var response = await _factory.CreateClient()
                .PostAsync($"/Map/Cell/CampImprovement?townId={townId}", Json($"{{\"x\":{CellX},\"y\":{CellY},\"improvements\":1}}"));

            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
}
