using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Import;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Import;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// MHO_BETA contient de vraies villes : les clés de test restent dans 900 000 000..999 999 999
    /// (et leurs négatives), les sélections s'assertent par Contains et CaptureAsync reçoit toujours
    /// onlyRankingIds.
    /// </summary>
    [Collection("TownSnapshot")]
    public class TownSnapshotServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>, IAsyncLifetime
    {
        private const int Low = 900_000_000;
        private const int High = 999_999_999;

        private readonly MyHordesOptimizerApplicationFactory _factory;
        private readonly List<int> _createdTownIds = new();

        public TownSnapshotServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        public Task InitializeAsync() => CleanAsync();

        public Task DisposeAsync() => CleanAsync();

        private MhoContext NewContext() => _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();

        private async Task CleanAsync()
        {
            using var db = NewContext();
            await db.Database.ExecuteSqlRawAsync($"DELETE FROM TownRankingSnapshotCitizen WHERE rankingId BETWEEN {Low} AND {High}");
            await db.Database.ExecuteSqlRawAsync($"DELETE FROM TownRankingSnapshot WHERE rankingId BETWEEN {Low} AND {High}");
            var ids = _createdTownIds.ToList();
            _createdTownIds.Clear();
            if (ids.Count > 0)
            {
                await db.Database.ExecuteSqlRawAsync($"DELETE FROM Town WHERE idTown IN ({string.Join(",", ids)})");
            }
        }

        private TownSnapshotService NewService(FakeTownRepository repo)
            => new(NewContext(), repo, NullLogger<TownSnapshotService>.Instance);

        private void AddTowns(params Town[] towns)
        {
            using var db = NewContext();
            _createdTownIds.AddRange(towns.Select(t => t.IdTown));
            db.Towns.AddRange(towns);
            db.SaveChanges();
        }

        private static Town T(int id, int? phase, int? season = null, int? mapId = null, bool finished = false)
            => new() { IdTown = id, PhaseId = phase, Season = season, MapId = mapId ?? id, IsFinished = finished };

        private static void ShouldContain(IReadOnlyList<(int RankingId, string SuspectClass)> result, int id, string cls)
            => result.Should().Contain((id, cls));

        private static void ShouldNotBeInClass(IReadOnlyList<(int RankingId, string SuspectClass)> result, string cls, params int[] ids)
            => result.Where(r => r.SuspectClass == cls).Select(r => r.RankingId).Should().NotContain(ids);

        /// <summary>200 villes IMPORT terminées et 25 non terminées, sans classe : le tirage 180/20 est exact même si la plage D de la base absorbe le reste.</summary>
        private void AddWitnessPool()
            => AddTowns(Enumerable.Range(Low + 3000, 225).Select(i => T(i, 2, mapId: -i, finished: i < Low + 3200)).ToArray());

        private void AssertWitnesses(IReadOnlyList<(int RankingId, string SuspectClass)> result, int finished, int unfinished)
        {
            var witnesses = result.Where(r => r.SuspectClass == "T").Select(r => r.RankingId).ToList();
            result.Select(r => r.RankingId).Should().OnlyHaveUniqueItems();
            using var db = NewContext();
            var rows = db.Towns.AsNoTracking().Where(t => witnesses.Contains(t.IdTown)).ToList();
            rows.Should().HaveCount(witnesses.Count).And.OnlyContain(t => t.PhaseId == 2 && t.IdTown > 0);
            rows.Count(t => t.IsFinished).Should().Be(finished);
            rows.Count(t => !t.IsFinished).Should().Be(unfinished);
        }

        private void AssertStable(IReadOnlyList<(int RankingId, string SuspectClass)> first)
        {
            var second = NewService(new FakeTownRepository()).SelectCandidates();
            second.Where(r => r.SuspectClass == "T").Select(r => r.RankingId)
                .Should().BeEquivalentTo(first.Where(r => r.SuspectClass == "T").Select(r => r.RankingId));
        }

        private DateTime CapturedAt(int id)
        {
            using var db = NewContext();
            return db.Database.SqlQueryRaw<DateTime>($"SELECT capturedAt AS Value FROM TownRankingSnapshot WHERE rankingId = {id}").AsEnumerable().Single();
        }

        private int Scalar(string sql)
        {
            using var db = NewContext();
            return db.Database.SqlQueryRaw<int>(sql).AsEnumerable().Single();
        }

        [Fact]
        public void SelectCandidates_ClasseC_NativeDontLesRangsDivergent()
        {
            AddTowns(T(Low + 100, 3, 18, mapId: 1), T(Low + 101, 3, 18, mapId: Low + 101));

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            ShouldContain(result, Low + 100, "C");
            result.Where(r => r.SuspectClass != "T").Select(r => r.RankingId).Should().NotContain(Low + 101);
        }

        [Fact]
        public void SelectCandidates_ClasseAlpha_VilleDeLaListeAlpha()
        {
            AddTowns(T(Low + 200, 0));
            var repo = new FakeTownRepository { AlphaList = new List<int> { Low + 200, Low + 201 } };

            var result = NewService(repo).SelectCandidates();

            ShouldContain(result, Low + 200, "ALPHA");
            ShouldContain(result, Low + 201, "ALPHA");
        }

        [Fact]
        public void SelectCandidates_ClasseA_AlphaStable()
        {
            AddTowns(T(Low + 300, 0));

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            ShouldContain(result, Low + 300, "A");
        }

        [Fact]
        public void SelectCandidates_ClasseAPrime_ImportSaisonZeroTermineeMapIdBas()
        {
            AddTowns(
                T(Low + 400, 2, 0, mapId: 900, finished: true),
                T(Low + 401, 2, 0, mapId: Low + 401, finished: true),
                T(Low + 402, 2, 0, mapId: -(Low + 402), finished: false));

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            ShouldContain(result, Low + 400, "A'");
            ShouldNotBeInClass(result, "A'", Low + 401, Low + 402);
        }

        [Fact]
        public void SelectCandidates_ClasseB_LesDeuxLignesSiLaPlusPetiteEstTerminee()
        {
            AddTowns(
                T(Low + 500, 2, 5, mapId: Low + 5000, finished: true),
                T(Low + 501, 2, 5, mapId: Low + 5000, finished: false));

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            ShouldContain(result, Low + 500, "B");
            ShouldContain(result, Low + 501, "B");
        }

        [Fact]
        public void SelectCandidates_ClasseB_AucuneLigneTermineeHorsClasse()
        {
            AddTowns(
                T(Low + 510, 2, 5, mapId: Low + 5100, finished: false),
                T(Low + 511, 2, 5, mapId: Low + 5100, finished: false));

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            ShouldNotBeInClass(result, "B", Low + 510, Low + 511);
        }

        [Fact]
        public void SelectCandidates_ClasseB_SeuleLaPlusGrandeTermineeHorsClasse()
        {
            AddTowns(
                T(Low + 520, 2, 5, mapId: Low + 5200, finished: false),
                T(Low + 521, 2, 5, mapId: Low + 5200, finished: true));

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            ShouldNotBeInClass(result, "B", Low + 520, Low + 521);
        }

        [Fact]
        public void SelectCandidates_ClasseE_NativeAvecLigneProvisoire()
        {
            AddTowns(T(Low + 600, 3, 18, mapId: Low + 6000), T(-(Low + 6000), 3, 18, mapId: Low + 6000));

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            ShouldContain(result, Low + 600, "E");
        }

        [Fact]
        public void SelectCandidates_ClasseN19_NativeSaisonDixNeuf()
        {
            AddTowns(T(Low + 700, 3, 19, mapId: Low + 700));

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            ShouldContain(result, Low + 700, "N19");
        }

        [Fact]
        public void SelectCandidates_ClasseD_ImportDansLaPlageDesNativesS19()
        {
            AddTowns(
                T(Low + 800, 3, 19, mapId: Low + 800),
                T(Low + 801, 3, 19, mapId: Low + 810),
                T(Low + 802, 2, 18, mapId: Low + 805));

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            ShouldContain(result, Low + 802, "D");
        }

        [Fact]
        public void SelectCandidates_ClasseD_BornesIncluentLesNativesAClefNegative()
        {
            AddTowns(
                T(-(Low + 1100), 3, 19, mapId: 2_147_480_000),
                T(Low + 1101, 2, 18, mapId: 2_147_470_000));

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            ShouldContain(result, Low + 1101, "D");
        }

        [Fact]
        public void SelectCandidates_ClasseD_SousLaBorne_HorsClasse()
        {
            AddTowns(T(Low + 1110, 2, 77, mapId: 5));

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            ShouldNotBeInClass(result, "D", Low + 1110);
        }

        [Fact]
        public void SelectCandidates_ClasseT_TirageComplet_180Et20()
        {
            AddWitnessPool();

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            AssertWitnesses(result, 180, 20);
            AssertStable(result);
        }

        [Fact]
        public void SelectCandidates_ClasseT_Reprise_GardeLesCapturesEtComplete()
        {
            AddWitnessPool();
            AddTowns(T(Low + 900, 2, mapId: -(Low + 900), finished: true), T(Low + 901, 2, mapId: -(Low + 901)));
            using (var db = NewContext())
            {
                db.Database.ExecuteSqlRaw(
                    $"INSERT INTO TownRankingSnapshot (rankingId, suspectClass, isAbsent, capturedAt) VALUES ({Low + 900}, 'T', 0, NOW()), ({Low + 901}, 'T', 0, NOW())");
            }

            var result = NewService(new FakeTownRepository()).SelectCandidates();

            ShouldContain(result, Low + 900, "T");
            ShouldContain(result, Low + 901, "T");
            AssertWitnesses(result, 180, 20);
            AssertStable(result);
        }

        [Fact]
        public void SelectCandidates_ListeAlphaVide_Echoue()
        {
            var act = () => NewService(new FakeTownRepository { AlphaList = new List<int>() }).SelectCandidates();

            act.Should().Throw<InvalidOperationException>().WithMessage("*alpha*");
        }

        [Fact]
        public void SelectCandidates_ExclutLesClesNegatives()
        {
            AddTowns(T(-(Low + 1000), 0), T(-(Low + 1001), 3, 19, mapId: Low + 1001));
            var repo = new FakeTownRepository { AlphaList = new List<int> { -(Low + 1000) } };

            var result = NewService(repo).SelectCandidates();

            result.Should().OnlyContain(r => r.RankingId > 0);
        }

        [Fact]
        public async Task CaptureAsync_DecoupeParLotsDe50()
        {
            var ids = Enumerable.Range(Low + 2000, 120).ToList();
            AddTowns(ids.Select(id => T(id, 0)).ToArray());
            var repo = new FakeTownRepository();

            await NewService(repo).CaptureAsync(false, ids, null);

            repo.Batches.Select(b => b.Count).Should().Equal(50, 50, 20);
        }

        [Fact]
        public async Task CaptureAsync_EnregistreLaReponseBruteEtLesCitoyens()
        {
            var id = Low + 2200;
            AddTowns(T(id, 0));
            var repo = new FakeTownRepository();
            repo.Details[id] = new MyHordesTownDetailsDto
            {
                Id = id, MapId = 77, Name = "Ville", Language = "fr", Season = 3, Phase = "alpha", Day = 12, Score = 40,
                Citizens = new List<MyHordesCitizenRankingDto> { new() { Id = Low + 1 }, new() { Id = Low + 2 } }
            };

            await NewService(repo).CaptureAsync(false, new[] { id }, null);

            Scalar($"SELECT COUNT(*) AS Value FROM TownRankingSnapshot WHERE rankingId = {id} AND mapId = 77 AND phaseLabel = 'alpha' AND season = 3 AND language = 'fr' AND name = 'Ville' AND day = 12 AND score = 40 AND suspectClass = 'A' AND isAbsent = 0 AND capturedAt IS NOT NULL")
                .Should().Be(1);
            using var db = NewContext();
            db.Database.SqlQueryRaw<int>($"SELECT idUser AS Value FROM TownRankingSnapshotCitizen WHERE rankingId = {id}").ToList()
                .Should().BeEquivalentTo(new[] { Low + 1, Low + 2 });
        }

        [Fact]
        public async Task CaptureAsync_VilleNonRenvoyee_LaMarqueAbsente()
        {
            var id = Low + 2300;
            AddTowns(T(id, 0));
            var repo = new FakeTownRepository { Omit = { id } };

            await NewService(repo).CaptureAsync(false, new[] { id }, null);

            Scalar($"SELECT COUNT(*) AS Value FROM TownRankingSnapshot WHERE rankingId = {id} AND isAbsent = 1 AND suspectClass = 'A' AND capturedAt IS NOT NULL AND mapId IS NULL AND phaseLabel IS NULL AND season IS NULL AND language IS NULL AND name IS NULL AND day IS NULL AND score IS NULL")
                .Should().Be(1);
        }

        [Fact]
        public async Task CaptureAsync_Quota_SArreteEtGardeLesLotsPrecedents()
        {
            var ids = Enumerable.Range(Low + 2400, 120).ToList();
            AddTowns(ids.Select(id => T(id, 0)).ToArray());
            var repo = new FakeTownRepository { ThrowQuotaOnCall = 2 };
            var steps = new List<ImportStepProgress>();

            await NewService(repo).CaptureAsync(false, ids, steps.Add);

            Scalar($"SELECT COUNT(*) AS Value FROM TownRankingSnapshot WHERE rankingId BETWEEN {Low + 2400} AND {Low + 2519}")
                .Should().Be(50);
            repo.Batches.Should().HaveCount(2);
            steps.Should().Contain(s => s.Message != null);
        }

        [Fact]
        public async Task CaptureAsync_SansRefresh_NeReinterrogePasLesVillesCapturees()
        {
            var ids = new[] { Low + 2600, Low + 2601 };
            AddTowns(ids.Select(id => T(id, 0)).ToArray());
            var repo = new FakeTownRepository();
            var service = NewService(repo);

            await service.CaptureAsync(false, ids, null);
            repo.Batches.Clear();
            await service.CaptureAsync(false, ids, null);

            repo.Batches.Should().BeEmpty();
        }

        [Fact]
        public async Task CaptureAsync_AvecRefresh_RemplaceLesCitoyensCaptures()
        {
            var id = Low + 2700;
            AddTowns(T(id, 0));
            var repo = new FakeTownRepository();
            repo.Details[id] = new MyHordesTownDetailsDto
            {
                Id = id, Citizens = new List<MyHordesCitizenRankingDto> { new() { Id = Low + 1 }, new() { Id = Low + 2 } }
            };
            await NewService(repo).CaptureAsync(false, new[] { id }, null);

            repo.Details[id] = new MyHordesTownDetailsDto
            {
                Id = id, Citizens = new List<MyHordesCitizenRankingDto> { new() { Id = Low + 2 }, new() { Id = Low + 3 } }
            };
            await NewService(repo).CaptureAsync(true, new[] { id }, null);

            using var db = NewContext();
            db.Database.SqlQueryRaw<int>($"SELECT idUser AS Value FROM TownRankingSnapshotCitizen WHERE rankingId = {id}").ToList()
                .Should().BeEquivalentTo(new[] { Low + 2, Low + 3 });
        }

        [Fact]
        public async Task CaptureAsync_Refresh_VilleDevenueAbsente_GardeSaPreuve()
        {
            var id = Low + 2900;
            AddTowns(T(id, 0));
            var repo = new FakeTownRepository();
            repo.Details[id] = new MyHordesTownDetailsDto
            {
                Id = id, MapId = 77, Name = "Ville", Language = "fr", Season = 3, Phase = "alpha", Day = 12, Score = 40,
                Citizens = new List<MyHordesCitizenRankingDto> { new() { Id = Low + 1 }, new() { Id = Low + 2 } }
            };
            await NewService(repo).CaptureAsync(false, new[] { id }, null);
            var before = CapturedAt(id);
            await Task.Delay(1200);
            repo.Omit.Add(id);
            var logger = new CapturingLogger();

            await new TownSnapshotService(NewContext(), repo, logger).CaptureAsync(true, new[] { id }, null);

            Scalar($"SELECT COUNT(*) AS Value FROM TownRankingSnapshot WHERE rankingId = {id} AND isAbsent = 1 AND mapId = 77 AND phaseLabel = 'alpha' AND season = 3 AND language = 'fr' AND name = 'Ville' AND day = 12 AND score = 40 AND suspectClass = 'A'")
                .Should().Be(1);
            Scalar($"SELECT COUNT(*) AS Value FROM TownRankingSnapshotCitizen WHERE rankingId = {id}").Should().Be(2);
            CapturedAt(id).Should().Be(before);
            logger.Warnings.Should().NotBeEmpty();
        }

        [Fact]
        public async Task CaptureAsync_Refresh_VilleAbsenteRevenue_EstReecrite()
        {
            var id = Low + 2950;
            AddTowns(T(id, 0));
            var repo = new FakeTownRepository { Omit = { id } };
            await NewService(repo).CaptureAsync(false, new[] { id }, null);
            repo.Omit.Clear();
            repo.Details[id] = new MyHordesTownDetailsDto
            {
                Id = id, MapId = 88, Name = "Revenue", Season = 4, Phase = "native",
                Citizens = new List<MyHordesCitizenRankingDto> { new() { Id = Low + 7 } }
            };

            await NewService(repo).CaptureAsync(true, new[] { id }, null);

            Scalar($"SELECT COUNT(*) AS Value FROM TownRankingSnapshot WHERE rankingId = {id} AND isAbsent = 0 AND mapId = 88 AND name = 'Revenue' AND season = 4 AND phaseLabel = 'native'")
                .Should().Be(1);
            Scalar($"SELECT COUNT(*) AS Value FROM TownRankingSnapshotCitizen WHERE rankingId = {id} AND idUser = {Low + 7}").Should().Be(1);
        }

        [Fact]
        public async Task CaptureAsync_NomAvecEmoji_ConserveTelQuel()
        {
            var id = Low + 3300;
            AddTowns(T(id, 0));
            var repo = new FakeTownRepository();
            repo.Details[id] = new MyHordesTownDetailsDto { Id = id, Name = "Ville 🧟 test", Language = "fr" };

            await NewService(repo).CaptureAsync(false, new[] { id }, null);

            using var db = NewContext();
            db.Database.SqlQueryRaw<string>($"SELECT name AS Value FROM TownRankingSnapshot WHERE rankingId = {id}").AsEnumerable().Single()
                .Should().Be("Ville 🧟 test");
        }

        [Fact]
        public async Task CaptureAsync_NeModifieAucuneLigneTown()
        {
            var id = Low + 2800;
            AddTowns(T(id, 0, 4, mapId: 12));
            var repo = new FakeTownRepository();
            repo.Details[id] = new MyHordesTownDetailsDto
            {
                Id = id, MapId = 99, Name = "Autre", Season = 9, Phase = "native",
                Citizens = new List<MyHordesCitizenRankingDto> { new() { Id = Low + 5 } }
            };
            string Fingerprint()
            {
                using var db = NewContext();
                var total = db.Towns.Count();
                var t = db.Towns.AsNoTracking().Single(x => x.IdTown == id);
                return $"{total}|{t.MapId}|{t.Name}|{t.Season}|{t.PhaseId}|{t.Language}|{t.Score}|{t.IsFinished}|{db.TownCitizens.Count()}|{db.Users.Count()}";
            }
            var before = Fingerprint();

            await NewService(repo).CaptureAsync(true, new[] { id }, null);

            Fingerprint().Should().Be(before);
        }

        private sealed class CapturingLogger : Microsoft.Extensions.Logging.ILogger<TownSnapshotService>
        {
            public List<string> Warnings { get; } = new();

            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

            public bool IsEnabled(Microsoft.Extensions.Logging.LogLevel logLevel) => true;

            public void Log<TState>(Microsoft.Extensions.Logging.LogLevel logLevel, Microsoft.Extensions.Logging.EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            {
                if (logLevel == Microsoft.Extensions.Logging.LogLevel.Warning)
                {
                    Warnings.Add(formatter(state, exception));
                }
            }
        }

        private sealed class FakeTownRepository : IMyHordesApiRepository
        {
            public List<int> AlphaList { get; set; } = new() { Low + 999_000 };
            public Dictionary<int, MyHordesTownDetailsDto> Details { get; } = new();
            public HashSet<int> Omit { get; } = new();
            public List<List<int>> Batches { get; } = new();
            public int? ThrowQuotaOnCall { get; set; }

            public List<int> GetAlphaTownList() => AlphaList;

            public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids)
            {
                Batches.Add(ids.ToList());
                if (ThrowQuotaOnCall == Batches.Count)
                {
                    throw new MyHordesApiException("quota", HttpStatusCode.TooManyRequests);
                }
                return ids.Where(id => !Omit.Contains(id))
                    .Select(id => Details.TryGetValue(id, out var d) ? d : new MyHordesTownDetailsDto { Id = id })
                    .ToList();
            }

            public Dictionary<string, MyHordesItem> GetItems() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMe() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMeIdentity() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new NotImplementedException();
            public MyHordesUserDetailsDto GetUserPictos(int userId) => throw new NotImplementedException();
            public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => throw new NotImplementedException();
            public Dictionary<string, MyHordesApiPictoDto> GetPictos() => throw new NotImplementedException();
            public Dictionary<string, MyHordesApiRuinDto> GetRuins() => throw new NotImplementedException();
            public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => throw new NotImplementedException();
            public List<int> GetTownList(int? season = null) => throw new NotImplementedException();
            public MyHordesMap GetMapDetails(int mapId) => throw new NotImplementedException();
        }
    }
}
