using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Bank;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Requiert 2026_11_21_town_bank_snapshot.sql sur la base de test.</summary>
    public class TownBankHistoryTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public TownBankHistoryTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private MhoContext NewContext() => _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();

        private static int NewUpdate(MhoContext db)
        {
            var update = db.LastUpdateInfos.Add(new LastUpdateInfo { DateUpdate = System.DateTime.UtcNow }).Entity;
            db.SaveChanges();
            return update.IdLastUpdateInfo;
        }

        private static List<TownBankItem> Items(MhoContext db, int count)
        {
            var itemId = db.Items.First().IdItem;
            return new List<TownBankItem> { new() { IdItem = itemId, Count = count, IsBroken = false } };
        }

        private static bool Record(MhoContext db, int town, int day, int update, int count)
        {
            var written = TownBankHistory.Record(db, town, day, update, Items(db, count));
            db.SaveChanges();
            return written;
        }

        [Fact]
        public void Record_PremiereVersion_EcritEnTeteEtLignes()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);

            Record(db, town, 3, u1, 2).Should().BeTrue();

            var verify = NewContext();
            var header = verify.TownBankSnapshots.Single(s => s.IdTown == town);
            header.Day.Should().Be(3);
            header.IdLastUpdateInfo.Should().Be(u1);
            header.ContentHash.Should().HaveLength(64);
            verify.TownBankItems.Single(i => i.IdTown == town && i.IdLastUpdateInfo == u1).Count.Should().Be(2);
        }

        [Fact]
        public void Record_MemeContenuMemeJour_NEcritRien()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);
            var u2 = NewUpdate(db);
            Record(db, town, 3, u1, 2);

            Record(NewContext(), town, 3, u2, 2).Should().BeFalse();

            NewContext().TownBankSnapshots.Count(s => s.IdTown == town).Should().Be(1);
        }

        [Fact]
        public void Record_MemeContenuJourSuivant_Ecrit()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);
            var u2 = NewUpdate(db);
            Record(db, town, 3, u1, 2);

            Record(NewContext(), town, 4, u2, 2).Should().BeTrue();

            NewContext().TownBankSnapshots.Count(s => s.IdTown == town).Should().Be(2);
        }

        /// <summary>Jour 3 : u1 puis u2 (contenus différents) ; jour 4 : u3.</summary>
        private (int town, int u1, int u2, int u3) ScenarioPurge()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);
            var u2 = NewUpdate(db);
            var u3 = NewUpdate(db);
            Record(db, town, 3, u1, 1);
            Record(NewContext(), town, 3, u2, 2);
            Record(NewContext(), town, 4, u3, 3);
            return (town, u1, u2, u3);
        }

        [Fact]
        public void Record_NouveauJour_PurgeLesJoursEcoulesSaufLeDernier()
        {
            var (town, u1, u2, u3) = ScenarioPurge();

            var verify = NewContext();
            verify.TownBankSnapshots.Where(s => s.IdTown == town).Select(s => s.IdLastUpdateInfo).ToList()
                .Should().BeEquivalentTo(new[] { u2, u3 });
            verify.TownBankItems.Count(i => i.IdTown == town && i.IdLastUpdateInfo == u1).Should().Be(0);
            verify.TownBankItems.Count(i => i.IdTown == town && i.IdLastUpdateInfo == u2).Should().Be(1);
            verify.LastUpdateInfos.Any(l => l.IdLastUpdateInfo == u1).Should().BeTrue();
        }

        [Fact]
        public void Record_NeTouchePasLesAutresVilles()
        {
            var db = NewContext();
            var (other, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);
            var u2 = NewUpdate(db);
            var u3 = NewUpdate(db);
            // Mêmes idLastUpdateInfo pour les deux villes : seule la purge de `town` (u1) peut les atteindre.
            Record(db, other, 3, u1, 1);
            Record(NewContext(), other, 3, u2, 2);
            Record(NewContext(), town, 3, u1, 1);
            Record(NewContext(), town, 3, u2, 2);

            Record(NewContext(), town, 4, u3, 3);

            var verify = NewContext();
            verify.TownBankSnapshots.Count(s => s.IdTown == town && s.IdLastUpdateInfo == u1).Should().Be(0);
            verify.TownBankSnapshots.Where(s => s.IdTown == other).Select(s => s.IdLastUpdateInfo).ToList()
                .Should().BeEquivalentTo(new[] { u1, u2 });
            verify.TownBankItems.Count(i => i.IdTown == other && i.IdLastUpdateInfo == u1).Should().Be(1);
            verify.TownBankItems.Count(i => i.IdTown == other && i.IdLastUpdateInfo == u2).Should().Be(1);
        }

        [Fact]
        public void SuppressionDeVille_EffaceAussiLesEnTetes()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);
            Record(db, town, 3, u1, 2);
            NewContext().TownBankSnapshots.Count(s => s.IdTown == town).Should().Be(1);

            _factory.Services.CreateScope().ServiceProvider.GetRequiredService<ITownService>().DeleteTown(town);

            var verify = NewContext();
            verify.TownBankSnapshots.Count(s => s.IdTown == town).Should().Be(0);
            verify.TownBankItems.Count(i => i.IdTown == town).Should().Be(0);
        }

        [Fact]
        public void LatestSnapshotId_EtVisibleVersions()
        {
            var (town, _, u2, u3) = ScenarioPurge();

            var verify = NewContext();
            TownBankHistory.LatestSnapshotId(verify, town).Should().Be(u3);
            TownBankHistory.VisibleVersions(verify, town).Select(v => v.IdLastUpdateInfo)
                .Should().Equal(u2, u3);
            TownBankHistory.LatestSnapshotId(verify, -1).Should().BeNull();
        }

        [Fact]
        public void LatestSnapshotId_SansEnTete_ReplieSurLaDernierePhoto()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);
            var u2 = NewUpdate(db);
            db.TownBankItems.Add(new TownBankItem { IdTown = town, IdItem = db.Items.First().IdItem, IdLastUpdateInfo = u1, Count = 2, IsBroken = false });
            db.TownBankItems.Add(new TownBankItem { IdTown = town, IdItem = db.Items.First().IdItem, IdLastUpdateInfo = u2, Count = 5, IsBroken = false });
            db.SaveChanges();

            TownBankHistory.LatestSnapshotId(NewContext(), town).Should().Be(u2);
        }
    }
}
