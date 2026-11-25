using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.PreTowns.Mergers;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class PreTownMergerTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public PreTownMergerTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private static readonly Random Rng = new();

        /// <summary>Deux villes (source, cible) aux noms préfixés "test-town" pour le nettoyage de fin de test.</summary>
        private (MhoContext db, int from, int to) Seed()
        {
            var db = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            int from, to;
            lock (Rng)
            {
                from = Rng.Next(900_000_000, 949_999_999);
                to = Rng.Next(950_000_000, 999_999_999);
            }
            var suffix = Guid.NewGuid().ToString("N")[..8];
            db.Towns.Add(new Town { IdTown = from, Name = "test-town-from-" + suffix, MapId = from });
            db.Towns.Add(new Town { IdTown = to, Name = "test-town-to-" + suffix, MapId = to });
            db.SaveChanges();
            return (db, from, to);
        }

        [Fact]
        public void TableName_EstLeNomSqlExact()
        {
            new BuildingPlanMerger().TableName.Should().Be("TownBuildingPlan");
            new BuildingPlanSettingsMerger().TableName.Should().Be("TownBuildingPlanSettings");
            new NightwatchPlanMerger().TableName.Should().Be("TownNightwatchPlan");
            new WishListItemMerger().TableName.Should().Be("TownWishListItem");
            new WishListGroupMerger().TableName.Should().Be("TownWishListGroup");
            new NoteMerger().TableName.Should().Be("TownNote");
        }

        [Fact]
        public async Task BuildingPlan_Absent_AjouteUneCopieAvecNouvelIdEtGardeEffective()
        {
            var (db, from, to) = Seed();
            db.TownBuildingPlans.Add(new TownBuildingPlan { IdTown = from, Day = 3, Name = "P", IsEffective = true, Content = "{\"a\":1}", Version = 7, IdAuthor = 42 });
            await db.SaveChangesAsync();
            var source = await db.TownBuildingPlans.AsNoTracking().SingleAsync(p => p.IdTown == from);

            var report = await new BuildingPlanMerger().MergeAsync(db, from, to);

            var copy = await db.TownBuildingPlans.AsNoTracking().SingleAsync(p => p.IdTown == to);
            copy.IdTownBuildingPlan.Should().NotBe(source.IdTownBuildingPlan);
            (copy.Day, copy.Name, copy.Content, copy.IdAuthor, copy.IsEffective).Should().Be((3, "P", "{\"a\":1}", 42, true));
            copy.Version.Should().Be(0);
            report.AddedRowKeys.Should().Equal(copy.IdTownBuildingPlan.ToString());
            report.Skipped.Should().Be(0);
            (await db.TownBuildingPlans.AsNoTracking().CountAsync(p => p.IdTown == from)).Should().Be(1);
        }

        [Fact]
        public async Task BuildingPlan_CibleADejaUneEffectiveCeJour_CopieNonEffectiveEtCibleIntacte()
        {
            var (db, from, to) = Seed();
            db.TownBuildingPlans.Add(new TownBuildingPlan { IdTown = to, Day = 3, Name = "Cible", IsEffective = true, Content = "c", Version = 4, IdAuthor = 1 });
            db.TownBuildingPlans.Add(new TownBuildingPlan { IdTown = from, Day = 3, Name = "S1", IsEffective = true, Content = "s1", IdAuthor = 2 });
            db.TownBuildingPlans.Add(new TownBuildingPlan { IdTown = from, Day = 4, Name = "S2", IsEffective = true, Content = "s2", IdAuthor = 2 });
            await db.SaveChangesAsync();

            var report = await new BuildingPlanMerger().MergeAsync(db, from, to);

            var plans = await db.TownBuildingPlans.AsNoTracking().Where(p => p.IdTown == to).ToListAsync();
            plans.Should().HaveCount(3);
            plans.Single(p => p.Name == "Cible").Should().Match<TownBuildingPlan>(p => p.IsEffective && p.Version == 4 && p.Content == "c");
            plans.Single(p => p.Name == "S1").IsEffective.Should().BeFalse();
            plans.Single(p => p.Name == "S2").IsEffective.Should().BeTrue();
            report.AddedRowKeys.Should().HaveCount(2);
        }

        [Fact]
        public async Task Nightwatch_Absent_AjouteUneCopie_EtNonEffectiveSiCibleDejaEffective()
        {
            var (db, from, to) = Seed();
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = to, Day = 2, Name = "Cible", IsEffective = true, Content = "c", IdAuthor = 1 });
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = from, Day = 2, Name = "S1", IsEffective = true, Content = "s1", IdAuthor = 5 });
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = from, Day = 5, Name = "S2", IsEffective = true, Content = "s2", IdAuthor = 5 });
            await db.SaveChangesAsync();

            var report = await new NightwatchPlanMerger().MergeAsync(db, from, to);

            var plans = await db.TownNightwatchPlans.AsNoTracking().Where(p => p.IdTown == to).ToListAsync();
            plans.Should().HaveCount(3);
            plans.Single(p => p.Name == "S1").IsEffective.Should().BeFalse();
            plans.Single(p => p.Name == "S2").Should().Match<TownNightwatchPlan>(p => p.IsEffective && p.IdAuthor == 5 && p.Content == "s2");
            report.AddedRowKeys.Should().BeEquivalentTo(plans.Where(p => p.Name != "Cible").Select(p => p.IdTownNightwatchPlan.ToString()));
        }

        [Fact]
        public async Task NightwatchPlanMerger_DetachesSimulation()
        {
            var (db, from, to) = Seed();
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = from, Day = 3, Name = "Sim", IsEffective = true, Content = "s", IdAuthor = 5, IdTownNightwatchSimulation = 42 });
            await db.SaveChangesAsync();

            await new NightwatchPlanMerger().MergeAsync(db, from, to);

            var copy = await db.TownNightwatchPlans.AsNoTracking().SingleAsync(p => p.IdTown == to);
            copy.IdTownNightwatchSimulation.Should().BeNull();
            copy.IsEffective.Should().BeTrue();
        }

        [Fact]
        public async Task NightwatchPlanMerger_IgnoreLesPropositionsDeSimulationNonEffectives()
        {
            var (db, from, to) = Seed();
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = from, Day = 3, Name = "Sim", IsEffective = false, Content = "s", IdAuthor = 5, IdTownNightwatchSimulation = 42 });
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = from, Day = 3, Name = "Ordinaire", IsEffective = false, Content = "o", IdAuthor = 5 });
            await db.SaveChangesAsync();

            var report = await new NightwatchPlanMerger().MergeAsync(db, from, to);

            var copy = await db.TownNightwatchPlans.AsNoTracking().SingleAsync(p => p.IdTown == to);
            copy.Name.Should().Be("Ordinaire");
            report.AddedRowKeys.Should().Equal(copy.IdTownNightwatchPlan.ToString());
        }

        [Fact]
        public async Task Plans_VersVraieVille_RetirentLesCitoyensSimules()
        {
            var (db, from, to) = Seed();
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = from, Day = 1, Name = "V", Content = "{\"Watchers\":[{\"UserId\":-1},{\"UserId\":7}]}", IdAuthor = 1 });
            db.TownBuildingPlans.Add(new TownBuildingPlan { IdTown = from, Day = 1, Name = "C", Content = "{\"Citizens\":[{\"UserId\":-2},{\"UserId\":8}]}", IdAuthor = 1 });
            await db.SaveChangesAsync();

            await new NightwatchPlanMerger().MergeAsync(db, from, to);
            await new BuildingPlanMerger().MergeAsync(db, from, to);

            (await db.TownNightwatchPlans.AsNoTracking().SingleAsync(p => p.IdTown == to)).Content.Should().Be("{\"Watchers\":[{\"UserId\":7}]}");
            (await db.TownBuildingPlans.AsNoTracking().SingleAsync(p => p.IdTown == to)).Content.Should().Be("{\"Citizens\":[{\"UserId\":8}]}");
        }

        [Fact]
        public async Task Plans_VersPreVille_GardentLesCitoyensSimules()
        {
            var (db, from, _) = Seed();
            int preTownMapId;
            lock (Rng) { preTownMapId = PreTownIds.Offset + Rng.Next(900_000_000, 999_999_999); }
            db.Towns.Add(new Town { IdTown = -preTownMapId, Name = "test-town-pre-" + Guid.NewGuid().ToString("N")[..8], MapId = preTownMapId });
            const string content = "{\"Watchers\":[{\"UserId\":-1}]}";
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = from, Day = 1, Name = "V", Content = content, IdAuthor = 1 });
            await db.SaveChangesAsync();

            await new NightwatchPlanMerger().MergeAsync(db, from, -preTownMapId);

            (await db.TownNightwatchPlans.AsNoTracking().SingleAsync(p => p.IdTown == -preTownMapId)).Content.Should().Be(content);
        }

        [Fact]
        public async Task Settings_Absents_SontCopies()
        {
            var (db, from, to) = Seed();
            db.TownBuildingPlanSettings.Add(new TownBuildingPlanSettings { IdTown = from, ItemValues = "{\"1\":2}", Version = 3 });
            await db.SaveChangesAsync();

            var report = await new BuildingPlanSettingsMerger().MergeAsync(db, from, to);

            var copy = await db.TownBuildingPlanSettings.AsNoTracking().SingleAsync(s => s.IdTown == to);
            copy.ItemValues.Should().Be("{\"1\":2}");
            report.AddedRowKeys.Should().Equal(to.ToString());
            report.Skipped.Should().Be(0);
        }

        [Fact]
        public async Task Settings_Presents_RestentIntactsEtSontComptesIgnores()
        {
            var (db, from, to) = Seed();
            db.TownBuildingPlanSettings.Add(new TownBuildingPlanSettings { IdTown = from, ItemValues = "src", Version = 1 });
            db.TownBuildingPlanSettings.Add(new TownBuildingPlanSettings { IdTown = to, ItemValues = "cible", Version = 9 });
            await db.SaveChangesAsync();

            var report = await new BuildingPlanSettingsMerger().MergeAsync(db, from, to);

            var target = await db.TownBuildingPlanSettings.AsNoTracking().SingleAsync(s => s.IdTown == to);
            (target.ItemValues, target.Version).Should().Be(("cible", 9));
            report.AddedRowKeys.Should().BeEmpty();
            report.Skipped.Should().Be(1);
        }

        [Fact]
        public async Task WishListGroup_AbsentAjoute_PresentIgnore()
        {
            var (db, from, to) = Seed();
            var added = Guid.NewGuid().ToString();
            var shared = Guid.NewGuid().ToString();
            db.TownWishListGroups.AddRange(
                new TownWishListGroup { IdTown = from, Uid = added, Name = "A", Priority = 2, ZoneXpa = 3, Depot = 1, Count = 5 },
                new TownWishListGroup { IdTown = from, Uid = shared, Name = "S", Count = 1 },
                new TownWishListGroup { IdTown = to, Uid = shared, Name = "Cible", Count = 9 });
            await db.SaveChangesAsync();

            var report = await new WishListGroupMerger().MergeAsync(db, from, to);

            var groups = await db.TownWishListGroups.AsNoTracking().Where(g => g.IdTown == to).ToListAsync();
            groups.Should().HaveCount(2);
            groups.Single(g => g.Uid == shared).Should().Match<TownWishListGroup>(g => g.Name == "Cible" && g.Count == 9);
            groups.Single(g => g.Uid == added).Should().Match<TownWishListGroup>(g => g.Name == "A" && g.Priority == 2 && g.ZoneXpa == 3 && g.Depot == 1 && g.Count == 5);
            report.AddedRowKeys.Should().Equal(added);
            report.Skipped.Should().Be(1);
        }

        [Fact]
        public async Task WishListItem_AbsentAjoute_PresentIgnore_GroupeAbsentRemappeANull()
        {
            var (db, from, to) = Seed();
            var items = db.Items.Take(3).ToList();
            var keptGroup = Guid.NewGuid().ToString();
            var lostGroup = Guid.NewGuid().ToString();
            db.TownWishListGroups.Add(new TownWishListGroup { IdTown = to, Uid = keptGroup, Name = "K" });
            db.TownWishListItems.AddRange(
                new TownWishListItem { IdTown = from, IdItem = items[0].IdItem, ZoneXpa = 0, Count = 1, Priority = 2, Depot = 3, ShouldSignal = true, GroupUid = keptGroup },
                new TownWishListItem { IdTown = from, IdItem = items[1].IdItem, ZoneXpa = 0, Count = 1, GroupUid = lostGroup },
                new TownWishListItem { IdTown = from, IdItem = items[2].IdItem, ZoneXpa = 4, Count = 1 },
                new TownWishListItem { IdTown = to, IdItem = items[2].IdItem, ZoneXpa = 4, Count = 99 });
            await db.SaveChangesAsync();

            var report = await new WishListItemMerger().MergeAsync(db, from, to);

            var rows = await db.TownWishListItems.AsNoTracking().Where(i => i.IdTown == to).ToListAsync();
            rows.Should().HaveCount(3);
            rows.Single(i => i.IdItem == items[0].IdItem).Should().Match<TownWishListItem>(i => i.GroupUid == keptGroup && i.Priority == 2 && i.Depot == 3 && i.ShouldSignal == true);
            rows.Single(i => i.IdItem == items[1].IdItem).GroupUid.Should().BeNull();
            rows.Single(i => i.IdItem == items[2].IdItem).Count.Should().Be(99);
            report.AddedRowKeys.Should().BeEquivalentTo($"{items[0].IdItem}|0", $"{items[1].IdItem}|0");
            report.Skipped.Should().Be(1);
        }

        [Fact]
        public async Task Note_AjouteeAvecNouvelId_IgnoreeSiLAuteurANDejaUneNoteDansLaCible()
        {
            var (db, from, to) = Seed();
            var (newAuthor, sharedAuthor) = (Rng.Next(1, int.MaxValue), Rng.Next(1, int.MaxValue));
            db.Users.AddRange(new User { IdUser = newAuthor, Name = "test-user-" + newAuthor }, new User { IdUser = sharedAuthor, Name = "test-user-" + sharedAuthor });
            await db.SaveChangesAsync();
            var date = new DateTime(2026, 1, 2, 3, 4, 5);
            db.TownNotes.Add(new TownNote { IdTown = from, IdUserAuthor = newAuthor, Note = "n", UpdatedAt = date });
            db.TownNotes.Add(new TownNote { IdTown = from, IdUserAuthor = sharedAuthor, Note = "src", UpdatedAt = date });
            db.TownNotes.Add(new TownNote { IdTown = to, IdUserAuthor = sharedAuthor, Note = "cible", UpdatedAt = date });
            await db.SaveChangesAsync();

            var report = await new NoteMerger().MergeAsync(db, from, to);

            var notes = await db.TownNotes.AsNoTracking().Where(n => n.IdTown == to).ToListAsync();
            notes.Should().HaveCount(2);
            notes.Single(n => n.IdUserAuthor == sharedAuthor).Note.Should().Be("cible");
            var copy = notes.Single(n => n.IdUserAuthor == newAuthor);
            (copy.Note, copy.UpdatedAt).Should().Be(("n", date));
            report.AddedRowKeys.Should().Equal(copy.IdTownNote.ToString());
            report.Skipped.Should().Be(1);
        }

        [Fact]
        public async Task BuildingPlan_Remove_SupprimeSeulementLesClesJournaliseesEtIgnoreLesAbsentes()
        {
            var (db, from, to) = Seed();
            db.TownBuildingPlans.Add(new TownBuildingPlan { IdTown = from, Day = 1, Name = "S", Content = "s", IdAuthor = 1 });
            db.TownBuildingPlans.Add(new TownBuildingPlan { IdTown = to, Day = 1, Name = "Existant", Content = "e", IdAuthor = 1 });
            await db.SaveChangesAsync();
            var report = await new BuildingPlanMerger().MergeAsync(db, from, to);

            var removed = await new BuildingPlanMerger().RemoveAsync(db, to, report.AddedRowKeys.Append("999999999").Append("pas-un-id").ToList());

            removed.Should().Be(1);
            (await db.TownBuildingPlans.AsNoTracking().Where(p => p.IdTown == to).Select(p => p.Name).ToListAsync()).Should().Equal("Existant");
            (await db.TownBuildingPlans.AsNoTracking().CountAsync(p => p.IdTown == from)).Should().Be(1);
        }

        [Fact]
        public async Task Nightwatch_Remove_SupprimeSeulementLesClesJournaliseesEtIgnoreLesAbsentes()
        {
            var (db, from, to) = Seed();
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = from, Day = 1, Name = "S", Content = "s", IdAuthor = 1 });
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = to, Day = 1, Name = "Existant", Content = "e", IdAuthor = 1 });
            await db.SaveChangesAsync();
            var report = await new NightwatchPlanMerger().MergeAsync(db, from, to);

            var removed = await new NightwatchPlanMerger().RemoveAsync(db, to, report.AddedRowKeys.Append("999999999").ToList());

            removed.Should().Be(1);
            (await db.TownNightwatchPlans.AsNoTracking().Where(p => p.IdTown == to).Select(p => p.Name).ToListAsync()).Should().Equal("Existant");
        }

        [Fact]
        public async Task Settings_Remove_SupprimeLaLigneJournaliseeEtLaisseLaPreexistante()
        {
            var (db, from, to) = Seed();
            db.TownBuildingPlanSettings.Add(new TownBuildingPlanSettings { IdTown = from, ItemValues = "src", Version = 1 });
            await db.SaveChangesAsync();
            var report = await new BuildingPlanSettingsMerger().MergeAsync(db, from, to);

            (await new BuildingPlanSettingsMerger().RemoveAsync(db, to, new[] { "12345" })).Should().Be(0);
            (await new BuildingPlanSettingsMerger().RemoveAsync(db, to, report.AddedRowKeys.ToList())).Should().Be(1);
            (await new BuildingPlanSettingsMerger().RemoveAsync(db, to, report.AddedRowKeys.ToList())).Should().Be(0);

            (await db.TownBuildingPlanSettings.AsNoTracking().AnyAsync(s => s.IdTown == to)).Should().BeFalse();
            (await db.TownBuildingPlanSettings.AsNoTracking().AnyAsync(s => s.IdTown == from)).Should().BeTrue();
        }

        [Fact]
        public async Task WishListGroup_Remove_SupprimeSeulementLesUidsJournalises()
        {
            var (db, from, to) = Seed();
            var added = Guid.NewGuid().ToString();
            var shared = Guid.NewGuid().ToString();
            db.TownWishListGroups.AddRange(
                new TownWishListGroup { IdTown = from, Uid = added, Name = "A", Count = 1 },
                new TownWishListGroup { IdTown = to, Uid = shared, Name = "Cible", Count = 9 });
            await db.SaveChangesAsync();
            var report = await new WishListGroupMerger().MergeAsync(db, from, to);

            var removed = await new WishListGroupMerger().RemoveAsync(db, to, report.AddedRowKeys.Append(shared.Replace(shared, Guid.NewGuid().ToString())).ToList());

            removed.Should().Be(1);
            (await db.TownWishListGroups.AsNoTracking().Where(g => g.IdTown == to).Select(g => g.Uid).ToListAsync()).Should().Equal(shared);
        }

        [Fact]
        public async Task WishListItem_Remove_SupprimeSeulementLesCouplesJournalises()
        {
            var (db, from, to) = Seed();
            var items = db.Items.Take(2).ToList();
            db.TownWishListItems.AddRange(
                new TownWishListItem { IdTown = from, IdItem = items[0].IdItem, ZoneXpa = 0, Count = 1 },
                new TownWishListItem { IdTown = from, IdItem = items[1].IdItem, ZoneXpa = 0, Count = 1 },
                new TownWishListItem { IdTown = to, IdItem = items[1].IdItem, ZoneXpa = 0, Count = 99 });
            await db.SaveChangesAsync();
            var report = await new WishListItemMerger().MergeAsync(db, from, to);

            var removed = await new WishListItemMerger().RemoveAsync(db, to, report.AddedRowKeys.Append($"{items[0].IdItem}|7").Append("abc").ToList());

            removed.Should().Be(1);
            var rows = await db.TownWishListItems.AsNoTracking().Where(i => i.IdTown == to).ToListAsync();
            rows.Should().ContainSingle().Which.Should().Match<TownWishListItem>(i => i.IdItem == items[1].IdItem && i.Count == 99);
        }

        [Fact]
        public async Task Note_Remove_SupprimeSeulementLesNotesJournaliseesDeLaCible()
        {
            var (db, from, to) = Seed();
            var (newAuthor, sharedAuthor) = (Rng.Next(1, int.MaxValue), Rng.Next(1, int.MaxValue));
            db.Users.AddRange(new User { IdUser = newAuthor, Name = "test-user-" + newAuthor }, new User { IdUser = sharedAuthor, Name = "test-user-" + sharedAuthor });
            await db.SaveChangesAsync();
            var date = new DateTime(2026, 1, 2, 3, 4, 5);
            db.TownNotes.Add(new TownNote { IdTown = from, IdUserAuthor = newAuthor, Note = "n", UpdatedAt = date });
            db.TownNotes.Add(new TownNote { IdTown = to, IdUserAuthor = sharedAuthor, Note = "cible", UpdatedAt = date });
            await db.SaveChangesAsync();
            var report = await new NoteMerger().MergeAsync(db, from, to);

            var removed = await new NoteMerger().RemoveAsync(db, to, report.AddedRowKeys.ToList());

            removed.Should().Be(1);
            (await db.TownNotes.AsNoTracking().Where(n => n.IdTown == to).Select(n => n.Note).ToListAsync()).Should().Equal("cible");
            (await db.TownNotes.AsNoTracking().CountAsync(n => n.IdTown == from)).Should().Be(1);
        }
    }
}
