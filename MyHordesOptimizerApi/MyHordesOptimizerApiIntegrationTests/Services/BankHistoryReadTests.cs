using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.Bank;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Impl.Nightwatch;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Requiert 2026_11_21_town_bank_snapshot.sql sur la base de test.</summary>
    public class BankHistoryReadTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public BankHistoryReadTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private MhoContext NewContext() => _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();

        private IMyHordesFetcherService NewFetcher() => _factory.Services.CreateScope().ServiceProvider.GetRequiredService<IMyHordesFetcherService>();

        private static int NewUpdate(MhoContext db, int? userId = null)
        {
            var update = db.LastUpdateInfos.Add(new LastUpdateInfo { DateUpdate = System.DateTime.UtcNow, IdUser = userId }).Entity;
            db.SaveChanges();
            return update.IdLastUpdateInfo;
        }

        private static int FirstItemId(MhoContext db) => db.Items.Where(i => !i.IsObsolete).OrderBy(i => i.IdItem).First().IdItem;

        private static void Record(MhoContext db, int town, int day, int update, int count)
        {
            TownBankHistory.Record(db, town, day, update, new List<TownBankItem> { new() { IdItem = FirstItemId(db), Count = count, IsBroken = false } });
            db.SaveChanges();
        }

        [Fact]
        public void GetBank_SansVersion_RenvoieLaPlusRecente()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);
            var u2 = NewUpdate(db);
            Record(db, town, 3, u1, 2);
            Record(db, town, 3, u2, 5);

            var bank = NewFetcher().GetBank(town, null)!;

            bank.LastUpdateInfo.Should().NotBeNull();
            bank.Bank.Single().Count.Should().Be(5);
        }

        [Fact]
        public void GetBank_VersionDemandee_RenvoieSonContenu()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);
            var u2 = NewUpdate(db);
            Record(db, town, 3, u1, 2);
            Record(db, town, 3, u2, 5);

            var bank = NewFetcher().GetBank(town, u1)!;

            bank.Bank.Single().Count.Should().Be(2);
        }

        [Fact]
        public void GetBank_VersionBanqueVide_ListeVideAvecSonAuteur()
        {
            var db = NewContext();
            var (town, alive, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db, alive);
            var u2 = NewUpdate(db);
            TownBankHistory.Record(db, town, 3, u1, new List<TownBankItem>());
            db.SaveChanges();
            Record(db, town, 3, u2, 5);

            var bank = NewFetcher().GetBank(town, u1)!;

            bank.Bank.Should().BeEmpty();
            bank.LastUpdateInfo!.UserName.Should().Be("test-alive-" + alive);
        }

        [Fact]
        public void GetBank_VersionDUneAutreVille_Null()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var (other, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);
            Record(db, other, 3, u1, 2);

            NewFetcher().GetBank(town, u1).Should().BeNull();
        }

        [Fact]
        public void GetBank_VersionMasqueeDUnJourEcoule_Null()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 4);
            var ids = new List<int>();
            foreach (var day in new[] { 3, 3, 4 })
            {
                var id = NewUpdate(db);
                ids.Add(id);
                db.TownBankSnapshots.Add(new TownBankSnapshot { IdTown = town, IdLastUpdateInfo = id, Day = day, ContentHash = new string((char)('a' + ids.Count), 64) });
            }
            db.SaveChanges();

            NewFetcher().GetBank(town, ids[0]).Should().BeNull();
        }

        [Fact]
        public void GetBankVersions_VilleSansVersion_ListeVide()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);

            NewFetcher().GetBankVersions(town).Should().BeEmpty();
        }

        [Fact]
        public void GetBankVersions_RenvoieJourAuteurEtHeure()
        {
            var db = NewContext();
            var (town, alive, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db, alive);
            Record(db, town, 3, u1, 2);

            var version = NewFetcher().GetBankVersions(town).Single();

            version.Day.Should().Be(3);
            version.LastUpdateId.Should().Be(u1);
            version.UserName.Should().Be("test-alive-" + alive);
            version.UpdateTime.Kind.Should().Be(System.DateTimeKind.Utc);
        }

        [Fact]
        public void GetBankVersions_JourEcouleNonPurge_UneSeuleVersion()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 4);
            var ids = new List<int>();
            foreach (var day in new[] { 3, 3, 4, 4 })
            {
                var id = NewUpdate(db);
                ids.Add(id);
                db.TownBankSnapshots.Add(new TownBankSnapshot { IdTown = town, IdLastUpdateInfo = id, Day = day, ContentHash = new string((char)('a' + ids.Count), 64) });
            }
            db.SaveChanges();

            var versions = NewFetcher().GetBankVersions(town);

            versions.Select(v => v.LastUpdateId).Should().Equal(ids[1], ids[2], ids[3]);
        }

        [Fact]
        public void GetItems_ComptesDeBanque_DeLaDerniereVersionSeulement()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);
            var u2 = NewUpdate(db);
            Record(db, town, 3, u1, 2);
            Record(db, town, 3, u2, 5);

            var items = NewFetcher().GetItems(town);

            items.Single(i => i.Id == FirstItemId(db)).BankCount.Should().Be(5);
        }

        [Fact]
        public void GetItems_SansEnTete_ComptesDeLaDernierePhoto()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);
            var u2 = NewUpdate(db);
            db.TownBankItems.Add(new TownBankItem { IdTown = town, IdItem = FirstItemId(db), IdLastUpdateInfo = u1, Count = 2, IsBroken = false });
            db.TownBankItems.Add(new TownBankItem { IdTown = town, IdItem = FirstItemId(db), IdLastUpdateInfo = u2, Count = 5, IsBroken = false });
            db.SaveChanges();

            var items = NewFetcher().GetItems(town);

            items.Single(i => i.Id == FirstItemId(db)).BankCount.Should().Be(5);
        }

        /// <summary>Ville passée au jour 4 par l'import, sans nouvelle photo : jour 3 avec trois versions.</summary>
        private List<int> ScenarioJourDeVilleSansPhoto()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 4);
            var ids = new List<int> { town };
            foreach (var _ in new[] { 1, 2, 3 })
            {
                var id = NewUpdate(db);
                ids.Add(id);
                db.TownBankSnapshots.Add(new TownBankSnapshot { IdTown = town, IdLastUpdateInfo = id, Day = 3, ContentHash = new string((char)('a' + ids.Count), 64) });
            }
            db.SaveChanges();
            return ids;
        }

        [Fact]
        public void GetBankVersions_JourDeVilleApresLeDernierEnTete_UneSeuleVersion()
        {
            var ids = ScenarioJourDeVilleSansPhoto();

            NewFetcher().GetBankVersions(ids[0]).Select(v => v.LastUpdateId).Should().Equal(ids[3]);
        }

        [Fact]
        public void GetBank_VersionMasqueeParLeJourDeVille_Null()
        {
            var ids = ScenarioJourDeVilleSansPhoto();

            NewFetcher().GetBank(ids[0], ids[1]).Should().BeNull();
        }

        [Fact]
        public async Task NightwatchPlan_Banque_DeLaDerniereVersionSeulement()
        {
            var db = NewContext();
            var (town, alive, _, _) = AttackTestSupport.SeedTown(db, 3);
            var u1 = NewUpdate(db);
            var u2 = NewUpdate(db);
            Record(db, town, 3, u1, 2);
            Record(db, town, 3, u2, 5);
            var provider = _factory.Services.CreateScope().ServiceProvider;
            var userInfo = provider.GetRequiredService<IUserInfoProvider>();
            userInfo.UserId = alive;
            userInfo.TownDetail = null!;
            var service = new NightwatchPlanService(
                provider.GetRequiredService<MhoContext>(),
                userInfo,
                new TownAccessService(provider.GetRequiredService<IServiceScopeFactory>(), userInfo),
                provider.GetRequiredService<TownSyncLock>(),
                provider.GetRequiredService<IMapper>());

            var state = await service.GetStateAsync(town, 3);

            state.Bank[FirstItemId(db)].Should().Be(5);
        }
    }
}
