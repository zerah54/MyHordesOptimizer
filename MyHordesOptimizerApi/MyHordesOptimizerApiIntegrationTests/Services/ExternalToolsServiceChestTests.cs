using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ExternalToolsServiceChestTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsServiceChestTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

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
        public void UpdateCitizenChest_PremierAppel_CreeLeCoffreEtSesItems()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();

            service.UpdateCitizenChest(townId, userId, new List<UpdateObjectDto>
            {
                new UpdateObjectDto { Id = item.IdItem, Count = 2, IsBroken = false }
            });

            var reloadedScope = _factory.Services.CreateScope();
            var reloadedContext = reloadedScope.ServiceProvider.GetRequiredService<MhoContext>();
            var citizen = reloadedContext.TownCitizens
                .Include(c => c.IdChestNavigation)
                .ThenInclude(c => c.ChestItems)
                .Single(c => c.IdTown == townId && c.IdUser == userId);

            citizen.IdChestNavigation.Should().NotBeNull();
            citizen.IdChestNavigation!.ChestItems.Should().ContainSingle(ci => ci.IdItem == item.IdItem && ci.Count == 2);
        }

        [Fact]
        public void UpdateCitizenChest_DeuxiemeAppel_RemplaceLeContenuPrecedent()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var items = context.Items.Take(2).ToList();
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();

            service.UpdateCitizenChest(townId, userId, new List<UpdateObjectDto>
            {
                new UpdateObjectDto { Id = items[0].IdItem, Count = 1, IsBroken = false }
            });
            service.UpdateCitizenChest(townId, userId, new List<UpdateObjectDto>
            {
                new UpdateObjectDto { Id = items[1].IdItem, Count = 5, IsBroken = true }
            });

            var reloadedScope = _factory.Services.CreateScope();
            var reloadedContext = reloadedScope.ServiceProvider.GetRequiredService<MhoContext>();
            var citizen = reloadedContext.TownCitizens
                .Include(c => c.IdChestNavigation)
                .ThenInclude(c => c.ChestItems)
                .Single(c => c.IdTown == townId && c.IdUser == userId);

            citizen.IdChestNavigation!.ChestItems.Should().ContainSingle();
            citizen.IdChestNavigation.ChestItems.Single().IdItem.Should().Be(items[1].IdItem);
        }

        [Fact]
        public void UpdateCitizenChest_DeuxiemeAppel_RemplaceLeCompteDuMemeItem()
        {
            // Même IdItem aux deux appels : c'est le chemin dominant en production (l'addon
            // resynchronise un coffre quasi identique à chaque page maison), contrairement au
            // test ci-dessus qui n'exerce que le cas d'un item totalement différent.
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();

            service.UpdateCitizenChest(townId, userId, new List<UpdateObjectDto>
            {
                new UpdateObjectDto { Id = item.IdItem, Count = 1, IsBroken = false }
            });
            service.UpdateCitizenChest(townId, userId, new List<UpdateObjectDto>
            {
                new UpdateObjectDto { Id = item.IdItem, Count = 5, IsBroken = false }
            });

            var reloadedScope = _factory.Services.CreateScope();
            var reloadedContext = reloadedScope.ServiceProvider.GetRequiredService<MhoContext>();
            var citizen = reloadedContext.TownCitizens
                .Include(c => c.IdChestNavigation)
                .ThenInclude(c => c.ChestItems)
                .Single(c => c.IdTown == townId && c.IdUser == userId);

            citizen.IdChestNavigation!.ChestItems.Should().ContainSingle();
            citizen.IdChestNavigation.ChestItems.Single().IdItem.Should().Be(item.IdItem);
            citizen.IdChestNavigation.ChestItems.Single().Count.Should().Be(5);
        }

        [Fact]
        public async System.Threading.Tasks.Task UpdateExternalsTools_AvecChestActive_RemplaceLeContenuDuCoffre()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();
            var userInfoProvider = scope.ServiceProvider.GetRequiredService<IUserInfoProvider>();
            userInfoProvider.UserId = userId;

            MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.UpdateRequestDto BuildRequest(int count) => new MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.UpdateRequestDto
            {
                Map = new MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map.UpdateRequestMapDto
                {
                    ToolsToUpdate = new MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map.UpdateRequestMapToolsToUpdateDetailsDto
                    {
                        IsMyHordesOptimizer = "none",
                        IsGestHordes = "none",
                        IsFataMorgana = "none",
                        IsBigBrothHordes = "none"
                    }
                },
                TownDetails = new MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.UpdateTownDetailsDto { TownId = townId },
                Chest = new MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Chest.UpdateChestDto
                {
                    Contents = new List<UpdateObjectDto> { new UpdateObjectDto { Id = item.IdItem, Count = count, IsBroken = false } },
                    ToolsToUpdate = new MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.UpdateRequestToolsToUpdateDetailsDto { IsMyHordesOptimizer = true }
                }
            };

            await service.UpdateExternalsTools(BuildRequest(1));
            // Même IdItem que le premier appel : chemin dominant en production (resynchronisation
            // quasi identique à chaque page maison), pas un item différent.
            await service.UpdateExternalsTools(BuildRequest(5));

            var reloadedScope = _factory.Services.CreateScope();
            var reloadedContext = reloadedScope.ServiceProvider.GetRequiredService<MhoContext>();
            var citizen = reloadedContext.TownCitizens
                .Include(c => c.IdChestNavigation)
                .ThenInclude(c => c.ChestItems)
                .Single(c => c.IdTown == townId && c.IdUser == userId);

            citizen.IdChestNavigation.Should().NotBeNull();
            citizen.IdChestNavigation!.ChestItems.Should().ContainSingle(ci => ci.IdItem == item.IdItem);
            citizen.IdChestNavigation.ChestItems.Single().Count.Should().Be(5);
        }
    }
}
