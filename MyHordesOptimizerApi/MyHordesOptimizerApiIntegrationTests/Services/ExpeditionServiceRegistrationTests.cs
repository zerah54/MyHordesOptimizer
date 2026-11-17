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
    /// <summary>Inscription sur une place d'expédition : un occupant n'est remplacé que sous le verrou du bloc.</summary>
    public class ExpeditionServiceRegistrationTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;

        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExpeditionServiceRegistrationTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private IExpeditionService NewService(int userId, int townId)
        {
            var provider = _factory.Services.CreateScope().ServiceProvider;
            var userInfo = provider.GetRequiredService<IUserInfoProvider>();
            userInfo.UserId = userId;
            userInfo.TownDetail = new SimpleMeTownDetailDto { TownId = townId };
            return new ExpeditionService(
                provider.GetRequiredService<IServiceScopeFactory>(),
                provider.GetRequiredService<IMapper>(),
                userInfo,
                provider.GetRequiredService<ILogger<ExpeditionService>>(),
                provider.GetRequiredService<MhoContext>(),
                provider.GetRequiredService<TownSyncLock>(),
                new TownAccessService(provider.GetRequiredService<IServiceScopeFactory>(), userInfo));
        }

        private MhoContext NewContext() => _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();

        /// <summary>Ville avec une partie et une place vide, ou occupée par le second joueur.</summary>
        private async Task<(int TownId, int Self, int Other, int PartId, int CitizenId)> Seed(bool occupied)
        {
            var (townId, self, other, _) = AttackTestSupport.SeedTown(NewContext(), Day);
            var service = NewService(self, townId);
            var expedition = await service.SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, townId, Day);
            var part = await service.SaveExpeditionPartAsync(expedition.Id!.Value, new ExpeditionPartRequestDto { OrdersId = new List<int>(), CitizensId = new List<int>() });
            var citizen = await service.SaveExpeditionCitizenAsync(part.Id!.Value, new ExpeditionCitizenRequestDto { OrdersId = new List<int>(), IdUser = occupied ? other : null });
            return (townId, self, other, part.Id!.Value, citizen.Id!.Value);
        }

        private int OccupantInDb(int citizenId) =>
            NewContext().ExpeditionCitizens.AsNoTracking().Single(c => c.IdExpeditionCitizen == citizenId).IdUser!.Value;

        [Fact]
        public async Task PlaceVide_Inscription_Passe()
        {
            var s = await Seed(occupied: false);

            var result = await NewService(s.Self, s.TownId).SaveExpeditionCitizenAsync(s.PartId, new ExpeditionCitizenRequestDto { Id = s.CitizenId, OrdersId = new List<int>(), IdUser = s.Self });

            result.IdUser.Should().Be(s.Self);
        }

        [Fact]
        public async Task PlacePrise_AutreJoueurSansVerrou_LeveMhoLockedExceptionAvecLOccupant()
        {
            var s = await Seed(occupied: true);

            Func<Task> act = () => NewService(s.Self, s.TownId).SaveExpeditionCitizenAsync(s.PartId, new ExpeditionCitizenRequestDto { Id = s.CitizenId, OrdersId = new List<int>(), IdUser = s.Self });

            (await act.Should().ThrowAsync<MhoLockedException>()).Which.HolderUserId.Should().Be(s.Other);
            OccupantInDb(s.CitizenId).Should().Be(s.Other);
        }

        [Fact]
        public async Task PlaceDUneAutreVille_Occupee_LeveForbiddenSansReveleLOccupant()
        {
            var townA = await Seed(occupied: false);
            var townB = await Seed(occupied: true);

            Func<Task> act = () => NewService(townA.Self, townA.TownId).SaveExpeditionCitizenAsync(townA.PartId, new ExpeditionCitizenRequestDto { Id = townB.CitizenId, OrdersId = new List<int>(), IdUser = townA.Self });

            await act.Should().ThrowAsync<MhoForbiddenException>();
            OccupantInDb(townB.CitizenId).Should().Be(townB.Other);
        }

        [Fact]
        public async Task PlacePrise_AvecCanReplaceOccupant_Remplace()
        {
            var s = await Seed(occupied: true);

            await NewService(s.Self, s.TownId).SaveExpeditionCitizenAsync(s.PartId, new ExpeditionCitizenRequestDto { Id = s.CitizenId, OrdersId = new List<int>(), IdUser = s.Self }, canReplaceOccupant: true);

            OccupantInDb(s.CitizenId).Should().Be(s.Self);
        }

        [Fact]
        public async Task Desinscription_DeSoiMeme_Passe()
        {
            var s = await Seed(occupied: false);
            await NewService(s.Self, s.TownId).SaveExpeditionCitizenAsync(s.PartId, new ExpeditionCitizenRequestDto { Id = s.CitizenId, OrdersId = new List<int>(), IdUser = s.Self });

            var result = await NewService(s.Self, s.TownId).SaveExpeditionCitizenAsync(s.PartId, new ExpeditionCitizenRequestDto { Id = s.CitizenId, OrdersId = new List<int>(), IdUser = null });

            result.IdUser.Should().BeNull();
        }
    }
}
