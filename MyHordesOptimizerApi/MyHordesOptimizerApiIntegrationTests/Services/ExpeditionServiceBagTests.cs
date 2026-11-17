using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Exceptions;
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
            var created = await NewService().UpdateExpeditionBag(citizen.Id!.Value, new ExpeditionBagRequestDto { Items = new List<ExpeditionBagItemRequestDto>() });

            var updated = await NewService().UpdateExpeditionBag(citizen.Id!.Value, new ExpeditionBagRequestDto { Id = created.Id, Items = new List<ExpeditionBagItemRequestDto>() });

            updated.ExpeditionsPartId.Should().Contain(part.Id!.Value);
        }

        [Fact]
        public async Task DeleteExpeditionBag_LeCitoyenSurvit()
        {
            var townId = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            var citizen = await NewService().SaveExpeditionCitizenAsync(part.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            var bag = await NewService().UpdateExpeditionBag(citizen.Id!.Value, new ExpeditionBagRequestDto { Items = new List<ExpeditionBagItemRequestDto>() });

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
            var bag = await NewService().UpdateExpeditionBag(citizen.Id!.Value, new ExpeditionBagRequestDto { Items = new List<ExpeditionBagItemRequestDto>() });

            var replacementBags = NewService().DeleteExpeditionBag(bag.Id!.Value);

            replacementBags.Should().ContainSingle();
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var citizenFromDb = context.ExpeditionCitizens.Single(c => c.IdExpeditionCitizen == citizen.Id!.Value);
            citizenFromDb.IdExpeditionBag.Should().NotBeNull().And.NotBe(bag.Id!.Value);
        }

        /// <summary>Deux places d'une même partie, chacune avec son propre sac.</summary>
        private async Task<(int PartId, int CitizenA, int BagA, int CitizenB, int BagB)> TwoPlacesAsync()
        {
            var townId = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            var citizenA = await NewService().SaveExpeditionCitizenAsync(part.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            var citizenB = await NewService().SaveExpeditionCitizenAsync(part.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            var context = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var bagA = context.ExpeditionCitizens.Single(c => c.IdExpeditionCitizen == citizenA.Id!.Value).IdExpeditionBag!.Value;
            var bagB = context.ExpeditionCitizens.Single(c => c.IdExpeditionCitizen == citizenB.Id!.Value).IdExpeditionBag!.Value;
            return (part.Id!.Value, citizenA.Id!.Value, bagA, citizenB.Id!.Value, bagB);
        }

        [Fact]
        public async Task UpdateExpeditionBag_SacDUneAutrePlace_RefuseEtLaisseLAutrePlaceIntacte()
        {
            var places = await TwoPlacesAsync();

            Func<Task> act = () => NewService().UpdateExpeditionBag(places.CitizenA, new ExpeditionBagRequestDto { Id = places.BagB, Items = new List<ExpeditionBagItemRequestDto>() });

            await act.Should().ThrowAsync<MhoForbiddenException>();
            var context = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            context.ExpeditionCitizens.Single(c => c.IdExpeditionCitizen == places.CitizenB).IdExpeditionBag.Should().Be(places.BagB);
            context.ExpeditionCitizens.Single(c => c.IdExpeditionCitizen == places.CitizenA).IdExpeditionBag.Should().Be(places.BagA);
        }

        [Fact]
        public async Task SaveExpeditionCitizen_SacDUneAutrePlace_Refuse()
        {
            var places = await TwoPlacesAsync();

            Func<Task> act = () => NewService().SaveExpeditionCitizenAsync(places.PartId, new ExpeditionCitizenRequestDto { Id = places.CitizenA, BagId = places.BagB, OrdersId = new List<int>() });

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task SaveExpeditionCitizen_CreationAvecLeSacDUnePlaceExistante_Refuse()
        {
            var places = await TwoPlacesAsync();

            Func<Task> act = () => NewService().SaveExpeditionCitizenAsync(places.PartId, new ExpeditionCitizenRequestDto { BagId = places.BagB, OrdersId = new List<int>() });

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task SaveExpeditionCitizen_SonPropreSac_Accepte()
        {
            var places = await TwoPlacesAsync();

            var saved = await NewService().SaveExpeditionCitizenAsync(places.PartId, new ExpeditionCitizenRequestDto { Id = places.CitizenA, BagId = places.BagA, OrdersId = new List<int>() });

            saved.Id.Should().Be(places.CitizenA);
        }

        [Fact]
        public async Task UpdateExpeditionBag_NouveauSacAlorsQueLAncienEstPartage_LesAutresPlacesSurvivent()
        {
            var places = await TwoPlacesAsync();
            var context = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            context.ExpeditionCitizens.Single(c => c.IdExpeditionCitizen == places.CitizenB).IdExpeditionBag = places.BagA;
            context.SaveChanges();

            await NewService().UpdateExpeditionBag(places.CitizenA, new ExpeditionBagRequestDto { Items = new List<ExpeditionBagItemRequestDto>() });

            var verify = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            verify.ExpeditionCitizens.Single(c => c.IdExpeditionCitizen == places.CitizenB).IdExpeditionBag.Should().Be(places.BagA);
        }
    }
}
