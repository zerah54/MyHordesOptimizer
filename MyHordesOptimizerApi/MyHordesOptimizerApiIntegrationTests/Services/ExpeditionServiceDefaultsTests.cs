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
    /// <summary>
    /// La création d'une partie par défaut (sur une nouvelle expédition) et d'un membre par défaut (sur la
    /// première partie d'une expédition) vivait côté front, dans les handlers d'abonnement temps réel. Comme
    /// chaque client connecté à la ville reçoit le même événement et réagit indépendamment, une expédition
    /// créée pendant que 2 joueurs regardent la même ville se retrouvait avec des parties/membres en double.
    /// Déplacé côté serveur pour n'être exécuté qu'une fois, quel que soit le nombre de viewers connectés.
    /// </summary>
    public class ExpeditionServiceDefaultsTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExpeditionServiceDefaultsTests(MyHordesOptimizerApplicationFactory factory)
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
        public async Task SaveExpeditionAsync_Creation_CreeUnePartieParDefaut()
        {
            var townId = NewTown(day: 5);

            var result = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);

            result.Parts.Should().ContainSingle();
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_PremierePartie_CreeUnMembreParDefaut()
        {
            var townId = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);
            var defaultPartId = expedition.Parts.Single().Id!.Value;
            NewService().DeleteExpeditionPart(defaultPartId);

            var result = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });

            result.Citizens.Should().ContainSingle();
        }
    }
}
