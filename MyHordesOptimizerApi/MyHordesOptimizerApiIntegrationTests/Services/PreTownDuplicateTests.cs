using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Impl;
using MyHordesOptimizerApi.Services.Impl.PreTowns;
using MyHordesOptimizerApi.Services.Impl.PreTowns.Mergers;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class PreTownDuplicateTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private sealed class FailingMerger : IPreTownMerger
        {
            public string TableName => "Failing";

            public Task<MergeReport> MergeAsync(MhoContext db, int fromIdTown, int toIdTown) => throw new InvalidOperationException("boom");

            public Task<int> RemoveAsync(MhoContext db, int idTown, IReadOnlyList<string> rowKeys) => Task.FromResult(0);
        }

        private readonly MyHordesOptimizerApplicationFactory _factory;
        private static readonly Random Rng = new();

        public PreTownDuplicateTests(MyHordesOptimizerApplicationFactory factory)
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

        private static IPreTownMerger[] RealMergers() =>
            new IPreTownMerger[] { new WishListGroupMerger(), new WishListItemMerger(), new BuildingPlanMerger(), new BuildingPlanSettingsMerger(), new NightwatchPlanMerger(), new NoteMerger() };

        private (PreTownService service, MhoContext db) As(int userId, IEnumerable<IPreTownMerger>? mergers = null)
        {
            var db = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var userInfo = new UserInfoProvider { UserId = userId };
            return (new PreTownService(db, userInfo, TimeProvider.System, mergers ?? RealMergers()), db);
        }

        private async Task<int> NewPreTownWithDataAsync(int organizer)
        {
            var (service, db) = As(organizer);
            var preTownId = (await service.CreateAsync("Source")).PreTownId;
            var phantom = PreTownIds.ToIdTown(preTownId);
            var items = db.Items.Take(2).ToList();
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
        public async Task DuplicateAsync_ListeDeCourses_LectureOkSurLaCopie()
        {
            var organizer = NewUser("org");
            var sourceId = await NewPreTownWithDataAsync(organizer);
            var (service, _) = As(organizer);

            var dto = await service.DuplicateAsync(sourceId, "Copie");

            var wishList = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<IWishListService>().GetWishList(dto.MapId);
            wishList.WishList.Should().HaveCount(2);
            wishList.LastUpdateInfo.UserId.Should().Be(organizer);
        }

        [Fact]
        public async Task DuplicateAsync_CopieLeContenuSousSonIdTown_SourceInchangee()
        {
            var organizer = NewUser("org");
            var member = NewUser("member");
            var sourceId = await NewPreTownWithDataAsync(organizer);
            var (service, _) = As(organizer);
            await service.AddMemberAsync(sourceId, member);
            var before = await SnapshotAsync(PreTownIds.ToIdTown(sourceId));

            var dto = await service.DuplicateAsync(sourceId, "  Copie  ");

            dto.PreTownId.Should().NotBe(sourceId);
            dto.Alias.Should().Be("Copie");
            dto.IsOrganizer.Should().BeTrue();
            dto.IsLinked.Should().BeFalse();
            dto.Members.Should().ContainSingle(m => m.IdUser == organizer && m.IsOrganizer);
            var copy = await SnapshotAsync(PreTownIds.ToIdTown(dto.PreTownId));
            copy.Should().HaveCount(7);
            copy.Should().Equal(before);
            (await SnapshotAsync(PreTownIds.ToIdTown(sourceId))).Should().Equal(before);
            var db = NewDb();
            (await db.TownWishListItems.AsNoTracking().Where(i => i.IdTown == PreTownIds.ToIdTown(dto.PreTownId)).CountAsync(i => i.GroupUid != null)).Should().Be(1);
            (await db.PreTownLinkEntries.AsNoTracking().CountAsync(e => e.IdPreTown == dto.PreTownId)).Should().Be(0);
            (await db.Towns.AsNoTracking().SingleAsync(t => t.IdTown == PreTownIds.ToIdTown(dto.PreTownId))).Name.Should().Be("Copie");
        }

        [Fact]
        public async Task DuplicateAsync_SourceLiee_LaCopieNEstPasLiee()
        {
            var organizer = NewUser("org");
            var sourceId = await NewPreTownWithDataAsync(organizer);
            var db = NewDb();
            var source = await db.PreTowns.SingleAsync(p => p.IdPreTown == sourceId);
            source.LinkedIdTown = 123;
            source.LinkedMapId = 123;
            source.LinkedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            var (service, _) = As(organizer);

            var dto = await service.DuplicateAsync(sourceId, "Copie liee");

            dto.IsLinked.Should().BeFalse();
            (await SnapshotAsync(PreTownIds.ToIdTown(dto.PreTownId))).Should().HaveCount(7);
            var reloaded = await NewDb().PreTowns.AsNoTracking().SingleAsync(p => p.IdPreTown == sourceId);
            reloaded.LinkedIdTown.Should().Be(123);
        }

        [Fact]
        public async Task DuplicateAsync_NonOrganisateurOuNonMembre_Interdit()
        {
            var organizer = NewUser("org");
            var member = NewUser("member");
            var stranger = NewUser("stranger");
            var sourceId = await NewPreTownWithDataAsync(organizer);
            var (orgService, _) = As(organizer);
            await orgService.AddMemberAsync(sourceId, member);

            await As(member).service.Invoking(s => s.DuplicateAsync(sourceId, "X")).Should().ThrowAsync<MhoForbiddenException>();
            await As(stranger).service.Invoking(s => s.DuplicateAsync(sourceId, "X")).Should().ThrowAsync<MhoForbiddenException>();
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("TOO_LONG")]
        public async Task DuplicateAsync_AliasInvalide_Leve400_EtNeCreeRien(string alias)
        {
            var organizer = NewUser("org");
            var sourceId = await NewPreTownWithDataAsync(organizer);
            var (service, db) = As(organizer);
            var count = await db.PreTowns.AsNoTracking().CountAsync(p => p.IdCreator == organizer);
            alias = alias == "TOO_LONG" ? new string('a', 65) : alias;

            await service.Invoking(s => s.DuplicateAsync(sourceId, alias)).Should().ThrowAsync<MhoBadRequestException>();

            (await NewDb().PreTowns.AsNoTracking().CountAsync(p => p.IdCreator == organizer)).Should().Be(count);
        }

        [Fact]
        public async Task DuplicateAsync_UnMergerEchoue_RienNEstCree()
        {
            var organizer = NewUser("org");
            var sourceId = await NewPreTownWithDataAsync(organizer);
            var mergers = new IPreTownMerger[] { new WishListGroupMerger(), new FailingMerger() };
            var (service, db) = As(organizer, mergers);
            var count = await db.PreTowns.AsNoTracking().CountAsync(p => p.IdCreator == organizer);
            var alias = "Echec-" + Guid.NewGuid().ToString("N")[..8];

            await service.Invoking(s => s.DuplicateAsync(sourceId, alias)).Should().ThrowAsync<InvalidOperationException>();

            var check = NewDb();
            (await check.PreTowns.AsNoTracking().CountAsync(p => p.IdCreator == organizer)).Should().Be(count);
            (await check.PreTowns.AsNoTracking().AnyAsync(p => p.Alias == alias)).Should().BeFalse();
            (await check.Towns.AsNoTracking().AnyAsync(t => t.IdTown < 0 && t.Name == alias)).Should().BeFalse();
        }
    }
}
