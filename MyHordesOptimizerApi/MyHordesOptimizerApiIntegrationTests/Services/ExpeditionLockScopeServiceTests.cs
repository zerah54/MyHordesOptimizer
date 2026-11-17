using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Expeditions;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ExpeditionLockScopeServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExpeditionLockScopeServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private IExpeditionService NewService()
        {
            return _factory.Services.CreateScope().ServiceProvider.GetRequiredService<IExpeditionService>();
        }

        private IExpeditionLockScopeService NewScope()
        {
            return _factory.Services.CreateScope().ServiceProvider.GetRequiredService<IExpeditionLockScopeService>();
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

        private async Task<(int Expedition, int Part, int Citizen)> NewTree(int townId, int day)
        {
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, day);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            var citizen = await NewService().SaveExpeditionCitizenAsync(part.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            return (expedition.Id!.Value, part.Id!.Value, citizen.Id!.Value);
        }

        private static ExpeditionLockRef R(ExpeditionLockKind kind, int id) => new ExpeditionLockRef(kind, id);

        [Fact]
        public async Task WithDescendantsOfExpeditionAsync_RenvoieExpeditionPartiesCitoyensEtConsignes()
        {
            var (e, p, c) = await NewTree(NewTown(5), 5);

            var result = await NewScope().WithDescendantsOfExpeditionAsync(e);

            result.Should().Contain(new[]
            {
                R(ExpeditionLockKind.Expedition, e), R(ExpeditionLockKind.Part, p), R(ExpeditionLockKind.PartOrders, p),
                R(ExpeditionLockKind.Citizen, c), R(ExpeditionLockKind.Bag, c), R(ExpeditionLockKind.CitizenOrders, c)
            });
        }

        [Fact]
        public async Task OwnersOfOrderAsync_ConsigneDeCitoyen_RenvoieCitizenOrders()
        {
            var (_, _, c) = await NewTree(NewTown(5), 5);
            var orders = await NewService().SaveCitizenOrdersAsync(c, new List<ExpeditionOrderDto> { new ExpeditionOrderDto { Text = "x" } });

            var result = await NewScope().OwnersOfOrderAsync(orders.Single().Id!.Value);

            result.Should().BeEquivalentTo(new[] { R(ExpeditionLockKind.CitizenOrders, c) });
        }

        [Fact]
        public async Task OwnersOfOrderAsync_ConsigneDePartie_RenvoiePartOrders()
        {
            var (_, p, _) = await NewTree(NewTown(5), 5);
            var orders = await NewService().SavePartOrdersAsync(p, new List<ExpeditionOrderDto> { new ExpeditionOrderDto { Text = "x" } });

            var result = await NewScope().OwnersOfOrderAsync(orders.Single().Id!.Value);

            result.Should().BeEquivalentTo(new[] { R(ExpeditionLockKind.PartOrders, p) });
        }

        [Fact]
        public async Task OwnersOfBagAsync_RenvoieLeCitoyen()
        {
            var (_, _, c) = await NewTree(NewTown(5), 5);
            int bagId;
            using (var scope = _factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                var bag = new ExpeditionBag();
                context.ExpeditionBags.Add(bag);
                context.SaveChanges();
                context.ExpeditionCitizens.Single(x => x.IdExpeditionCitizen == c).IdExpeditionBag = bag.IdExpeditionBag;
                context.SaveChanges();
                bagId = bag.IdExpeditionBag;
            }

            var result = await NewScope().OwnersOfBagAsync(bagId);

            result.Should().BeEquivalentTo(new[] { R(ExpeditionLockKind.Bag, c) });
        }

        [Fact]
        public async Task OfDayAsync_IgnoreLesAutresJours()
        {
            var townId = NewTown(5);
            var (e5, _, _) = await NewTree(townId, 5);
            var (e6, _, _) = await NewTree(townId, 6);

            var result = await NewScope().OfDayAsync(townId, 5);

            result.Should().Contain(R(ExpeditionLockKind.Expedition, e5));
            result.Should().NotContain(R(ExpeditionLockKind.Expedition, e6));
        }
    }
}
