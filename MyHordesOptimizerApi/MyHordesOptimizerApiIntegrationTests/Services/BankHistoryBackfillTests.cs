using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Import;
using MyHordesOptimizerApi.Services.Impl.Bank;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Requiert 2026_11_21_town_bank_snapshot.sql sur la base de test.</summary>
    public class BankHistoryBackfillTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public BankHistoryBackfillTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private MhoContext NewContext() => _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();

        /// <summary>Photo sans en-tête : un LastUpdateInfo daté et une ligne de banque.</summary>
        private static int SeedPhoto(MhoContext db, int town, DateTime updateUtc, int count)
        {
            var update = db.LastUpdateInfos.Add(new LastUpdateInfo { DateUpdate = updateUtc }).Entity;
            db.SaveChanges();
            SeedLine(db, town, update.IdLastUpdateInfo, count);
            return update.IdLastUpdateInfo;
        }

        /// <summary>Ligne de banque d'une ville pour un LastUpdateInfo déjà existant.</summary>
        private static void SeedLine(MhoContext db, int town, int idLastUpdateInfo, int count)
        {
            db.TownBankItems.Add(new TownBankItem { IdTown = town, IdItem = db.Items.First().IdItem, IdLastUpdateInfo = idLastUpdateInfo, Count = count, IsBroken = false });
            db.SaveChanges();
        }

        /// <summary>Fouille datée de <paramref name="updateUtc"/> au jour de jeu <paramref name="day"/>.</summary>
        private static void SeedDig(MhoContext db, int town, int user, DateTime updateUtc, int day, int x)
        {
            var update = db.LastUpdateInfos.Add(new LastUpdateInfo { DateUpdate = updateUtc }).Entity;
            var cell = db.MapCells.Add(new MapCell { IdTown = town, X = x, Y = 1 }).Entity;
            db.SaveChanges();
            db.MapCellDigs.Add(new MapCellDig { IdCell = cell.IdCell, IdUser = user, Day = day, IdLastUpdateInfo = update.IdLastUpdateInfo });
            db.SaveChanges();
        }

        /// <summary>Reprise limitée aux villes données : un test ne doit jamais toucher une autre ville de la base.</summary>
        private static Task Run(MhoContext db, params int[] towns) => RunWithSteps(db, new List<ImportStepProgress>(), towns);

        private static Task RunWithSteps(MhoContext db, List<ImportStepProgress> steps, params int[] towns) =>
            new BankHistoryBackfillService(db, NullLogger<BankHistoryBackfillService>.Instance).RunAsync(steps.Add, towns);

        private static DateTime YesterdayUtc(int hour) => DateTime.UtcNow.Date.AddDays(-1).AddHours(hour);

        /// <summary>Ville au jour 5 ; fouille d'aujourd'hui = jour 5 ; 2 photos hier (jour 4), 1 aujourd'hui.</summary>
        private (int town, int u1, int u2, int u3) ScenarioFouilles()
        {
            var db = NewContext();
            var (town, user, _, _) = AttackTestSupport.SeedTown(db, 5);
            var now = DateTime.UtcNow;
            SeedDig(db, town, user, now, 5, 1);
            SeedDig(db, town, user, YesterdayUtc(11), 4, 2);
            var u1 = SeedPhoto(db, town, YesterdayUtc(9), 1);
            var u2 = SeedPhoto(db, town, YesterdayUtc(11), 2);
            var u3 = SeedPhoto(db, town, now, 3);
            return (town, u1, u2, u3);
        }

        [Fact]
        public async Task Run_DateLesPhotosAvecLesFouillesEtGardeLaDerniereDesJoursEcoules()
        {
            var (town, u1, u2, u3) = ScenarioFouilles();

            await Run(NewContext(), town);

            var verify = NewContext();
            verify.TownBankSnapshots.Where(s => s.IdTown == town).OrderBy(s => s.IdLastUpdateInfo)
                .Select(s => new { s.IdLastUpdateInfo, s.Day }).ToList()
                .Should().BeEquivalentTo(new[] { new { IdLastUpdateInfo = u2, Day = 4 }, new { IdLastUpdateInfo = u3, Day = 5 } });
            verify.TownBankItems.Where(i => i.IdTown == town).Select(i => i.IdLastUpdateInfo).ToList()
                .Should().BeEquivalentTo(new[] { u2, u3 });
            verify.TownBankItems.Count(i => i.IdLastUpdateInfo == u1).Should().Be(0);
        }

        [Fact]
        public async Task Run_VilleSansPaireEtPhotoAncienne_SeuleLaDerniereRestee()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 5);
            SeedPhoto(db, town, DateTime.UtcNow.AddDays(-6), 1);
            var last = SeedPhoto(db, town, DateTime.UtcNow.AddDays(-3), 2);

            await Run(NewContext(), town);

            var verify = NewContext();
            var header = verify.TownBankSnapshots.Single(s => s.IdTown == town);
            header.IdLastUpdateInfo.Should().Be(last);
            header.Day.Should().Be(5);
            verify.TownBankItems.Where(i => i.IdTown == town).Select(i => i.IdLastUpdateInfo).Should().Equal(last);
        }

        [Fact]
        public async Task Run_Relance_SansEffet()
        {
            var (town, _, _, _) = ScenarioFouilles();
            await Run(NewContext(), town);
            var before = NewContext();
            var headers = before.TownBankSnapshots.Where(s => s.IdTown == town).Select(s => new { s.IdLastUpdateInfo, s.Day, s.ContentHash }).ToList();
            var lines = before.TownBankItems.Count(i => i.IdTown == town);

            await Run(NewContext(), town);

            var after = NewContext();
            after.TownBankSnapshots.Where(s => s.IdTown == town).Select(s => new { s.IdLastUpdateInfo, s.Day, s.ContentHash }).ToList()
                .Should().BeEquivalentTo(headers);
            after.TownBankItems.Count(i => i.IdTown == town).Should().Be(lines);
        }

        [Fact]
        public async Task Run_NeSupprimeAucunLastUpdateInfo()
        {
            var (town, u1, u2, u3) = ScenarioFouilles();

            await Run(NewContext(), town);

            NewContext().LastUpdateInfos.Count(l => new[] { u1, u2, u3 }.Contains(l.IdLastUpdateInfo)).Should().Be(3);
        }

        [Fact]
        public async Task Run_NeTouchePasUnePhotoDejaEnTete()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 5);
            var withHeader = SeedPhoto(db, town, DateTime.UtcNow.AddDays(-9), 1);
            db.TownBankSnapshots.Add(new TownBankSnapshot { IdTown = town, IdLastUpdateInfo = withHeader, Day = 1, ContentHash = new string('a', 64) });
            db.SaveChanges();
            SeedPhoto(NewContext(), town, DateTime.UtcNow.AddDays(-3), 2);

            await Run(NewContext(), town);

            var verify = NewContext();
            verify.TownBankItems.Count(i => i.IdTown == town && i.IdLastUpdateInfo == withHeader).Should().Be(1);
            verify.TownBankSnapshots.Count(s => s.IdTown == town && s.IdLastUpdateInfo == withHeader).Should().Be(1);
        }

        [Fact]
        public async Task Run_SuppressionFiltreeParVille_MemeIdLastUpdateInfoGardeDansUneAutre()
        {
            var db = NewContext();
            var (townA, user, _, _) = AttackTestSupport.SeedTown(db, 5);
            var (townB, _, _, _) = AttackTestSupport.SeedTown(db, 5);
            SeedDig(db, townA, user, DateTime.UtcNow, 5, 1);
            SeedDig(db, townA, user, YesterdayUtc(11), 4, 2);
            var shared = SeedPhoto(db, townA, YesterdayUtc(9), 1);
            var u2 = SeedPhoto(db, townA, YesterdayUtc(11), 2);
            SeedLine(db, townB, shared, 7);

            await Run(NewContext(), townA, townB);

            var verify = NewContext();
            verify.TownBankItems.Count(i => i.IdTown == townA && i.IdLastUpdateInfo == shared).Should().Be(0);
            verify.TownBankItems.Count(i => i.IdTown == townA && i.IdLastUpdateInfo == u2).Should().Be(1);
            verify.TownBankItems.Count(i => i.IdTown == townB && i.IdLastUpdateInfo == shared).Should().Be(1);
            verify.TownBankSnapshots.Count(s => s.IdTown == townB && s.IdLastUpdateInfo == shared).Should().Be(1);
        }

        [Fact]
        public async Task Run_VilleEnEchec_SignaleeEtNEmpechePasLaSuivante()
        {
            var db = NewContext();
            var (good, _, _, _) = AttackTestSupport.SeedTown(db, 5);
            var last = SeedPhoto(db, good, DateTime.UtcNow.AddDays(-3), 2);
            // Id improbable, trié avant `good`, dont l'absence de Towns et de TownBankItem est vérifiée.
            var bad = -new Random().Next(1_000_000_000, 2_000_000_000);
            db.Towns.Any(t => t.IdTown == bad).Should().BeFalse("la ville orpheline ne doit pas exister");
            db.TownBankItems.Any(i => i.IdTown == bad).Should().BeFalse("aucune ligne ne doit exister sous l'id orphelin");
            var update = db.LastUpdateInfos.Add(new LastUpdateInfo { DateUpdate = DateTime.UtcNow.AddDays(-3) }).Entity;
            db.SaveChanges();
            db.Database.ExecuteSqlRaw(
                "SET FOREIGN_KEY_CHECKS=0; INSERT INTO TownBankItem (idTown, idItem, idLastUpdateInfo, count, isBroken) VALUES ({0}, {1}, {2}, 1, 0); SET FOREIGN_KEY_CHECKS=1;",
                bad, db.Items.First().IdItem, update.IdLastUpdateInfo);
            var steps = new List<ImportStepProgress>();
            try
            {
                await RunWithSteps(NewContext(), steps, bad, good);

                var verify = NewContext();
                verify.TownBankSnapshots.Single(s => s.IdTown == good).IdLastUpdateInfo.Should().Be(last);
                verify.TownBankSnapshots.Count(s => s.IdTown == bad).Should().Be(0);
                verify.TownBankItems.Count(i => i.IdTown == bad).Should().Be(1);
                steps.Select(s => s.Message).Should().Contain($"1 ville(s) en échec, dernière : {bad}");
            }
            finally
            {
                var id = update.IdLastUpdateInfo;
                NewContext().TownBankItems.Where(i => i.IdTown == bad && i.IdLastUpdateInfo == id).ExecuteDelete();
            }
        }

        /// <summary>Contexte dont la sauvegarde échoue APRÈS avoir écrit (en-têtes insérés dans la transaction de la ville).</summary>
        private sealed class FailAfterSaveContext : MhoContext
        {
            public FailAfterSaveContext(DbContextOptions<MhoContext> options, IMyHordesOptimizerSqlConfiguration configuration, ILoggerFactory loggerFactory)
                : base(options, configuration, loggerFactory) { }

            public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            {
                await base.SaveChangesAsync(cancellationToken);
                throw new InvalidOperationException("échec simulé après écriture");
            }
        }

        [Fact]
        public async Task Run_EchecApresEcritures_AnnuleLaTransactionDeLaVille()
        {
            var db = NewContext();
            var (town, _, _, _) = AttackTestSupport.SeedTown(db, 5);
            var u1 = SeedPhoto(db, town, DateTime.UtcNow.AddDays(-6), 1);
            var u2 = SeedPhoto(db, town, DateTime.UtcNow.AddDays(-3), 2);
            using var scope = _factory.Services.CreateScope();
            var sp = scope.ServiceProvider;
            using var failing = new FailAfterSaveContext(
                sp.GetRequiredService<DbContextOptions<MhoContext>>(),
                sp.GetRequiredService<IMyHordesOptimizerSqlConfiguration>(),
                sp.GetRequiredService<ILoggerFactory>());
            var steps = new List<ImportStepProgress>();

            await new BankHistoryBackfillService(failing, NullLogger<BankHistoryBackfillService>.Instance).RunAsync(steps.Add, new[] { town });

            var verify = NewContext();
            verify.TownBankSnapshots.Count(s => s.IdTown == town).Should().Be(0);
            verify.TownBankItems.Where(i => i.IdTown == town).Select(i => i.IdLastUpdateInfo).Should().BeEquivalentTo(new[] { u1, u2 });
            steps.Should().Contain(s => s.Message != null);
        }
    }
}
