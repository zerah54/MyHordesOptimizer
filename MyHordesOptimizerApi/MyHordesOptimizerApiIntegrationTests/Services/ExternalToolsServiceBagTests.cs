using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ExternalToolsServiceBagTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExternalToolsServiceBagTests(MyHordesOptimizerApplicationFactory factory)
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
        public void UpdateCitizenBag_ObjetInconnu_IgnoreLObjetEtConserveLesAutres()
        {
            // Reproduit l'incident du 2026-09-10 : l'addon envoie un IdItem absent du
            // référentiel local (icône non résolue côté client, escorté notamment). Avant ce
            // test, ça faisait planter tout le SaveChanges sur une violation de clé étrangère.
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var knownItem = context.Items.First();
            var unknownItemId = context.Items.Max(i => i.IdItem) + 1;
            var service = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();

            service.UpdateCitizenBag(townId, userId, new List<UpdateObjectDto>
            {
                new UpdateObjectDto { Id = knownItem.IdItem, Count = 3, IsBroken = false },
                new UpdateObjectDto { Id = unknownItemId, Count = 1, IsBroken = false }
            });

            var reloadedScope = _factory.Services.CreateScope();
            var reloadedContext = reloadedScope.ServiceProvider.GetRequiredService<MhoContext>();
            var citizen = reloadedContext.TownCitizens
                .Include(c => c.IdBagNavigation)
                .ThenInclude(b => b.BagItems)
                .Single(c => c.IdTown == townId && c.IdUser == userId);

            citizen.IdBagNavigation!.BagItems.Should().ContainSingle(bi => bi.IdItem == knownItem.IdItem && bi.Count == 3);
        }
    }
}
