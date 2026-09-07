using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// SaveCitizenOrdersAsync/SavePartOrdersAsync faisaient un SaveChanges par commande ajoutée/mise à jour
    /// (N+1) ; CopyExpeditionsAsync faisait un SaveChanges par expédition copiée. Ces tests figent le
    /// résultat fonctionnel (ajout + mise à jour + suppression en un seul appel) après passage au
    /// chargement groupé / SaveChanges unique.
    /// </summary>
    public class ExpeditionServiceOrdersTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExpeditionServiceOrdersTests(MyHordesOptimizerApplicationFactory factory)
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

        private async Task<int> NewPart(int townId, int expeditionDay)
        {
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, expeditionDay);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            return part.Id!.Value;
        }

        private async Task<int> NewCitizen(int townId, int expeditionDay)
        {
            var partId = await NewPart(townId, expeditionDay);
            var citizen = await NewService().SaveExpeditionCitizenAsync(partId, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            return citizen.Id!.Value;
        }

        [Fact]
        public async Task SaveCitizenOrdersAsync_AjoutMiseAJourEtSuppressionEnUnAppel_RefleteLEtatFinalEnBase()
        {
            var townId = NewTown(day: 5);
            var citizenId = await NewCitizen(townId, expeditionDay: 5);

            var initial = await NewService().SaveCitizenOrdersAsync(citizenId, new List<ExpeditionOrderDto>
            {
                new ExpeditionOrderDto { Text = "garder" },
                new ExpeditionOrderDto { Text = "a-supprimer" }
            });
            var toKeep = initial.Single(o => o.Text == "garder");

            var result = await NewService().SaveCitizenOrdersAsync(citizenId, new List<ExpeditionOrderDto>
            {
                new ExpeditionOrderDto { Id = toKeep.Id, Text = "garder-modifie" },
                new ExpeditionOrderDto { Text = "nouveau" }
            });

            result.Select(o => o.Text).Should().BeEquivalentTo(new[] { "garder-modifie", "nouveau" });
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            context.ExpeditionOrders.Where(o => o.IdExpeditionCitizen == citizenId).Select(o => o.IdExpeditionOrder)
                .Should().BeEquivalentTo(result.Select(o => o.Id!.Value));
        }

        [Fact]
        public async Task SavePartOrdersAsync_AjoutMiseAJourEtSuppressionEnUnAppel_RefleteLEtatFinalEnBase()
        {
            var townId = NewTown(day: 5);
            var partId = await NewPart(townId, expeditionDay: 5);

            var initial = await NewService().SavePartOrdersAsync(partId, new List<ExpeditionOrderDto>
            {
                new ExpeditionOrderDto { Text = "garder" },
                new ExpeditionOrderDto { Text = "a-supprimer" }
            });
            var toKeep = initial.Single(o => o.Text == "garder");

            var result = await NewService().SavePartOrdersAsync(partId, new List<ExpeditionOrderDto>
            {
                new ExpeditionOrderDto { Id = toKeep.Id, Text = "garder-modifie" },
                new ExpeditionOrderDto { Text = "nouveau" }
            });

            result.Select(o => o.Text).Should().BeEquivalentTo(new[] { "garder-modifie", "nouveau" });
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var partFromDb = context.ExpeditionParts.Include(p => p.IdExpeditionOrders).Single(p => p.IdExpeditionPart == partId);
            partFromDb.IdExpeditionOrders.Select(o => o.IdExpeditionOrder).Should().BeEquivalentTo(result.Select(o => o.Id!.Value));
        }

        [Fact]
        public async Task CopyExpeditionsAsync_PlusieursExpeditionsLeMemeJour_CopieToutesEnUnAppel()
        {
            var townId = NewTown(day: 5);
            await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);
            await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);

            var result = await NewService().CopyExpeditionsAsync(townId, fromDay: 5, targetDay: 6);

            result.Should().HaveCount(2);
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            context.Expeditions.Count(e => e.IdTown == townId && e.Day == 6).Should().Be(2);
        }
    }
}
