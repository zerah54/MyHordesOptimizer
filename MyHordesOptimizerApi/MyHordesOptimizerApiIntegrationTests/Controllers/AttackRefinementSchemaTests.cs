using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    public class AttackRefinementSchemaTests : ControllerTestBase
    {
        public AttackRefinementSchemaTests(MyHordesOptimizerApplicationFactory factory) : base(factory)
        {
        }

        public override Task InitializeAsync() => Task.CompletedTask;
        public override Task DisposeAsync() => Task.CompletedTask;

        [Fact]
        public async Task AmesReglagesEtAffinage_AllerRetour()
        {
            using var scope = Factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var townId = new Random().Next(1, int.MaxValue);
            dbContext.Towns.Add(new Town { IdTown = townId, MapId = townId, Name = "test-town-" + townId, Width = 40, Height = 40, Day = 5 });
            await dbContext.SaveChangesAsync();

            dbContext.TownEstimations.Add(new TownEstimation { IdTown = townId, Day = 5, IsPlanif = false, Souls = "{\"33\":2}", SpaLevel = 2 });
            dbContext.TownAttackSettings.Add(new TownAttackSetting { IdTown = townId, Day = 5, Souls = 3, SpaLevel = 1, Fireworks = true });
            dbContext.TownAttackRefinements.Add(new TownAttackRefinement
            {
                IdTown = townId, Day = 5, Input = "{}", Candidates = new byte[] { 1, 2, 3, 4, 5, 6 }, CandidateCount = 1,
                Status = "Valid", Stale = true, ValueMin = 3700, ValueMax = 3790, ComputedAt = DateTime.UtcNow
            });
            await dbContext.SaveChangesAsync();

            var estimation = await dbContext.TownEstimations.AsNoTracking().SingleAsync(e => e.IdTown == townId && e.Day == 5 && !e.IsPlanif);
            estimation.Souls.Should().Be("{\"33\":2}");
            estimation.SpaLevel.Should().Be(2);
            var setting = await dbContext.TownAttackSettings.AsNoTracking().SingleAsync(s => s.IdTown == townId && s.Day == 5);
            setting.Fireworks.Should().BeTrue();
            setting.Souls.Should().Be(3);
            var refinement = await dbContext.TownAttackRefinements.AsNoTracking().SingleAsync(r => r.IdTown == townId && r.Day == 5);
            refinement.Candidates.Should().Equal(1, 2, 3, 4, 5, 6);
            refinement.Stale.Should().BeTrue();
            refinement.ValueMax.Should().Be(3790);
        }
    }
}
