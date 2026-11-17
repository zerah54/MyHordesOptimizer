using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Impl;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Impl.PreTowns;
using MyHordesOptimizerApi.Services.Impl.PreTowns.Mergers;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class PreTownLinkServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private sealed class FakeTimeProvider : TimeProvider
        {
            private DateTimeOffset _now = new(DateTime.UtcNow.Date.AddHours(12), TimeSpan.Zero);

            public override DateTimeOffset GetUtcNow() => _now;

            public void Advance(TimeSpan delta) => _now += delta;
        }

        private readonly MyHordesOptimizerApplicationFactory _factory;
        private readonly FakeTimeProvider _time = new();
        private static readonly Random Rng = new();

        public PreTownLinkServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private MhoContext NewDb() => _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();

        private int NewUser(string prefix)
        {
            var db = NewDb();
            int id;
            lock (Rng) { id = Rng.Next(1, int.MaxValue); }
            db.Users.Add(new User { IdUser = id, Name = prefix + "-" + Guid.NewGuid().ToString("N")[..8] });
            db.SaveChanges();
            return id;
        }

        /// <summary>Ville réelle (un citoyen vivant) dont le mapId est dans le jeton de l'utilisateur.</summary>
        private (int idTown, int citizen) NewRealTown(bool finished = false)
        {
            var db = NewDb();
            int idTown;
            lock (Rng) { idTown = Rng.Next(900_000_000, 999_999_999); }
            var citizen = NewUser("citizen");
            db.Towns.Add(new Town { IdTown = idTown, MapId = idTown, Name = "test-town-" + idTown, IsFinished = finished });
            db.SaveChanges();
            var info = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            db.LastUpdateInfos.Add(info);
            db.SaveChanges();
            db.TownCitizens.Add(new TownCitizen { IdTown = idTown, IdUser = citizen, JobUid = "job_none", IdLastUpdateInfo = info.IdLastUpdateInfo, Dead = false });
            db.SaveChanges();
            return (idTown, citizen);
        }

        private (PreTownLinkService link, PreTownService service, MhoContext db) As(int userId, int? tokenMapId)
        {
            var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var userInfo = new UserInfoProvider { UserId = userId, TownDetail = tokenMapId.HasValue ? new SimpleMeTownDetailDto { TownId = tokenMapId.Value } : null };
            var access = new TownAccessService(_factory.Services.GetRequiredService<IServiceScopeFactory>(), userInfo);
            var mergers = new IPreTownMerger[] { new WishListGroupMerger(), new WishListItemMerger(), new BuildingPlanMerger(), new BuildingPlanSettingsMerger(), new NightwatchPlanMerger(), new NoteMerger() };
            return (new PreTownLinkService(db, userInfo, access, mergers, _time, _factory.Services.GetRequiredService<TownSyncLock>()),
                new PreTownService(db, userInfo, _time, mergers), db);
        }

        /// <summary>Pré-ville dont la ville fantôme porte un exemplaire de chaque type de donnée.</summary>
        private async Task<int> NewPreTownWithDataAsync(int organizer)
        {
            var (_, service, db) = As(organizer, null);
            var preTownId = (await service.CreateAsync("Pre")).PreTownId;
            var phantom = PreTownIds.ToIdTown(preTownId);
            var items = db.Items.Take(3).ToList();
            var group = Guid.NewGuid().ToString();
            db.TownWishListGroups.Add(new TownWishListGroup { IdTown = phantom, Uid = group, Name = "G", Count = 1 });
            db.TownWishListItems.AddRange(
                new TownWishListItem { IdTown = phantom, IdItem = items[0].IdItem, ZoneXpa = 0, Count = 2, GroupUid = group },
                new TownWishListItem { IdTown = phantom, IdItem = items[1].IdItem, ZoneXpa = 0, Count = 1 });
            db.TownBuildingPlans.Add(new TownBuildingPlan { IdTown = phantom, Day = 2, Name = "B", Content = "b", IsEffective = true, IdAuthor = organizer });
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = phantom, Day = 2, Name = "N", Content = "n", IsEffective = true, IdAuthor = organizer });
            db.TownBuildingPlanSettings.Add(new TownBuildingPlanSettings { IdTown = phantom, ItemValues = "{}", Version = 1 });
            db.TownNotes.Add(new TownNote { IdTown = phantom, IdUserAuthor = organizer, Note = "note", UpdatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
            return preTownId;
        }

        /// <summary>Contenu de la ville sans les ids générés, pour comparer deux états.</summary>
        private async Task<List<string>> SnapshotAsync(int idTown)
        {
            var db = NewDb();
            var lines = new List<string>();
            lines.AddRange((await db.TownWishListGroups.AsNoTracking().Where(x => x.IdTown == idTown).ToListAsync()).Select(x => $"G|{x.Uid}|{x.Name}|{x.Count}"));
            lines.AddRange((await db.TownWishListItems.AsNoTracking().Where(x => x.IdTown == idTown).ToListAsync()).Select(x => $"I|{x.IdItem}|{x.ZoneXpa}|{x.Count}|{x.GroupUid}"));
            lines.AddRange((await db.TownBuildingPlans.AsNoTracking().Where(x => x.IdTown == idTown).ToListAsync()).Select(x => $"B|{x.Day}|{x.Name}|{x.Content}|{x.IsEffective}"));
            lines.AddRange((await db.TownNightwatchPlans.AsNoTracking().Where(x => x.IdTown == idTown).ToListAsync()).Select(x => $"N|{x.Day}|{x.Name}|{x.Content}|{x.IsEffective}"));
            lines.AddRange((await db.TownBuildingPlanSettings.AsNoTracking().Where(x => x.IdTown == idTown).ToListAsync()).Select(x => $"S|{x.ItemValues}|{x.Version}"));
            lines.AddRange((await db.TownNotes.AsNoTracking().Where(x => x.IdTown == idTown).ToListAsync()).Select(x => $"T|{x.IdUserAuthor}|{x.Note}"));
            return lines.OrderBy(l => l, StringComparer.Ordinal).ToList();
        }

        [Fact]
        public async Task LinkAsync_AjouteLesDonneesEtJournalise()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (link, _, db) = As(organizer, town);

            var result = await link.LinkAsync(preTownId);

            result.Added.Should().Be(7);
            result.Skipped.Should().Be(0);
            var preTown = await db.PreTowns.AsNoTracking().SingleAsync(p => p.IdPreTown == preTownId);
            (preTown.LinkedIdTown, preTown.LinkedMapId, preTown.IdLinker).Should().Be((town, town, organizer));
            preTown.LinkedAt.Should().Be(_time.GetUtcNow().UtcDateTime);
            (await SnapshotAsync(town)).Should().HaveCount(7);
            var entries = await db.PreTownLinkEntries.AsNoTracking().Where(e => e.IdPreTown == preTownId).ToListAsync();
            entries.Select(e => e.TableName).Distinct().Should().BeEquivalentTo("TownWishListGroup", "TownWishListItem", "TownBuildingPlan", "TownBuildingPlanSettings", "TownNightwatchPlan", "TownNote");
            entries.Should().HaveCount(7);
        }

        private string? WishListVersion(int mapId) => new ETagVersionService(NewDb()).GetVersion(ETagResource.WishList, mapId, 0);

        [Fact]
        public async Task LinkAsync_VilleSansHistoriqueDeListe_LectureOkEtVersionChange()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (link, _, _) = As(organizer, town);
            var before = WishListVersion(town);

            await link.LinkAsync(preTownId);

            var dto = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<IWishListService>().GetWishList(town);
            dto.WishList.Should().HaveCount(2);
            dto.LastUpdateInfo.UserId.Should().Be(organizer);
            WishListVersion(town).Should().NotBe(before).And.NotBeNull();
        }

        [Fact]
        public async Task UnlinkAsync_RetireDesObjets_LaVersionChangeEtLaLectureResteOk()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (link, _, _) = As(organizer, town);
            await link.LinkAsync(preTownId);
            var linked = WishListVersion(town);
            await Task.Delay(1100); // précision seconde de la colonne

            await link.UnlinkAsync(preTownId);

            WishListVersion(town).Should().NotBe(linked);
            _factory.Services.CreateScope().ServiceProvider.GetRequiredService<IWishListService>().GetWishList(town).WishList.Should().BeEmpty();
        }

        [Fact]
        public async Task LinkAsync_MemePreVilleVersDeuxVillesEnConcurrence_UneSeuleReussit()
        {
            var (townA, _) = NewRealTown();
            var (townB, _) = NewRealTown();
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (linkA, _, _) = As(organizer, townA);
            var (linkB, _, _) = As(organizer, townB);

            var results = await Task.WhenAll(
                Task.Run(async () => { try { await linkA.LinkAsync(preTownId); return true; } catch (MhoBadRequestException) { return false; } }),
                Task.Run(async () => { try { await linkB.LinkAsync(preTownId); return true; } catch (MhoBadRequestException) { return false; } }));

            results.Count(r => r).Should().Be(1);
            var linkedTowns = new[] { townA, townB }.Count(t => NewDb().TownWishListItems.AsNoTracking().Any(i => i.IdTown == t));
            linkedTowns.Should().Be(1);
        }

        [Fact]
        public async Task UnlinkAsync_PreVilleReliee_LEtatPerimeNeDefaitPasLeLienFrais()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (link, _, _) = As(organizer, town);
            await link.LinkAsync(preTownId);
            _time.Advance(TimeSpan.FromMinutes(61));
            var db = NewDb();
            // Fenêtre dépassée : le refus doit venir de l'état relu sous verrou.
            await link.Invoking(l => l.UnlinkAsync(preTownId)).Should().ThrowAsync<MhoBadRequestException>();
            (await db.PreTowns.AsNoTracking().SingleAsync(p => p.IdPreTown == preTownId)).LinkedIdTown.Should().Be(town);
        }

        [Fact]
        public async Task LinkAsync_AttendLeVerrouDeSynchroSurMoinsMapId()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (link, _, _) = As(organizer, town);
            var townLock = _factory.Services.GetRequiredService<TownSyncLock>();

            var gate = await townLock.AcquireTownAsync(-town);
            var pending = Task.Run(() => link.LinkAsync(preTownId));
            await Task.Delay(500);
            pending.IsCompleted.Should().BeFalse();
            await gate.DisposeAsync();

            await pending;
        }

        [Fact]
        public async Task LinkAsync_SecondeLiaison_Refusee()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (link, _, _) = As(organizer, town);
            await link.LinkAsync(preTownId);

            await link.Invoking(l => l.LinkAsync(preTownId)).Should().ThrowAsync<MhoBadRequestException>();
        }

        [Fact]
        public async Task LinkAsync_NonOrganisateur_Interdit()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var member = NewUser("member");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (_, orgService, _) = As(organizer, null);
            await orgService.AddMemberAsync(preTownId, member);
            var (link, _, _) = As(member, town);

            await link.Invoking(l => l.LinkAsync(preTownId)).Should().ThrowAsync<MhoForbiddenException>();
            await link.Invoking(l => l.PreviewAsync(preTownId)).Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task LinkAsync_VilleNonCouranteDeLUtilisateur_Interdit()
        {
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (noTown, _, _) = As(organizer, null);
            var (phantomTown, _, _) = As(organizer, PreTownIds.ToMapId(preTownId));

            await noTown.Invoking(l => l.LinkAsync(preTownId)).Should().ThrowAsync<MhoForbiddenException>();
            await phantomTown.Invoking(l => l.LinkAsync(preTownId)).Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task LinkAsync_VilleDejaLieeAUneAutrePreVille_Refusee()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var first = await NewPreTownWithDataAsync(organizer);
            var second = await NewPreTownWithDataAsync(organizer);
            var (link, _, db) = As(organizer, town);
            await link.LinkAsync(first);
            var before = await SnapshotAsync(town);

            await link.Invoking(l => l.LinkAsync(second)).Should().ThrowAsync<MhoBadRequestException>();

            (await SnapshotAsync(town)).Should().Equal(before);
            (await db.PreTowns.AsNoTracking().SingleAsync(p => p.IdPreTown == second)).LinkedIdTown.Should().BeNull();
        }

        [Fact]
        public async Task UnlinkAsync_ATPlus59Minutes_RestaureLEtatExactDeLaVille()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var items = NewDb().Items.Take(3).ToList();
            // Ligne identique déjà présente dans la cible : ignorée à la liaison, donc à conserver au délien.
            var seed = NewDb();
            seed.TownWishListItems.Add(new TownWishListItem { IdTown = town, IdItem = items[1].IdItem, ZoneXpa = 0, Count = 1 });
            await seed.SaveChangesAsync();
            var before = await SnapshotAsync(town);
            var (link, _, db) = As(organizer, town);
            await link.LinkAsync(preTownId);
            // Ligne ajoutée par quelqu'un d'autre après la liaison : jamais touchée.
            seed.TownWishListItems.Add(new TownWishListItem { IdTown = town, IdItem = items[2].IdItem, ZoneXpa = 0, Count = 5 });
            await seed.SaveChangesAsync();
            _time.Advance(TimeSpan.FromMinutes(59));

            await link.UnlinkAsync(preTownId);

            var expected = before.Append($"I|{items[2].IdItem}|0|5|").OrderBy(l => l, StringComparer.Ordinal);
            (await SnapshotAsync(town)).Should().Equal(expected);
            var preTown = await NewDb().PreTowns.AsNoTracking().SingleAsync(p => p.IdPreTown == preTownId);
            (preTown.LinkedIdTown, preTown.LinkedMapId, preTown.LinkedAt, preTown.IdLinker).Should().Be((null, null, null, null));
            (await NewDb().PreTownLinkEntries.AsNoTracking().CountAsync(e => e.IdPreTown == preTownId)).Should().Be(0);
            (await SnapshotAsync(PreTownIds.ToIdTown(preTownId))).Should().HaveCount(7);
        }

        [Fact]
        public async Task UnlinkAsync_ATPlus61Minutes_Refuse()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (link, _, _) = As(organizer, town);
            await link.LinkAsync(preTownId);
            _time.Advance(TimeSpan.FromMinutes(61));

            await link.Invoking(l => l.UnlinkAsync(preTownId)).Should().ThrowAsync<MhoBadRequestException>();

            (await SnapshotAsync(town)).Should().HaveCount(7);
        }

        [Fact]
        public async Task UnlinkAsync_NonLiee_Refuse()
        {
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (link, _, _) = As(organizer, null);

            await link.Invoking(l => l.UnlinkAsync(preTownId)).Should().ThrowAsync<MhoBadRequestException>();
        }

        [Fact]
        public async Task UnlinkAsync_NonOrganisateur_Interdit()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var member = NewUser("member");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (link, orgService, _) = As(organizer, town);
            await orgService.AddMemberAsync(preTownId, member);
            await link.LinkAsync(preTownId);
            var (memberLink, _, _) = As(member, town);

            await memberLink.Invoking(l => l.UnlinkAsync(preTownId)).Should().ThrowAsync<MhoForbiddenException>();
        }

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        public async Task UnlinkAsync_VilleTerminee_Refuse(bool viaIsFinished)
        {
            var (town, citizen) = NewRealTown();
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (link, _, db) = As(organizer, town);
            await link.LinkAsync(preTownId);
            var other = NewDb();
            if (viaIsFinished)
            {
                (await other.Towns.SingleAsync(t => t.IdTown == town)).IsFinished = true;
            }
            else
            {
                (await other.TownCitizens.SingleAsync(c => c.IdTown == town && c.IdUser == citizen)).Dead = true;
            }
            await other.SaveChangesAsync();

            await link.Invoking(l => l.UnlinkAsync(preTownId)).Should().ThrowAsync<MhoBadRequestException>();
        }

        [Fact]
        public async Task UnlinkAsync_LigneJournaliseeSupprimeeALaMain_NEchouePas()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (link, _, _) = As(organizer, town);
            await link.LinkAsync(preTownId);
            var other = NewDb();
            await other.TownNotes.Where(n => n.IdTown == town).ExecuteDeleteAsync();
            await other.TownWishListItems.Where(i => i.IdTown == town).ExecuteDeleteAsync();

            await link.Invoking(l => l.UnlinkAsync(preTownId)).Should().NotThrowAsync();

            (await SnapshotAsync(town)).Should().BeEmpty();
            (await NewDb().PreTownLinkEntries.AsNoTracking().CountAsync(e => e.IdPreTown == preTownId)).Should().Be(0);
        }

        [Fact]
        public async Task PreviewAsync_CompteSansRienPersisterEtEstRepetable()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            // Une note du même auteur existe déjà dans la cible : comptée comme ignorée.
            var seed = NewDb();
            seed.TownNotes.Add(new TownNote { IdTown = town, IdUserAuthor = organizer, Note = "cible", UpdatedAt = DateTime.UtcNow });
            await seed.SaveChangesAsync();
            var before = await SnapshotAsync(town);
            var (link, _, db) = As(organizer, town);

            var first = await link.PreviewAsync(preTownId);
            var second = await link.PreviewAsync(preTownId);

            second.Should().BeEquivalentTo(first);
            (first.Added, first.Skipped, first.SkippedNotes, first.MapId, first.TownName).Should().Be((6, 1, 1, town, "test-town-" + town));
            (await SnapshotAsync(town)).Should().Equal(before);
            (await NewDb().PreTownLinkEntries.AsNoTracking().CountAsync(e => e.IdPreTown == preTownId)).Should().Be(0);
            (await NewDb().PreTowns.AsNoTracking().SingleAsync(p => p.IdPreTown == preTownId)).LinkedIdTown.Should().BeNull();
            (await link.LinkAsync(preTownId)).Added.Should().Be(6);
        }

        [Fact]
        public async Task GetAsync_CanUnlink_SuitLaRegleDeLaDeliaison()
        {
            var (town, _) = NewRealTown();
            var organizer = NewUser("org");
            var member = NewUser("member");
            var preTownId = await NewPreTownWithDataAsync(organizer);
            var (link, orgService, _) = As(organizer, town);
            await orgService.AddMemberAsync(preTownId, member);
            (await orgService.GetAsync(preTownId)).CanUnlink.Should().BeFalse();
            await link.LinkAsync(preTownId);
            var (_, memberService, _) = As(member, town);

            _time.Advance(TimeSpan.FromMinutes(59));
            var at59 = await orgService.GetAsync(preTownId);
            var memberAt59 = await memberService.GetAsync(preTownId);
            _time.Advance(TimeSpan.FromMinutes(2));
            var at61 = await orgService.GetAsync(preTownId);

            at59.CanUnlink.Should().BeTrue();
            at59.LinkedAt.Should().NotBeNull();
            memberAt59.CanUnlink.Should().BeFalse();
            at61.CanUnlink.Should().BeFalse();
        }
    }
}
