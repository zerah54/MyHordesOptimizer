using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Impl;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Droit d'écriture sur une pré-ville : membre d'une pré-ville non liée uniquement ; ville réelle inchangée.</summary>
    public class TownAccessServicePreTownTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public TownAccessServicePreTownTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private TownAccessService NewService(int userId, int? tokenMapId = null)
        {
            var userInfo = new UserInfoProvider
            {
                UserId = userId,
                TownDetail = tokenMapId.HasValue ? new SimpleMeTownDetailDto { TownId = tokenMapId.Value } : null
            };
            return new TownAccessService(_factory.Services.GetRequiredService<IServiceScopeFactory>(), userInfo);
        }

        [Fact]
        public async Task CanWrite_MembreDePreVilleNonLiee_Accepte()
        {
            var (preTownId, mapId, memberId, _) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: false);

            (await NewService(memberId).CanWriteTownAsync(PreTownIds.ToIdTown(preTownId), mapId)).Should().BeTrue();
            await NewService(memberId).Invoking(s => s.EnsureCanWriteMapAsync(mapId)).Should().NotThrowAsync();
            NewService(memberId).Invoking(s => s.EnsureCanWriteTown(PreTownIds.ToIdTown(preTownId), mapId)).Should().NotThrow();
        }

        [Fact]
        public async Task CanWrite_NonMembre_Refuse()
        {
            var (preTownId, mapId, _, outsiderId) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: false);

            (await NewService(outsiderId).CanWriteTownAsync(PreTownIds.ToIdTown(preTownId), mapId)).Should().BeFalse();
            await NewService(outsiderId).Invoking(s => s.EnsureCanWriteMapAsync(mapId)).Should().ThrowAsync<MhoForbiddenException>();
            NewService(outsiderId).Invoking(s => s.EnsureCanWriteTown(PreTownIds.ToIdTown(preTownId), mapId)).Should().Throw<MhoForbiddenException>();
        }

        [Fact]
        public async Task CanWrite_MembreDePreVilleLiee_Refuse()
        {
            var (preTownId, mapId, memberId, _) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: true);

            (await NewService(memberId).CanWriteTownAsync(PreTownIds.ToIdTown(preTownId), mapId)).Should().BeFalse();
            await NewService(memberId).Invoking(s => s.EnsureCanWriteMapAsync(mapId)).Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task JetonDontLaVilleEstUnPseudoMapId_NonMembre_Refuse()
        {
            var (preTownId, mapId, _, outsiderId) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: false);
            var service = NewService(outsiderId, tokenMapId: mapId);

            (await service.CanWriteTownAsync(PreTownIds.ToIdTown(preTownId), mapId)).Should().BeFalse();
            (await service.CanWriteTownAsync(PreTownIds.ToIdTown(preTownId), null)).Should().BeFalse();
            await service.Invoking(s => s.EnsureCanWriteMapAsync(mapId)).Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task CanReadPreTown_MembreOuNonMembre_LieeOuNon()
        {
            var (_, freeMapId, freeMemberId, freeOutsiderId) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: false);
            var (_, linkedMapId, linkedMemberId, _) = await PreTownAccessTestSupport.SeedPreTownAsync(_factory, linked: true);

            (await NewService(freeMemberId).CanReadPreTownAsync(freeMapId)).Should().BeTrue();
            (await NewService(freeOutsiderId).CanReadPreTownAsync(freeMapId)).Should().BeFalse();
            (await NewService(linkedMemberId).CanReadPreTownAsync(linkedMapId)).Should().BeTrue();
            (await NewService(freeMemberId).CanReadPreTownAsync(42)).Should().BeFalse();
            (await NewService(0).CanReadPreTownAsync(freeMapId)).Should().BeFalse();
        }

        [Fact]
        public async Task VilleReelle_RestereGereeParLaCitoyennete()
        {
            using var scope = _factory.Services.CreateScope();
            var (townId, aliveId, _, outsiderId) = AttackTestSupport.SeedTown(scope.ServiceProvider.GetRequiredService<MhoContext>(), day: 5);

            (await NewService(aliveId).CanWriteTownAsync(townId, townId)).Should().BeTrue();
            (await NewService(outsiderId).CanWriteTownAsync(townId, townId)).Should().BeFalse();
            await NewService(outsiderId).Invoking(s => s.EnsureCanWriteMapAsync(townId)).Should().ThrowAsync<MhoForbiddenException>();
        }
    }
}
