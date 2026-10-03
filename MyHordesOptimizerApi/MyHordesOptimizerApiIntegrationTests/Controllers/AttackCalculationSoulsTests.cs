using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Estimations;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    /// <summary>Les âmes saisies pour la ville s'appliquent au calcul d'attaque, quel que soit l'appelant (site, addon, bot).</summary>
    public class AttackCalculationSoulsTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public AttackCalculationSoulsTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task AttackCalculation_SansParametre_UtiliseLesAmesEnBase()
        {
            int townId;
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                (townId, _, _, _) = AttackTestSupport.SeedTown(context, 16);
                context.TownEstimations.Add(new TownEstimation { IdTown = townId, Day = 16, IsPlanif = false, _100min = 3531, _100max = 3804, Souls = "{\"100\":1}" });
                context.TownEstimations.Add(new TownEstimation { IdTown = townId, Day = 16, IsPlanif = true });
                context.TownAttackSettings.Add(new TownAttackSetting { IdTown = townId, Day = 16, Souls = 1 });
                context.SaveChanges();
            }

            var json = await _factory.CreateClient().GetStringAsync($"/AttaqueEstimation/attackCalculation?day=16&townId={townId}");
            var result = JsonSerializer.Deserialize<EstimationResultDto>(json, JsonOptions)!;

            var expected = MyHordesOptimizerEstimationService.ComputeAttack(
                new EstimationsDto { _100 = new EstimationValueDto { Min = 3531, Max = 3804 } }, null, 16, AttackDifficulty.Normal, null,
                new SoulsScenario(1, new Dictionary<int, int> { [100] = 1 }, new Dictionary<int, int>()));
            result.Result.Min.Should().Be(expected.Result.Min);
            result.Result.Max.Should().Be(expected.Result.Max);
        }
    }
}
