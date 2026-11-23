using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch.Request;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Impl.Nightwatch;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Requiert 2026_11_13_town_nightwatch_plan.sql sur la base de test (PastWatches lit les plans).</summary>
    public class NightwatchStateTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public NightwatchStateTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private INightwatchPlanService NewService(int userId)
        {
            var provider = _factory.Services.CreateScope().ServiceProvider;
            var userInfo = provider.GetRequiredService<IUserInfoProvider>();
            userInfo.UserId = userId;
            userInfo.TownDetail = null!;
            return new NightwatchPlanService(
                provider.GetRequiredService<MhoContext>(),
                userInfo,
                new TownAccessService(provider.GetRequiredService<IServiceScopeFactory>(), userInfo),
                provider.GetRequiredService<TownSyncLock>(),
                provider.GetRequiredService<IMapper>());
        }

        private MhoContext NewContext() => _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();

        private (int TownId, int Alive, int Dead, int Outsider) Seed()
        {
            var seeded = AttackTestSupport.SeedTown(NewContext(), Day);
            return (seeded.townId, seeded.aliveUserId, seeded.deadUserId, seeded.outsiderUserId);
        }

        private static int[] TwoItems(MhoContext db) => db.Items.OrderBy(item => item.IdItem).Take(2).Select(item => item.IdItem).ToArray();

        private static void SetBuilt(MhoContext db, int townId, string uid, bool isBuilt = true, int? level = null)
        {
            var building = db.Buildings.Single(row => row.Uid == uid);
            db.TownBuildings.Add(new TownBuilding { IdTown = townId, IdBuilding = building.IdBuilding, IsBuilt = isBuilt, Level = level });
        }

        [Fact]
        public async Task GetState_AggregatesBagAndChestAndFlagsBrokenUnits()
        {
            var town = Seed();
            var db = NewContext();
            var items = TwoItems(db);
            var bag = new Bag { IdLastUpdateInfo = db.TownCitizens.First(row => row.IdTown == town.TownId && row.IdUser == town.Alive).IdLastUpdateInfo };
            var chest = new Chest();
            db.Bags.Add(bag);
            db.Chests.Add(chest);
            db.SaveChanges();
            db.BagItems.Add(new BagItem { IdBag = bag.IdBag, IdItem = items[0], Count = 3, IsBroken = false });
            db.BagItems.Add(new BagItem { IdBag = bag.IdBag, IdItem = items[1], Count = 2, IsBroken = true });
            db.ChestItems.Add(new ChestItem { IdChest = chest.IdChest, IdItem = items[0], Count = 4, IsBroken = true });
            var citizen = db.TownCitizens.Single(row => row.IdTown == town.TownId && row.IdUser == town.Alive);
            citizen.IdBag = bag.IdBag;
            citizen.IdChest = chest.IdChest;
            citizen.IsGhoul = true;
            db.SaveChanges();

            var state = await NewService(town.Alive).GetStateAsync(town.TownId, Day);

            var row = state.Citizens.Should().ContainSingle().Subject;
            row.UserId.Should().Be(town.Alive);
            row.IsGhoul.Should().BeTrue();
            row.Bag.Should().BeEquivalentTo(new System.Collections.Generic.Dictionary<int, int> { [items[0]] = 3, [items[1]] = 2 });
            row.BagBroken.Should().BeEquivalentTo(new System.Collections.Generic.Dictionary<int, int> { [items[1]] = 2 });
            row.Chest[items[0]].Should().Be(4);
            row.ChestBroken[items[0]].Should().Be(4);
            row.ChestUpdatedAt.Should().BeNull();
            row.BagUpdatedAt.Should().NotBeNull();
        }

        [Fact]
        public async Task GetState_BankAndDesertCountBrokenAndIgnoreTownCells()
        {
            var town = Seed();
            var db = NewContext();
            var items = TwoItems(db);
            var lastUpdateId = db.TownCitizens.First(row => row.IdTown == town.TownId).IdLastUpdateInfo;
            db.TownBankSnapshots.Add(new TownBankSnapshot { IdTown = town.TownId, IdLastUpdateInfo = lastUpdateId, Day = Day, ContentHash = new string('a', 64) });
            db.TownBankItems.Add(new TownBankItem { IdTown = town.TownId, IdItem = items[0], IdLastUpdateInfo = lastUpdateId, Count = 5, IsBroken = false });
            db.TownBankItems.Add(new TownBankItem { IdTown = town.TownId, IdItem = items[1], IdLastUpdateInfo = lastUpdateId, Count = 2, IsBroken = true });
            var desert = new MapCell { IdTown = town.TownId, X = 1, Y = 1, IsTown = false };
            var townCell = new MapCell { IdTown = town.TownId, X = 0, Y = 0, IsTown = true };
            db.MapCells.AddRange(desert, townCell);
            db.SaveChanges();
            db.MapCellItems.Add(new MapCellItem { IdCell = desert.IdCell, IdItem = items[1], Count = 6, IsBroken = true });
            db.MapCellItems.Add(new MapCellItem { IdCell = townCell.IdCell, IdItem = items[1], Count = 9, IsBroken = false });
            db.SaveChanges();

            var state = await NewService(town.Alive).GetStateAsync(town.TownId, Day);

            state.Bank.Should().BeEquivalentTo(new System.Collections.Generic.Dictionary<int, int> { [items[0]] = 5, [items[1]] = 2 });
            state.BankBroken.Should().BeEquivalentTo(new System.Collections.Generic.Dictionary<int, int> { [items[1]] = 2 });
            state.Desert[items[1]].Should().Be(6);
            state.DesertBroken[items[1]].Should().Be(6);
        }

        [Fact]
        public async Task GetState_ReportsBuiltBuildingsAndRoundPathLevel()
        {
            var town = Seed();
            var db = NewContext();
            SetBuilt(db, town.TownId, "small_round_path_#00", level: 3);
            SetBuilt(db, town.TownId, "small_watchmen_#02");
            SetBuilt(db, town.TownId, "small_sprinkler_#00", isBuilt: false);
            db.SaveChanges();

            var state = await NewService(town.Alive).GetStateAsync(town.TownId, Day);

            state.BuiltBuildingUids.Should().BeEquivalentTo("small_round_path_#00", "small_watchmen_#02");
            state.RoundPathLevel.Should().Be(3);
            state.HasGuardRoom.Should().BeTrue();
            state.HasSprinkler.Should().BeFalse();
        }

        [Fact]
        public async Task GetState_RoundPathLevelIsZeroWhenNotBuilt()
        {
            var town = Seed();
            var db = NewContext();
            SetBuilt(db, town.TownId, "small_round_path_#00", isBuilt: false, level: 2);
            db.SaveChanges();

            (await NewService(town.Alive).GetStateAsync(town.TownId, Day)).RoundPathLevel.Should().Be(0);
        }

        [Fact]
        public async Task GetState_PastWatchesCountsOnlyEffectivePlansOfEarlierDays()
        {
            var town = Seed();
            var db = NewContext();
            string Content(int userId) => new NightwatchPlanContentDto { Watchers = { new NightwatchWatcherDto { UserId = userId } } }.ToJson();
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = town.TownId, Day = 3, Name = "a", IsEffective = true, Content = Content(town.Alive), IdAuthor = town.Alive });
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = town.TownId, Day = 4, Name = "b", IsEffective = true, Content = Content(town.Alive), IdAuthor = town.Alive });
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = town.TownId, Day = 4, Name = "c", IsEffective = false, Content = Content(town.Alive), IdAuthor = town.Alive });
            db.TownNightwatchPlans.Add(new TownNightwatchPlan { IdTown = town.TownId, Day = Day, Name = "d", IsEffective = true, Content = Content(town.Alive), IdAuthor = town.Alive });
            db.SaveChanges();

            var state = await NewService(town.Alive).GetStateAsync(town.TownId, Day);

            state.PastWatches.Should().BeEquivalentTo(new System.Collections.Generic.Dictionary<int, int> { [town.Alive] = 2 });
        }

        [Theory]
        [InlineData((int)TownType.PANDE, true)]
        [InlineData((int)TownType.RNE, false)]
        [InlineData(null, false)]
        public async Task GetState_TownIsPandaFollowsTheTownType(int? townTypeId, bool expected)
        {
            var town = Seed();
            var db = NewContext();
            db.Towns.Single(row => row.IdTown == town.TownId).TownTypeId = townTypeId;
            db.SaveChanges();

            (await NewService(town.Alive).GetStateAsync(town.TownId, Day)).TownIsPanda.Should().Be(expected);
        }

        [Fact]
        public async Task GetState_IsEmptyForAnOutsider()
        {
            var town = Seed();

            var state = await NewService(town.Outsider).GetStateAsync(town.TownId, Day);

            state.Citizens.Should().BeEmpty();
            state.BuiltBuildingUids.Should().BeEmpty();
        }
    }
}
