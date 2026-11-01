using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// Un mapId peut désigner plusieurs villes (ville Twinoid et ville MyHordes de même numéro) :
    /// le détail des pictos et les cadavres suivent la ville retenue pour chaque vie passée.
    /// </summary>
    public class ImportUserPictosTownAttachmentTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int TwinoidSeason = 5;
        private const int NativeSeason = 19;
        private const int TwinoidPhaseId = 2;
        private const int NativePhaseId = 3;

        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ImportUserPictosTownAttachmentTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task ImportUserPictosAsync_VilleTwinoidHomonyme_RangeLesPictosSurLaVilleDeLaVie()
        {
            var fixture = NewFixture();
            var repository = new ImportUserPictosLockingTests.SingleUserPictosRepository(new MyHordesUserDetailsDto
            {
                PlayedMaps = new List<MyHordesCitizenRankingDto> { PlayedLife(fixture, NativeSeason, "native", number: 3) }
            });

            var (context, fetcher) = Arrange(fixture, repository);

            (await fetcher.ImportUserPictosAsync(fixture.UserId)).Should().BeTrue();

            CountsByTown(context, fixture.UserId).Should().BeEquivalentTo(new Dictionary<int, int> { [fixture.NativeTownId] = 3 });
        }

        [Fact]
        public async Task ImportUserPictosAsync_DeuxViesDeMemeMapId_RangeChaqueVieSurSaVille()
        {
            var fixture = NewFixture();
            var repository = new ImportUserPictosLockingTests.SingleUserPictosRepository(new MyHordesUserDetailsDto
            {
                PlayedMaps = new List<MyHordesCitizenRankingDto>
                {
                    PlayedLife(fixture, TwinoidSeason, "import", number: 2),
                    PlayedLife(fixture, NativeSeason, "native", number: 3)
                }
            });

            var (context, fetcher) = Arrange(fixture, repository);

            (await fetcher.ImportUserPictosAsync(fixture.UserId)).Should().BeTrue();

            CountsByTown(context, fixture.UserId).Should().BeEquivalentTo(new Dictionary<int, int>
            {
                [fixture.TwinoidTownId] = 2,
                [fixture.NativeTownId] = 3
            });
        }

        [Fact]
        public async Task ImportUserPictosAsync_DeuxViesDeMemeMapId_CreeUnCadavreParVille()
        {
            var fixture = NewFixture();
            var repository = new ImportUserPictosLockingTests.SingleUserPictosRepository(new MyHordesUserDetailsDto
            {
                PlayedMaps = new List<MyHordesCitizenRankingDto>
                {
                    PlayedLife(fixture, TwinoidSeason, "import", number: 2),
                    PlayedLife(fixture, NativeSeason, "native", number: 3)
                }
            });

            var (context, fetcher) = Arrange(fixture, repository);

            (await fetcher.ImportUserPictosAsync(fixture.UserId)).Should().BeTrue();

            context.TownCadavers.AsNoTracking()
                .Where(cadaver => cadaver.IdUser == fixture.UserId)
                .Select(cadaver => cadaver.IdTown)
                .ToList()
                .Should().BeEquivalentTo(new[] { fixture.TwinoidTownId, fixture.NativeTownId });
        }

        private (MhoContext Context, IMyHordesFetcherService Fetcher) Arrange(TownFixture fixture, IMyHordesApiRepository repository)
        {
            var factory = _factory.WithWebHostBuilder(builder =>
                builder.ConfigureTestServices(services => services.AddScoped(_ => repository)));
            var scope = factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();

            context.Users.Add(new User { IdUser = fixture.UserId, Name = "test-user-" + fixture.UserId });
            // L'idTown Twinoid est le plus petit : c'est la ligne qu'une recherche par mapId seul retient.
            context.Towns.Add(new Town { IdTown = fixture.TwinoidTownId, MapId = fixture.MapId, Season = TwinoidSeason, PhaseId = TwinoidPhaseId });
            context.Towns.Add(new Town { IdTown = fixture.NativeTownId, MapId = fixture.MapId, Season = NativeSeason, PhaseId = NativePhaseId });
            context.SaveChanges();

            return (context, scope.ServiceProvider.GetRequiredService<IMyHordesFetcherService>());
        }

        private static Dictionary<int, int> CountsByTown(MhoContext context, int userId)
        {
            return context.TownCitizenPictos.AsNoTracking()
                .Where(picto => picto.IdUser == userId)
                .ToDictionary(picto => picto.IdTown, picto => picto.Count);
        }

        private static MyHordesCitizenRankingDto PlayedLife(TownFixture fixture, int season, string phase, int number)
        {
            return new MyHordesCitizenRankingDto
            {
                MapId = fixture.MapId,
                MapName = "test-town-" + season,
                Season = season,
                Phase = phase,
                Dtype = 1,
                Rewards = new Dictionary<string, MyHordesTownPictoDto>
                {
                    [fixture.PictoMhId.ToString()] = new() { Id = fixture.PictoMhId, Number = number, Img = "pictos/test.gif" }
                }
            };
        }

        private static TownFixture NewFixture()
        {
            var random = new Random();
            var twinoidTownId = random.Next(1_000_000_000, 1_500_000_000);
            return new TownFixture(
                UserId: random.Next(1_000_000_000, int.MaxValue),
                MapId: random.Next(1_000_000_000, int.MaxValue),
                TwinoidTownId: twinoidTownId,
                NativeTownId: twinoidTownId + random.Next(1, 1_000_000),
                PictoMhId: random.Next(1_000_000_000, int.MaxValue));
        }

        private sealed record TownFixture(int UserId, int MapId, int TwinoidTownId, int NativeTownId, int PictoMhId);
    }
}
