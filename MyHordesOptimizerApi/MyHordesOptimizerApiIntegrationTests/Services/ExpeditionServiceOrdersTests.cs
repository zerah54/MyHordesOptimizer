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
using MyHordesOptimizerApi.Exceptions;
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

        private async Task<(int ExpeditionId, int PartId)> NewExpedition(int townId, int day, string? label = null)
        {
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { Label = label, PartsId = new List<int>() }, townId, day);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            return (expedition.Id!.Value, part.Id!.Value);
        }

        private static List<ExpeditionOrderDto> WaitFor(int expeditionId)
        {
            return new List<ExpeditionOrderDto> { new ExpeditionOrderDto { Kind = "wait", TargetExpeditionId = expeditionId, Note = "avancer ensemble" } };
        }

        [Fact]
        public async Task SavePartOrdersAsync_AttendreUneAutreExpeditionDuJour_Enregistre()
        {
            var townId = NewTown(day: 5);
            var waited = await NewExpedition(townId, 5);
            var waiting = await NewExpedition(townId, 5);

            var result = await NewService().SavePartOrdersAsync(waiting.PartId, WaitFor(waited.ExpeditionId));

            result.Single().TargetExpeditionId.Should().Be(waited.ExpeditionId);
            result.Single().Note.Should().Be("avancer ensemble");
        }

        [Fact]
        public async Task SavePartOrdersAsync_AttendreSaPropreExpedition_Refuse()
        {
            var townId = NewTown(day: 5);
            var own = await NewExpedition(townId, 5);

            await FluentActions.Awaiting(() => NewService().SavePartOrdersAsync(own.PartId, WaitFor(own.ExpeditionId)))
                .Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SavePartOrdersAsync_AttendreUneExpeditionDUnAutreJour_Refuse()
        {
            var townId = NewTown(day: 5);
            var nextDay = await NewExpedition(townId, 6);
            var waiting = await NewExpedition(townId, 5);

            await FluentActions.Awaiting(() => NewService().SavePartOrdersAsync(waiting.PartId, WaitFor(nextDay.ExpeditionId)))
                .Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SaveCitizenOrdersAsync_AttendreSaPropreExpedition_Refuse()
        {
            var townId = NewTown(day: 5);
            var own = await NewExpedition(townId, 5);
            var citizen = await NewService().SaveExpeditionCitizenAsync(own.PartId, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });

            await FluentActions.Awaiting(() => NewService().SaveCitizenOrdersAsync(citizen.Id!.Value, WaitFor(own.ExpeditionId)))
                .Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task CopyExpeditionsAsync_AttendreUneExpedition_ViseSaCopie()
        {
            var townId = NewTown(day: 5);
            var waited = await NewExpedition(townId, 5, label: "attendue");
            var waiting = await NewExpedition(townId, 5, label: "qui-attend");
            var citizen = await NewService().SaveExpeditionCitizenAsync(waiting.PartId, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            await NewService().SavePartOrdersAsync(waiting.PartId, WaitFor(waited.ExpeditionId));
            await NewService().SaveCitizenOrdersAsync(citizen.Id!.Value, WaitFor(waited.ExpeditionId));

            await NewService().CopyExpeditionsAsync(townId, fromDay: 5, targetDay: 6);

            var context = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var waitedCopy = context.Expeditions.Single(e => e.IdTown == townId && e.Day == 6 && e.Label == "attendue");
            var copiedOrders = context.ExpeditionOrders
                .Where(o => o.IdExpeditionParts.Any(p => p.IdExpeditionNavigation!.IdTown == townId && p.IdExpeditionNavigation.Day == 6)
                    || o.IdExpeditionCitizenNavigation!.IdExpeditionPartNavigation!.IdExpeditionNavigation!.IdTown == townId
                        && o.IdExpeditionCitizenNavigation.IdExpeditionPartNavigation.IdExpeditionNavigation.Day == 6)
                .ToList();
            copiedOrders.Should().HaveCount(2);
            copiedOrders.Should().OnlyContain(o => o.IdTargetExpedition == waitedCopy.IdExpedition && o.Note == "avancer ensemble");
        }

        [Fact]
        public async Task GetUserExpeditionsByDay_AttendreUneExpedition_RenvoieSonNom()
        {
            var townId = NewTown(day: 5);
            var userId = new Random().Next(1, int.MaxValue);
            var context = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            context.Users.Add(new User { IdUser = userId, Name = "test-user-" + Guid.NewGuid().ToString("N").Substring(0, 8) });
            context.SaveChanges();
            var waited = await NewExpedition(townId, 5, label: "Expé Z");
            var waiting = await NewExpedition(townId, 5);
            await NewService().SaveExpeditionCitizenAsync(waiting.PartId, new ExpeditionCitizenRequestDto { IdUser = userId, OrdersId = new List<int>() });
            await NewService().SavePartOrdersAsync(waiting.PartId, WaitFor(waited.ExpeditionId));

            var expeditions = NewService().GetUserExpeditionsByDay(townId, userId, 5);

            var order = expeditions.Single().Parts!.SelectMany(part => part.Orders ?? new List<ExpeditionOrderDto>()).Single();
            order.TargetExpeditionLabel.Should().Be("Expé Z");
        }
    }
}
