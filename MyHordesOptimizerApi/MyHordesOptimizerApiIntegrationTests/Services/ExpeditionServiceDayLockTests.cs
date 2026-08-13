using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
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
    /// Jours antérieurs au jour actuel de la ville = verrouillés ; jour actuel et suivants = modifiables.
    /// Chaque appel de service utilise son propre scope : MhoContext est Transient et capturé une seule
    /// fois à la construction du service, donc deux appels dans le même scope se marchent dessus sur le
    /// mapping LastUpdateInfo -> User (nouvelle instance User à chaque appel, conflit de tracking EF).
    /// </summary>
    public class ExpeditionServiceDayLockTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExpeditionServiceDayLockTests(MyHordesOptimizerApplicationFactory factory)
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

        private void SetTownDay(int townId, int day)
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            context.Towns.Single(town => town.IdTown == townId).Day = day;
            context.SaveChanges();
        }

        [Fact]
        public async Task SaveExpeditionAsync_JourAnterieurAuJourDeLaVille_Rejette()
        {
            var townId = NewTown(day: 5);

            Func<Task> act = () => NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 4);

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SaveExpeditionAsync_JourActuel_Accepte()
        {
            var townId = NewTown(day: 5);

            var result = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);

            result.Should().NotBeNull();
        }

        [Fact]
        public async Task SaveExpeditionAsync_JourFutur_Accepte()
        {
            var townId = NewTown(day: 5);

            var result = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 6);

            result.Should().NotBeNull();
        }

        [Fact]
        public async Task DeleteExpedition_LeJourDeLExpeditionEstDevenuPasse_Rejette()
        {
            var townId = NewTown(day: 4);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 4);
            SetTownDay(townId, 5);

            System.Action act = () => NewService().DeleteExpedition(expedition.Id!.Value);

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public async Task CopyExpeditionsAsync_JourCibleAnterieurAuJourDeLaVille_Rejette()
        {
            var townId = NewTown(day: 5);
            await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);

            Func<Task> act = () => NewService().CopyExpeditionsAsync(townId, fromDay: 5, targetDay: 4);

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_ExpeditionSurUnJourDevenuPasse_Rejette()
        {
            // L'expédition est créée le jour 4 (alors courant), puis le jour de ville avance à 5.
            var townId = NewTown(day: 4);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 4);
            SetTownDay(townId, 5);

            Func<Task> act = () => NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_ExpeditionSurLeJourActuel_Accepte()
        {
            var townId = NewTown(day: 5);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 5);

            var result = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });

            result.Should().NotBeNull();
        }

        [Fact]
        public async Task DeleteExpeditionPart_LeJourDeLExpeditionEstDevenuPasse_Rejette()
        {
            var townId = NewTown(day: 4);
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, 4);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            SetTownDay(townId, 5);

            System.Action act = () => NewService().DeleteExpeditionPart(part.Id!.Value);

            act.Should().Throw<MhoTechnicalException>();
        }

        private async Task<int> NewPart(int townId, int expeditionDay)
        {
            var expedition = await NewService().SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, expeditionDay);
            var part = await NewService().SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            return part.Id!.Value;
        }

        [Fact]
        public async Task SaveExpeditionCitizenAsync_CreationSurUnJourDevenuPasse_Rejette()
        {
            var townId = NewTown(day: 4);
            var partId = await NewPart(townId, expeditionDay: 4);
            SetTownDay(townId, 5);

            Func<Task> act = () => NewService().SaveExpeditionCitizenAsync(partId, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SaveExpeditionCitizenAsync_MiseAJourSurUnJourDevenuPasse_Rejette()
        {
            var townId = NewTown(day: 4);
            var partId = await NewPart(townId, expeditionDay: 4);
            var citizen = await NewService().SaveExpeditionCitizenAsync(partId, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            SetTownDay(townId, 5);

            Func<Task> act = () => NewService().SaveExpeditionCitizenAsync(partId, new ExpeditionCitizenRequestDto { Id = citizen.Id, OrdersId = new List<int>(), Pdc = 3 });

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SaveExpeditionCitizenAsync_JourActuel_Accepte()
        {
            var townId = NewTown(day: 5);
            var partId = await NewPart(townId, expeditionDay: 5);

            var result = await NewService().SaveExpeditionCitizenAsync(partId, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });

            result.Should().NotBeNull();
        }

        [Fact]
        public async Task DeleteExpeditionCitizen_LeJourDeLExpeditionEstDevenuPasse_Rejette()
        {
            var townId = NewTown(day: 4);
            var partId = await NewPart(townId, expeditionDay: 4);
            var citizen = await NewService().SaveExpeditionCitizenAsync(partId, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            SetTownDay(townId, 5);

            System.Action act = () => NewService().DeleteExpeditionCitizen(citizen.Id!.Value);

            act.Should().Throw<MhoTechnicalException>();
        }

        private async Task<int> NewCitizen(int townId, int expeditionDay)
        {
            var partId = await NewPart(townId, expeditionDay);
            var citizen = await NewService().SaveExpeditionCitizenAsync(partId, new ExpeditionCitizenRequestDto { OrdersId = new List<int>() });
            return citizen.Id!.Value;
        }

        [Fact]
        public async Task SaveCitizenOrdersAsync_LeJourDeLExpeditionEstDevenuPasse_Rejette()
        {
            var townId = NewTown(day: 4);
            var citizenId = await NewCitizen(townId, expeditionDay: 4);
            SetTownDay(townId, 5);

            Func<Task> act = () => NewService().SaveCitizenOrdersAsync(citizenId, new List<ExpeditionOrderDto>());

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SavePartOrdersAsync_LeJourDeLExpeditionEstDevenuPasse_Rejette()
        {
            var townId = NewTown(day: 4);
            var partId = await NewPart(townId, expeditionDay: 4);
            SetTownDay(townId, 5);

            Func<Task> act = () => NewService().SavePartOrdersAsync(partId, new List<ExpeditionOrderDto>());

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task DeleteExpeditionOrder_CommandeDeCitoyenSurUnJourDevenuPasse_Rejette()
        {
            var townId = NewTown(day: 4);
            var citizenId = await NewCitizen(townId, expeditionDay: 4);
            var orders = await NewService().SaveCitizenOrdersAsync(citizenId, new List<ExpeditionOrderDto> { new ExpeditionOrderDto { Text = "test" } });
            SetTownDay(townId, 5);

            System.Action act = () => NewService().DeleteExpeditionOrder(orders.Single().Id!.Value);

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public async Task UpdateExpeditionOrder_CommandeDeCitoyenSurUnJourDevenuPasse_Rejette()
        {
            var townId = NewTown(day: 4);
            var citizenId = await NewCitizen(townId, expeditionDay: 4);
            var orders = await NewService().SaveCitizenOrdersAsync(citizenId, new List<ExpeditionOrderDto> { new ExpeditionOrderDto { Text = "test" } });
            SetTownDay(townId, 5);

            System.Action act = () => NewService().UpdateExpeditionOrder(new ExpeditionOrderDto { Id = orders.Single().Id, IsDone = true });

            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public async Task UpdateExpeditionBag_LeJourDeLExpeditionEstDevenuPasse_Rejette()
        {
            var townId = NewTown(day: 4);
            var citizenId = await NewCitizen(townId, expeditionDay: 4);
            SetTownDay(townId, 5);

            System.Action act = () => NewService().UpdateExpeditionBag(citizenId, new ExpeditionBagRequestDto { Items = new List<ExpeditionBagItemRequestDto>() });

            act.Should().Throw<MhoTechnicalException>();
        }

        /// <summary>
        /// Crée le sac directement en base (plutôt que via UpdateExpeditionBag) : le mapping de retour de
        /// UpdateExpeditionBag NRE sur ExpeditionsPartId quand le citoyen chargé plus haut dans la méthode
        /// n'a pas sa navigation de partie incluse — bug préexistant, hors périmètre du verrou de jour.
        /// </summary>
        private int NewBag(int citizenId)
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var bag = new ExpeditionBag();
            context.ExpeditionBags.Add(bag);
            context.SaveChanges();
            context.ExpeditionCitizens.Single(citizen => citizen.IdExpeditionCitizen == citizenId).IdExpeditionBag = bag.IdExpeditionBag;
            context.SaveChanges();
            return bag.IdExpeditionBag;
        }

        [Fact]
        public async Task DeleteExpeditionBag_LeJourDeLExpeditionEstDevenuPasse_Rejette()
        {
            var townId = NewTown(day: 4);
            var citizenId = await NewCitizen(townId, expeditionDay: 4);
            var bagId = NewBag(citizenId);
            SetTownDay(townId, 5);

            System.Action act = () => NewService().DeleteExpeditionBag(bagId);

            act.Should().Throw<MhoTechnicalException>();
        }
    }
}
