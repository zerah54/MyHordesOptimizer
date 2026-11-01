using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Buildings;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using System.Linq;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Requiert 2026_10_13_town_building.sql sur la base de test.</summary>
    public class TownBuildingSyncTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public TownBuildingSyncTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private MhoContext NewContext() => _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();

        private static MyHordesCity CityWith(int mhId, int pa) => new()
        {
            Chantiers = new() { new MyHordesBuildingDto { Id = mhId, PaCurrent = pa, Actions = pa } }
        };

        private static (int idBuilding, int mhId) AnyBuilding(MhoContext context)
        {
            var building = context.Buildings.First(b => b.MhId != null);
            return (building.IdBuilding, building.MhId!.Value);
        }

        private static int NewUpdate(MhoContext db)
        {
            var update = db.LastUpdateInfos.Add(new LastUpdateInfo { DateUpdate = System.DateTime.UtcNow }).Entity;
            db.SaveChanges();
            return update.IdLastUpdateInfo;
        }

        [Fact]
        public void Replace_WritesRowsForTheTownOnly()
        {
            var db = NewContext();
            var (townA, _, _, _) = AttackTestSupport.SeedTown(db, 4);
            var (townB, _, _, _) = AttackTestSupport.SeedTown(db, 4);
            var (idBuilding, mhId) = AnyBuilding(db);
            var update = NewUpdate(db);

            TownBuildingSync.Replace(db, townA, update, CityWith(mhId, 40), NullLogger.Instance);
            TownBuildingSync.Replace(db, townB, update, CityWith(mhId, 10), NullLogger.Instance);
            db.SaveChanges();

            var verify = NewContext();
            verify.TownBuildings.Single(row => row.IdTown == townA && row.IdBuilding == idBuilding).PaCurrent.Should().Be(40);
            verify.TownBuildings.Single(row => row.IdTown == townB && row.IdBuilding == idBuilding).PaCurrent.Should().Be(10);
        }

        [Fact]
        public void Replace_RemovesBuildingsThatAreNoLongerListed()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 4);
            var (_, mhId) = AnyBuilding(db);
            var update = NewUpdate(db);
            TownBuildingSync.Replace(db, town, update, CityWith(mhId, 40), NullLogger.Instance);
            db.SaveChanges();

            var second = NewContext();
            TownBuildingSync.Replace(second, town, update, new MyHordesCity { Chantiers = new(), Buildings = new() }, NullLogger.Instance);
            second.SaveChanges();

            NewContext().TownBuildings.Count(row => row.IdTown == town).Should().Be(0);
        }

        [Fact]
        public void Replace_UpdatesTheSameBuildingWhenSyncedAgainInTheSameContext()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 4);
            var (idBuilding, mhId) = AnyBuilding(db);
            var update = NewUpdate(db);
            TownBuildingSync.Replace(db, town, update, CityWith(mhId, 40), NullLogger.Instance);
            db.SaveChanges();

            // Cas courant : la ville est resynchronisée, le chantier existe déjà avec la même clé.
            var sameContext = NewContext();
            TownBuildingSync.Replace(sameContext, town, update, CityWith(mhId, 25), NullLogger.Instance);
            sameContext.SaveChanges();

            NewContext().TownBuildings.Single(row => row.IdTown == town && row.IdBuilding == idBuilding).PaCurrent.Should().Be(25);
        }

        [Fact]
        public void Replace_IgnoresTheSameBuildingListedTwice()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 4);
            var (idBuilding, mhId) = AnyBuilding(db);
            var update = NewUpdate(db);
            var twice = new MyHordesCity
            {
                Chantiers = new() { new MyHordesBuildingDto { Id = mhId, PaCurrent = 40 } },
                Buildings = new() { new MyHordesBuildingDto { Id = mhId, PaCurrent = 10 } }
            };

            TownBuildingSync.Replace(db, town, update, twice, NullLogger.Instance);
            db.SaveChanges();

            NewContext().TownBuildings.Count(row => row.IdTown == town && row.IdBuilding == idBuilding).Should().Be(1);
        }

        [Fact]
        public void ReplaceDefense_InsertsThenUpdatesTheSingleRowOfTheTown()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 4);
            var update = NewUpdate(db);
            TownBuildingSync.ReplaceDefense(db, town, update, new MyHordesDefense { Total = 1352, Buildings = 700, ItemsMul = 1.5 });
            db.SaveChanges();

            var again = NewContext();
            TownBuildingSync.ReplaceDefense(again, town, update, new MyHordesDefense { Total = 1400 });
            again.SaveChanges();

            var row = NewContext().TownDefenses.Single(defense => defense.IdTown == town);
            row.Total.Should().Be(1400);
            row.Buildings.Should().BeNull();
        }

        [Fact]
        public void ReplaceDefense_LeavesTheRowAloneWhenTheApiSendsNoDefense()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 4);
            var update = NewUpdate(db);
            TownBuildingSync.ReplaceDefense(db, town, update, new MyHordesDefense { Total = 1352 });
            db.SaveChanges();

            var again = NewContext();
            TownBuildingSync.ReplaceDefense(again, town, update, null);
            again.SaveChanges();

            NewContext().TownDefenses.Single(defense => defense.IdTown == town).Total.Should().Be(1352);
        }
    }
}
