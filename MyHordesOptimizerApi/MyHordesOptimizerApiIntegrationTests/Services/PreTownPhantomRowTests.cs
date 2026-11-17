using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>La ville fantôme d'une pré-ville ne doit jamais apparaître dans une énumération de villes.</summary>
    public class PreTownPhantomRowTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private static readonly Random Rng = new();
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public PreTownPhantomRowTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        /// <summary>Crée une pré-ville d'alias <paramref name="alias"/> et une ville provisoire réelle (IdTown = -mapId, petit mapId) de même préfixe de nom.</summary>
        private async Task<(int phantomIdTown, int provisionalIdTown)> SeedAsync(string prefix)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MhoContext>();
            int userId;
            int mapId;
            lock (Rng) { userId = Rng.Next(1, int.MaxValue); mapId = Rng.Next(1_000, 900_000_000); }
            db.Users.Add(new User { IdUser = userId, Name = prefix + "-user" });
            db.Towns.Add(new Town { IdTown = -mapId, MapId = mapId, Name = prefix + "-provisoire" });
            await db.SaveChangesAsync();
            scope.ServiceProvider.GetRequiredService<IUserInfoProvider>().UserId = userId;
            var dto = await scope.ServiceProvider.GetRequiredService<IPreTownService>().CreateAsync(prefix + "-alias");
            return (PreTownIds.ToIdTown(dto.PreTownId), -mapId);
        }

        [Fact]
        public async Task GetTowns_ExclutLaVilleFantomeEtGardeLaProvisoireReelle()
        {
            var prefix = "test-phantom-" + Guid.NewGuid().ToString("N")[..8];
            var (phantom, provisional) = await SeedAsync(prefix);
            var service = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<ITownService>();

            var result = service.GetTowns(new TownListQueryDto { Name = prefix, Page = 1, PageSize = 50 });

            result.Items.Select(i => i.Id).Should().BeEquivalentTo(new[] { provisional });
            result.TotalCount.Should().Be(1);
        }

        [Fact]
        public async Task DirectorySearch_ExclutLaVilleFantomeEtGardeLaProvisoireReelle()
        {
            var prefix = "test-phantom-" + Guid.NewGuid().ToString("N")[..8];
            var (phantom, provisional) = await SeedAsync(prefix);
            var service = new DirectorySearchService(_factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>());

            var result = service.Search(prefix, 50);

            result.Towns.Items.Select(i => i.Id).Should().BeEquivalentTo(new[] { provisional });
        }

        [Fact]
        public async Task ExcludingPreTowns_ExclutLesFantomesSeulement()
        {
            var prefix = "test-phantom-" + Guid.NewGuid().ToString("N")[..8];
            var (phantom, provisional) = await SeedAsync(prefix);
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MhoContext>();

            // Le filtre sert aussi aux énumérations de MyHordesImportService.ImportTownsAsync (instantané BDD et lignes provisoires).
            var ids = await db.Towns.AsNoTracking().Where(t => t.IdTown < 0 && t.Name!.StartsWith(prefix)).ExcludingPreTowns().Select(t => t.IdTown).ToListAsync();

            ids.Should().BeEquivalentTo(new[] { provisional });
            (await db.Towns.AsNoTracking().AnyAsync(t => t.IdTown == phantom)).Should().BeTrue();
        }
    }
}
