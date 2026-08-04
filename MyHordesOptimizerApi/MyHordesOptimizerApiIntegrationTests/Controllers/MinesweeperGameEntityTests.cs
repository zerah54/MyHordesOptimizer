using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using System;
using System.Threading.Tasks;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    public class MinesweeperGameEntityTests : ControllerTestBase
    {
        public MinesweeperGameEntityTests(MyHordesOptimizerApplicationFactory factory) : base(factory)
        {
        }

        public override Task InitializeAsync() => Task.CompletedTask;
        public override Task DisposeAsync() => Task.CompletedTask;

        [Fact]
        public async Task InsertAndReadBack_RoundTripsAllFields()
        {
            using var scope = Factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();

            var game = new MinesweeperGame
            {
                IdUser = null,
                SizeId = "small",
                Width = 9,
                Height = 9,
                MineCount = 10,
                Mode = "daily",
                // Une vraie date ici (pas null) : c'est le seul nouveau type de colonne du schéma
                // (DateOnly ↔ MySQL DATE via Pomelo), elle doit être exercée par ce test round-trip.
                ChallengeDate = new DateOnly(2026, 8, 3),
                Seed = 123456789L,
                FirstClickX = 4,
                FirstClickY = 4,
                CreatedAt = DateTime.UtcNow,
                StartedAt = DateTime.UtcNow,
                Status = "in_progress"
            };

            dbContext.MinesweeperGames.Add(game);
            await dbContext.SaveChangesAsync();

            var reloaded = await dbContext.MinesweeperGames
                .AsNoTracking()
                .FirstAsync(g => g.IdMinesweeperGame == game.IdMinesweeperGame);

            Assert.Equal("small", reloaded.SizeId);
            Assert.Equal(9, reloaded.Width);
            Assert.Equal(10, reloaded.MineCount);
            Assert.Equal("daily", reloaded.Mode);
            Assert.Equal(new DateOnly(2026, 8, 3), reloaded.ChallengeDate);
            Assert.Equal(123456789L, reloaded.Seed);
            Assert.Null(reloaded.IdUser);
            Assert.Equal("in_progress", reloaded.Status);
        }
    }
}
