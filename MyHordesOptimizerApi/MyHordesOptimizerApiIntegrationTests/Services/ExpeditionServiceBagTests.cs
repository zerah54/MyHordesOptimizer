using System;
using System.Collections.Generic;
using System.Linq;
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
    public class ExpeditionServiceBagTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExpeditionServiceBagTests(MyHordesOptimizerApplicationFactory factory)
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
        public async Task UpdateExpeditionBag_MiseAJourDUnSacExistant_RenvoieLaPartieDuCitoyen()
        {
            var townId = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            var citizen = await NewService().SaveExpeditionCitizenAsync(part.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            var created = NewService().UpdateExpeditionBag(citizen.Id!.Value, new ExpeditionBagRequestDto { Items = new List<ExpeditionBagItemRequestDto>() });

            var updated = NewService().UpdateExpeditionBag(citizen.Id!.Value, new ExpeditionBagRequestDto { Id = created.Id, Items = new List<ExpeditionBagItemRequestDto>() });

            updated.ExpeditionsPartId.Should().Contain(part.Id!.Value);
        }

        [Fact]
        public async Task DeleteExpeditionBag_LeCitoyenSurvit()
        {
            var townId = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            var citizen = await NewService().SaveExpeditionCitizenAsync(part.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            var bag = NewService().UpdateExpeditionBag(citizen.Id!.Value, new ExpeditionBagRequestDto { Items = new List<ExpeditionBagItemRequestDto>() });

            NewService().DeleteExpeditionBag(bag.Id!.Value);

            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            context.ExpeditionCitizens.Should().Contain(c => c.IdExpeditionCitizen == citizen.Id!.Value);
        }

        [Fact]
        public async Task DeleteExpeditionBag_CreeUnSacDeRemplacementCoteServeur()
        {
            var townId = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            var citizen = await NewService().SaveExpeditionCitizenAsync(part.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            var bag = NewService().UpdateExpeditionBag(citizen.Id!.Value, new ExpeditionBagRequestDto { Items = new List<ExpeditionBagItemRequestDto>() });

            var replacementBags = NewService().DeleteExpeditionBag(bag.Id!.Value);

            replacementBags.Should().ContainSingle();
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var citizenFromDb = context.ExpeditionCitizens.Single(c => c.IdExpeditionCitizen == citizen.Id!.Value);
            citizenFromDb.IdExpeditionBag.Should().NotBeNull().And.NotBe(bag.Id!.Value);
        }
    }
}
