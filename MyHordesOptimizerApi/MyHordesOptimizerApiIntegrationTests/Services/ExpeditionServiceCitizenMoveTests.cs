using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ExpeditionServiceCitizenMoveTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExpeditionServiceCitizenMoveTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private IExpeditionService NewService()
        {
            return _factory.Services.CreateScope().ServiceProvider.GetRequiredService<IExpeditionService>();
        }

        private int NewTown(int day)
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var town_id = new Random().Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = town_id, Name = "test-town-" + suffix, MapId = town_id, Day = day });
            context.SaveChanges();
            return town_id;
        }

        [Fact]
        public async Task SaveExpeditionCitizenAsync_MiseAJourAvecUneAutrePartie_DeplaceLeCitoyen()
        {
            var townId = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);
            var partA = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            var partB = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            var citizen = await NewService().SaveExpeditionCitizenAsync(partA.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });

            var moved = await NewService().SaveExpeditionCitizenAsync(partB.Id!.Value, new ExpeditionCitizenRequestDto { Id = citizen.Id, OrdersId = new List<int>() });

            moved.ExpeditionPartId.Should().Be(partB.Id!.Value);
        }
    }
}
