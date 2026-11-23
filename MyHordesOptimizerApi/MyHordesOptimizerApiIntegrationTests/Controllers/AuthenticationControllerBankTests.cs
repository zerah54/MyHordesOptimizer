using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Bank;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Fakes;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    public class AuthenticationControllerBankTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Season = 50;
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public AuthenticationControllerBankTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task GetToken_VilleConnueAvecBanque_EnregistreLaBanqueRecue()
        {
            var random = new Random();
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            int mapId, userId, cadaverId;
            Item item;
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                do
                {
                    mapId = random.Next(1, PreTownIds.Offset);
                    userId = random.Next(1, int.MaxValue);
                    cadaverId = random.Next(1, int.MaxValue);
                }
                while (userId == cadaverId
                       || context.Towns.Any(t => t.MapId == mapId || t.IdTown == -mapId || t.IdTown == mapId)
                       || context.Users.Any(u => u.IdUser == userId || u.IdUser == cadaverId));

                item = context.Items.First(i => i.Uid != null);
                context.Towns.Add(new Town { IdTown = -mapId, MapId = mapId, Season = Season, Day = 1, Width = 5, Height = 5, X = 2, Y = 2, Name = "test-town-" + suffix, IsFinished = false });
                var previousUpdate = context.LastUpdateInfos.Add(new LastUpdateInfo { DateUpdate = DateTime.UtcNow }).Entity;
                context.SaveChanges();
                TownBankHistory.Record(context, -mapId, 1, previousUpdate.IdLastUpdateInfo,
                    new List<TownBankItem> { new() { IdItem = item.IdItem, Count = 1, IsBroken = false } });
                context.SaveChanges();
            }

            var bankItem = new MyHordesItem { Uuid = item.Uid, Id = item.MhId ?? item.IdItem, Count = 3, Broken = false };
            using var factory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IMyHordesApiRepository>(sp =>
                        new NewTownMyHordesApiRepository(mapId, userId, "test-user-" + suffix, cadaverId, bankItem, Season, sp.GetRequiredService<IUserInfoProvider>()));
                });
            });

            var response = await factory.CreateClient().GetAsync($"/Authentication/Token?userKey=key-{suffix}");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            using var verifyScope = _factory.Services.CreateScope();
            var verify = verifyScope.ServiceProvider.GetRequiredService<MhoContext>();
            var snapshotId = TownBankHistory.LatestSnapshotId(verify, -mapId);
            verify.TownBankItems.Where(i => i.IdTown == -mapId && i.IdLastUpdateInfo == snapshotId)
                .Select(i => new { i.IdItem, i.Count })
                .ToList()
                .Should().ContainSingle()
                .Which.Should().Be(new { IdItem = item.IdItem, Count = (int?)3 });
        }
    }
}
