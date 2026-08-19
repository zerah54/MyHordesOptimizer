using System;
using System.Linq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ChestStorageTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ChestStorageTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        /// <summary>TownCitizen.IdLastUpdateInfo est NOT NULL : requiert une ligne existante.</summary>
        private static (int townId, int userId) SeedTownAndCitizen(MhoContext context)
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var townId = random.Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = townId, Name = "test-town-" + suffix, MapId = townId });
            var userId = random.Next(1, int.MaxValue);
            context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
            context.SaveChanges();

            var lastUpdateInfo = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdateInfo);
            context.SaveChanges();
            context.TownCitizens.Add(new TownCitizen { IdTown = townId, IdUser = userId, IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo });
            context.SaveChanges();

            return (townId, userId);
        }

        [Fact]
        public void Chest_AttacheAUnCitizenAvecDesItems_SePersisteEtSeRecharge()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();

            var chest = context.Chests.Add(new Chest()).Entity;
            context.SaveChanges();
            context.ChestItems.Add(new ChestItem { IdChest = chest.IdChest, IdItem = item.IdItem, IsBroken = false, Count = 3 });
            context.SaveChanges();

            var citizen = context.TownCitizens.Single(c => c.IdTown == townId && c.IdUser == userId);
            citizen.IdChest = chest.IdChest;
            context.SaveChanges();

            var reloadedScope = _factory.Services.CreateScope();
            var reloadedContext = reloadedScope.ServiceProvider.GetRequiredService<MhoContext>();
            var reloaded = reloadedContext.TownCitizens
                .Include(c => c.IdChestNavigation)
                .ThenInclude(c => c.ChestItems)
                .Single(c => c.IdTown == townId && c.IdUser == userId);

            reloaded.IdChestNavigation.Should().NotBeNull();
            reloaded.IdChestNavigation!.ChestItems.Should().ContainSingle(ci => ci.IdItem == item.IdItem && ci.Count == 3);
        }
    }
}
