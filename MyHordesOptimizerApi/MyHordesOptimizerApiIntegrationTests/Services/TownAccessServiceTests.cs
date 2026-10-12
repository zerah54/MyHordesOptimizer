using System;
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
    /// <summary>
    /// Droit d'écriture sur une ville : ville du jeton, citoyen vivant ou mort, cadavre. Refusé à tout autre
    /// utilisateur.
    /// </summary>
    public class TownAccessServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public TownAccessServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private MhoContext NewContext()
        {
            return _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
        }

        private TownAccessService NewService(int userId, int? tokenMapId)
        {
            var userInfo = new UserInfoProvider
            {
                UserId = userId,
                TownDetail = tokenMapId.HasValue ? new SimpleMeTownDetailDto { TownId = tokenMapId.Value } : null
            };
            return new TownAccessService(_factory.Services.GetRequiredService<IServiceScopeFactory>(), userInfo);
        }

        private (int townId, int aliveUserId, int deadUserId, int outsiderUserId) SeedTown()
        {
            return AttackTestSupport.SeedTown(NewContext(), day: 5);
        }

        [Fact]
        public void EnsureCanWriteTown_VilleDuJeton_Accepte()
        {
            var townId = new Random().Next(1, int.MaxValue);

            System.Action act = () => NewService(userId: 0, tokenMapId: townId).EnsureCanWriteTown(townId, townId);

            act.Should().NotThrow();
        }

        [Fact]
        public void EnsureCanWriteTown_VilleProvisoireDuJeton_Accepte()
        {
            var mapId = new Random().Next(1, int.MaxValue);

            System.Action act = () => NewService(userId: 0, tokenMapId: mapId).EnsureCanWriteTown(-mapId, mapId: null);

            act.Should().NotThrow();
        }

        [Fact]
        public void EnsureCanWriteTown_CitoyenVivantSansLaVilleDansLeJeton_Accepte()
        {
            var (townId, aliveUserId, _, _) = SeedTown();

            System.Action act = () => NewService(aliveUserId, tokenMapId: null).EnsureCanWriteTown(townId, townId);

            act.Should().NotThrow();
        }

        [Fact]
        public void EnsureCanWriteTown_CitoyenMort_Accepte()
        {
            var (townId, _, deadUserId, _) = SeedTown();

            System.Action act = () => NewService(deadUserId, tokenMapId: null).EnsureCanWriteTown(townId, townId);

            act.Should().NotThrow();
        }

        [Fact]
        public async Task EnsureCanWriteTownAsync_Cadavre_Accepte()
        {
            var (townId, _, _, outsiderUserId) = SeedTown();
            var context = NewContext();
            context.TownCadavers.Add(new TownCadaver { IdTown = townId, IdUser = outsiderUserId });
            context.SaveChanges();

            Func<Task> act = () => NewService(outsiderUserId, tokenMapId: null).EnsureCanWriteTownAsync(townId, townId);

            await act.Should().NotThrowAsync();
        }

        [Fact]
        public void EnsureCanWriteTown_Etranger_Refuse()
        {
            var (townId, _, _, outsiderUserId) = SeedTown();

            System.Action act = () => NewService(outsiderUserId, tokenMapId: null).EnsureCanWriteTown(townId, townId);

            act.Should().Throw<MhoForbiddenException>();
        }

        [Fact]
        public async Task EnsureCanWriteTownAsync_EtrangerAvecUneAutreVilleDansLeJeton_Refuse()
        {
            var (townId, _, _, outsiderUserId) = SeedTown();
            var otherTownId = townId == int.MaxValue ? townId - 1 : townId + 1;

            Func<Task> act = () => NewService(outsiderUserId, tokenMapId: otherTownId).EnsureCanWriteTownAsync(townId, townId);

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public void EnsureCanWriteTown_SansUtilisateurNiVille_Refuse()
        {
            var (townId, _, _, _) = SeedTown();

            System.Action act = () => NewService(userId: 0, tokenMapId: null).EnsureCanWriteTown(townId, townId);

            act.Should().Throw<MhoForbiddenException>();
        }
    }
}
