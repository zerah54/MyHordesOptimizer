using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// Écritures d'expédition avec le vrai contrôle d'accès : réservées aux citoyens de la ville (vivants ou
    /// morts), et aucun identifiant d'une autre ville ne peut être modifié ni rattaché.
    /// </summary>
    public class ExpeditionServiceAccessTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;

        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExpeditionServiceAccessTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private sealed record SeededTown(int TownId, int AliveUserId, int DeadUserId, int OutsiderUserId);

        private sealed record SeededExpedition(int ExpeditionId, int PartId, int CitizenId);

        /// <summary>Un scope par appel : MhoContext est Transient et capturé à la construction du service.</summary>
        private IExpeditionService NewService(int userId, int? tokenMapId)
        {
            var provider = _factory.Services.CreateScope().ServiceProvider;
            var userInfo = provider.GetRequiredService<IUserInfoProvider>();
            userInfo.UserId = userId;
            userInfo.TownDetail = tokenMapId.HasValue ? new SimpleMeTownDetailDto { TownId = tokenMapId.Value } : null;
            return new ExpeditionService(
                provider.GetRequiredService<IServiceScopeFactory>(),
                provider.GetRequiredService<IMapper>(),
                userInfo,
                provider.GetRequiredService<ILogger<ExpeditionService>>(),
                provider.GetRequiredService<MhoContext>(),
                provider.GetRequiredService<TownSyncLock>(),
                new TownAccessService(provider.GetRequiredService<IServiceScopeFactory>(), userInfo));
        }

        private IExpeditionService AsAlive(SeededTown town) => NewService(town.AliveUserId, town.TownId);

        private MhoContext NewContext()
        {
            return _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
        }

        private SeededTown SeedTown()
        {
            var (townId, aliveUserId, deadUserId, outsiderUserId) = AttackTestSupport.SeedTown(NewContext(), Day);
            return new SeededTown(townId, aliveUserId, deadUserId, outsiderUserId);
        }

        private async Task<SeededExpedition> SeedExpedition(SeededTown town)
        {
            var expedition = await AsAlive(town).SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, town.TownId, Day);
            var part = await AsAlive(town).SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            var citizen = await AsAlive(town).SaveExpeditionCitizenAsync(part.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            return new SeededExpedition(expedition.Id!.Value, part.Id!.Value, citizen.Id!.Value);
        }

        [Fact]
        public async Task SaveExpeditionAsync_CitoyenMort_Accepte()
        {
            var town = SeedTown();

            var result = await NewService(town.DeadUserId, tokenMapId: null).SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, town.TownId, Day);

            result.Should().NotBeNull();
        }

        [Fact]
        public async Task SaveExpeditionAsync_Etranger_Refuse()
        {
            var town = SeedTown();

            Func<Task> act = () => NewService(town.OutsiderUserId, tokenMapId: null).SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, town.TownId, Day);

            await act.Should().ThrowAsync<MhoForbiddenException>();
            NewContext().Expeditions.AsNoTracking().Any(expedition => expedition.IdTown == town.TownId).Should().BeFalse();
        }

        [Fact]
        public async Task SaveExpeditionAsync_ExpeditionDUneAutreVille_Refuse()
        {
            var townA = SeedTown();
            var townB = SeedTown();
            var expeditionB = await SeedExpedition(townB);

            Func<Task> act = () => AsAlive(townA).SaveExpeditionAsync(new ExpeditionRequestDto { Id = expeditionB.ExpeditionId, Label = "pirate", PartsId = new List<int>() }, townA.TownId, Day);

            await act.Should().ThrowAsync<MhoForbiddenException>();
            var expeditionFromDb = NewContext().Expeditions.AsNoTracking().Single(expedition => expedition.IdExpedition == expeditionB.ExpeditionId);
            expeditionFromDb.IdTown.Should().Be(townB.TownId);
            expeditionFromDb.Label.Should().NotBe("pirate");
        }

        [Fact]
        public async Task SaveExpeditionAsync_PartieDUneAutreVille_Refuse()
        {
            var townA = SeedTown();
            var townB = SeedTown();
            var expeditionA = await SeedExpedition(townA);
            var expeditionB = await SeedExpedition(townB);

            Func<Task> act = () => AsAlive(townA).SaveExpeditionAsync(new ExpeditionRequestDto { Id = expeditionA.ExpeditionId, PartsId = new List<int> { expeditionA.PartId, expeditionB.PartId } }, townA.TownId, Day);

            await act.Should().ThrowAsync<MhoForbiddenException>();
            NewContext().ExpeditionParts.AsNoTracking().Single(part => part.IdExpeditionPart == expeditionB.PartId).IdExpedition.Should().Be(expeditionB.ExpeditionId);
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_Etranger_Refuse()
        {
            var town = SeedTown();
            var expedition = await SeedExpedition(town);

            Func<Task> act = () => NewService(town.OutsiderUserId, tokenMapId: null).SaveExpeditionPartAsync(expedition.ExpeditionId, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_CitoyenDUneAutreVille_Refuse()
        {
            var townA = SeedTown();
            var townB = SeedTown();
            var expeditionA = await SeedExpedition(townA);
            var expeditionB = await SeedExpedition(townB);

            Func<Task> act = () => AsAlive(townA).SaveExpeditionPartAsync(expeditionA.ExpeditionId, new ExpeditionPartRequestDto { Id = expeditionA.PartId, OrdersId = new List<int>(), CitizensId = new List<int> { expeditionA.CitizenId, expeditionB.CitizenId } });

            await act.Should().ThrowAsync<MhoForbiddenException>();
            NewContext().ExpeditionCitizens.AsNoTracking().Single(citizen => citizen.IdExpeditionCitizen == expeditionB.CitizenId).IdExpeditionPart.Should().Be(expeditionB.PartId);
        }

        [Fact]
        public async Task SaveExpeditionCitizenAsync_DeplacementDepuisUneAutreVille_Refuse()
        {
            var townA = SeedTown();
            var townB = SeedTown();
            var expeditionA = await SeedExpedition(townA);
            var expeditionB = await SeedExpedition(townB);

            Func<Task> act = () => AsAlive(townA).SaveExpeditionCitizenAsync(expeditionA.PartId, new ExpeditionCitizenRequestDto { Id = expeditionB.CitizenId, OrdersId = new List<int>() });

            await act.Should().ThrowAsync<MhoForbiddenException>();
            NewContext().ExpeditionCitizens.AsNoTracking().Single(citizen => citizen.IdExpeditionCitizen == expeditionB.CitizenId).IdExpeditionPart.Should().Be(expeditionB.PartId);
        }

        [Fact]
        public async Task SavePartOrdersAsync_ConsigneDUneAutreVille_Refuse()
        {
            var townA = SeedTown();
            var townB = SeedTown();
            var expeditionA = await SeedExpedition(townA);
            var expeditionB = await SeedExpedition(townB);
            var orderB = (await AsAlive(townB).SavePartOrdersAsync(expeditionB.PartId, new List<ExpeditionOrderDto> { new ExpeditionOrderDto { Text = "consigne-b" } })).Single();

            Func<Task> act = () => AsAlive(townA).SavePartOrdersAsync(expeditionA.PartId, new List<ExpeditionOrderDto> { new ExpeditionOrderDto { Id = orderB.Id, Text = "pirate" } });

            await act.Should().ThrowAsync<MhoForbiddenException>();
            NewContext().ExpeditionOrders.AsNoTracking().Single(order => order.IdExpeditionOrder == orderB.Id).Text.Should().Be("consigne-b");
        }

        [Fact]
        public async Task SaveCitizenOrdersAsync_ConsigneDUneAutreVille_Refuse()
        {
            var townA = SeedTown();
            var townB = SeedTown();
            var expeditionA = await SeedExpedition(townA);
            var expeditionB = await SeedExpedition(townB);
            var orderB = (await AsAlive(townB).SaveCitizenOrdersAsync(expeditionB.CitizenId, new List<ExpeditionOrderDto> { new ExpeditionOrderDto { Text = "consigne-b" } })).Single();

            Func<Task> act = () => AsAlive(townA).SaveCitizenOrdersAsync(expeditionA.CitizenId, new List<ExpeditionOrderDto> { new ExpeditionOrderDto { Id = orderB.Id, Text = "pirate" } });

            await act.Should().ThrowAsync<MhoForbiddenException>();
            var orderFromDb = NewContext().ExpeditionOrders.AsNoTracking().Single(order => order.IdExpeditionOrder == orderB.Id);
            orderFromDb.Text.Should().Be("consigne-b");
            orderFromDb.IdExpeditionCitizen.Should().Be(expeditionB.CitizenId);
        }

        [Fact]
        public async Task UpdateExpeditionOrder_ConsigneDUneAutreVille_Refuse()
        {
            var townA = SeedTown();
            var townB = SeedTown();
            var expeditionB = await SeedExpedition(townB);
            var orderB = (await AsAlive(townB).SavePartOrdersAsync(expeditionB.PartId, new List<ExpeditionOrderDto> { new ExpeditionOrderDto { Text = "consigne-b" } })).Single();

            Action act = () => AsAlive(townA).UpdateExpeditionOrder(new ExpeditionOrderDto { Id = orderB.Id, IsDone = true });

            act.Should().Throw<MhoForbiddenException>();
        }

        [Fact]
        public async Task DeleteExpeditionOrder_ConsigneDUneAutreVille_Refuse()
        {
            var townA = SeedTown();
            var townB = SeedTown();
            var expeditionB = await SeedExpedition(townB);
            var orderB = (await AsAlive(townB).SavePartOrdersAsync(expeditionB.PartId, new List<ExpeditionOrderDto> { new ExpeditionOrderDto { Text = "consigne-b" } })).Single();

            Action act = () => AsAlive(townA).DeleteExpeditionOrder(orderB.Id!.Value);

            act.Should().Throw<MhoForbiddenException>();
            NewContext().ExpeditionOrders.AsNoTracking().Any(order => order.IdExpeditionOrder == orderB.Id).Should().BeTrue();
        }

        [Fact]
        public async Task UpdateExpeditionBag_SacDUneAutreVille_Refuse()
        {
            var townA = SeedTown();
            var townB = SeedTown();
            var expeditionA = await SeedExpedition(townA);
            var expeditionB = await SeedExpedition(townB);
            var bagB = await AsAlive(townB).UpdateExpeditionBag(expeditionB.CitizenId, new ExpeditionBagRequestDto { Items = new List<ExpeditionBagItemRequestDto>() });

            Func<Task> act = () => AsAlive(townA).UpdateExpeditionBag(expeditionA.CitizenId, new ExpeditionBagRequestDto { Id = bagB.Id, Items = new List<ExpeditionBagItemRequestDto>() });

            await act.Should().ThrowAsync<MhoForbiddenException>();
            NewContext().ExpeditionCitizens.AsNoTracking().Single(citizen => citizen.IdExpeditionCitizen == expeditionB.CitizenId).IdExpeditionBag.Should().Be(bagB.Id);
        }

        [Fact]
        public async Task DeleteExpeditionBag_SacDUneAutreVille_Refuse()
        {
            var townA = SeedTown();
            var townB = SeedTown();
            var expeditionB = await SeedExpedition(townB);
            var bagB = await AsAlive(townB).UpdateExpeditionBag(expeditionB.CitizenId, new ExpeditionBagRequestDto { Items = new List<ExpeditionBagItemRequestDto>() });

            Action act = () => AsAlive(townA).DeleteExpeditionBag(bagB.Id!.Value);

            act.Should().Throw<MhoForbiddenException>();
            NewContext().ExpeditionBags.AsNoTracking().Any(bag => bag.IdExpeditionBag == bagB.Id).Should().BeTrue();
        }

        [Fact]
        public async Task DeleteExpedition_Etranger_Refuse()
        {
            var town = SeedTown();
            var expedition = await SeedExpedition(town);

            Action act = () => NewService(town.OutsiderUserId, tokenMapId: null).DeleteExpedition(expedition.ExpeditionId);

            act.Should().Throw<MhoForbiddenException>();
            NewContext().Expeditions.AsNoTracking().Any(e => e.IdExpedition == expedition.ExpeditionId).Should().BeTrue();
        }
    }
}
