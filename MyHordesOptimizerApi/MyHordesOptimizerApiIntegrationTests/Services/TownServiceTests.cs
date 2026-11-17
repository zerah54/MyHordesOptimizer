using System;
using System.Linq;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class TownServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private static readonly Random Rng = new();
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public TownServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private static int NewId()
        {
            lock (Rng) { return Rng.Next(900_000_000, 999_999_999); }
        }

        private (string prefix, int linkedTown, int plainTown) SeedTowns()
        {
            var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var prefix = "test-list-" + Guid.NewGuid().ToString("N")[..8];
            var creator = NewId();
            db.Users.Add(new User { IdUser = creator, Name = prefix + "-org" });
            var linkedTown = NewId();
            var plainTown = NewId();
            db.Towns.AddRange(
                new Town { IdTown = linkedTown, MapId = linkedTown, Name = prefix + "-a" },
                new Town { IdTown = plainTown, MapId = plainTown, Name = prefix + "-b" });
            db.SaveChanges();
            db.PreTowns.Add(new PreTown { Alias = "Les Rôdeurs", IdCreator = creator, CreatedAt = DateTime.UtcNow, LinkedIdTown = linkedTown, LinkedMapId = linkedTown, LinkedAt = DateTime.UtcNow });
            db.SaveChanges();
            return (prefix, linkedTown, plainTown);
        }

        [Fact]
        public void GetTowns_VilleLieeAUnePreVille_ExposeLAliasSansChangerLeNom()
        {
            var (prefix, linkedTown, plainTown) = SeedTowns();
            var service = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<ITownService>();

            var result = service.GetTowns(new TownListQueryDto { Name = prefix, Page = 1, PageSize = 50 });

            result.TotalCount.Should().Be(2);
            result.Items.Should().HaveCount(2);
            var linked = result.Items.Single(i => i.Id == linkedTown);
            linked.PreTownAlias.Should().Be("Les Rôdeurs");
            linked.Name.Should().Be(prefix + "-a");
            result.Items.Single(i => i.Id == plainTown).PreTownAlias.Should().BeNull();
        }
    }
}
