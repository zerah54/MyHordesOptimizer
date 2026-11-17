using FluentAssertions;
using MyHordesOptimizerApi.Data.Nightwatch;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Services.Impl.Nightwatch;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Nightwatch
{
    public class NightwatchReferentialTests
    {
        private static string DataDirectory()
        {
            var directory = new DirectoryInfo(AppContext.BaseDirectory);
            while (directory != null && !Directory.Exists(Path.Combine(directory.FullName, "MyHordesOptimizerApi", "Data", "Nightwatch")))
            {
                directory = directory.Parent;
            }
            directory.Should().NotBeNull("le dossier Data/Nightwatch de l'API doit se trouver au-dessus du binaire de test");
            return Path.Combine(directory!.FullName, "MyHordesOptimizerApi", "Data");
        }

        private static NightwatchReferentialCodeModel LoadCode()
            => File.ReadAllText(Path.Combine(DataDirectory(), "Nightwatch", "nightwatch-referential.json")).FromJson<NightwatchReferentialCodeModel>();

        private static NightwatchItemCodeModel ItemOf(NightwatchReferentialCodeModel code, string uid) => code.Items[uid];

        [Fact]
        public void Constants_MatchTheGame()
        {
            var dto = NightwatchReferentialMapper.Map(LoadCode(), new Dictionary<string, int>());

            dto.BaseRisk.Should().Be(0.08);
            dto.Fatigue.Should().Equal(0, .01, .04, .09, .20, .30, .42, .56, .72, .90);
            dto.FatiguePro.Should().Equal(0, .01, .04, .09, .15, .20, .30, .40, .50, .60, .75, .90);
            dto.RoundPathLevel3Bonus.Should().Be(0.01);
            dto.GuardRoomBonus.Should().Be(0.05);
            dto.SprinklerMalus.Should().Be(0.04);
            dto.BathBonus.Should().Be(0.01);
            dto.DiscourseDefense.Should().Be(15);
            dto.WatcherCapByRoundPathLevel.Should().Equal(new Dictionary<int, int> { { 0, 10 }, { 1, 20 }, { 2, 40 }, { 3, 40 } });
        }

        [Fact]
        public void Statuses_KeysMatchThePlanValidator_AndDogDefenseIsTheGameOne()
        {
            var dto = NightwatchReferentialMapper.Map(LoadCode(), new Dictionary<string, int>());

            dto.Statuses.Keys.Should().BeEquivalentTo("drugged", "drunk", "thirsty", "immune", "dog", "dogSteak", "ghoul");
            dto.Statuses["dog"].Defense.Should().Be(10);
            dto.Statuses["dog"].DeathRisk.Should().Be(-0.02);
            dto.Statuses["dogSteak"].Defense.Should().Be(15);
            dto.Statuses["dogSteak"].DeathRisk.Should().Be(-0.03);
            dto.Statuses["ghoul"].DeathRisk.Should().Be(-0.05);
            dto.Statuses.Values.Should().OnlyContain(status => status.Source == "game" || status.Source == "excel");
        }

        [Theory]
        [InlineData("shield_#00", 0.05)]
        [InlineData("car_door_#00", 0.03)]
        [InlineData("pumpkin_tasty_#00", 0.01)]
        [InlineData("taser_#00", 0.01)]
        [InlineData("coffee_#00", 0.01)]
        [InlineData("lamp_on_#00", -0.01)]
        [InlineData("music_#00", -0.02)]
        public void Items_WatchImpactIsAFraction(string uid, double expected)
        {
            ItemOf(LoadCode(), uid).WatchImpact.Should().Be(expected);
        }

        [Fact]
        public void Items_CumulativeOnlyForTheGamePropertyHolders()
        {
            var code = LoadCode();

            code.Items.Where(pair => pair.Value.Cumulative).Select(pair => pair.Key)
                .Should().BeEquivalentTo("taser_#00", "lamp_on_#00", "coffee_#00");
        }

        [Fact]
        public void Items_UsageAndCostsFollowWhatHappensAfterTheWatch()
        {
            var code = LoadCode();

            ItemOf(code, "lawn_#00").Should().Match<NightwatchItemCodeModel>(item => item.Usage == "repair" && item.RepairPa == 2 && item.Batteries == 0 && item.Water == 0);
            ItemOf(code, "taser_#00").Should().Match<NightwatchItemCodeModel>(item => item.Usage == "recharge" && item.Batteries == 1 && item.Water == 0);
            ItemOf(code, "water_can_3_#00").Should().Match<NightwatchItemCodeModel>(item => item.Usage == "recharge" && item.Water == 3 && item.Batteries == 0);
            ItemOf(code, "chair_#00").Usage.Should().Be("single");
            ItemOf(code, "shield_#00").Usage.Should().Be("permanent");
            ItemOf(code, "car_door_#00").Defense.Should().Be(25);
        }

        [Fact]
        public void EveryItemAndStatus_HasAKnownSource()
        {
            var code = LoadCode();

            code.Items.Values.Should().OnlyContain(item => item.Source == "game" || item.Source == "excel");
            code.Statuses.Values.Should().OnlyContain(status => status.Source == "game" || status.Source == "excel");
        }

        [Fact]
        public void Map_SkipsUnknownUids_AndKeysItemsByIdItem()
        {
            var code = LoadCode();

            var dto = NightwatchReferentialMapper.Map(code, new Dictionary<string, int> { { "shield_#00", 4242 } });

            dto.Items.Should().ContainSingle().Which.Key.Should().Be(4242);
            dto.Items[4242].WatchImpact.Should().Be(0.05);
        }

        [Fact]
        public void EveryUid_IsWellFormed_Unique_AndKnownToTheGameNightwatchTable()
        {
            var code = LoadCode();
            var gameTable = File.ReadAllText(Path.Combine(DataDirectory(), "Items", "items-nightwatch.json")).FromJson<Dictionary<string, string>>();

            code.Items.Keys.Should().OnlyContain(uid => Regex.IsMatch(uid, @"^[a-z0-9_]+_#\d\d$"));
            code.Items.Keys.Should().OnlyHaveUniqueItems();
            code.Items.Keys.Where(uid => !gameTable.ContainsKey(uid)).Should().BeEmpty("chaque objet du référentiel doit exister dans le catalogue du jeu");
        }

        [Fact]
        public void Usage_IsConsistentWithTheGameNightwatchTable()
        {
            var code = LoadCode();
            var gameTable = File.ReadAllText(Path.Combine(DataDirectory(), "Items", "items-nightwatch.json")).FromJson<Dictionary<string, string>>();

            foreach (var (uid, item) in code.Items)
            {
                var gameAction = gameTable[uid];
                if (gameAction == "nw_break") item.Usage.Should().Be("repair", uid);
                if (gameAction == "nw_void") item.Usage.Should().Be("permanent", uid);
                if (item.Usage == "recharge") gameAction.Should().StartWith("nw_empty_", uid);
            }
        }

        [Fact]
        public void DefenseBonuses_AreTheGameOnes_InGameOrder()
        {
            var code = LoadCode();

            code.ItemDefenseRequiresBuildingUid.Should().Be("small_armor_#00");
            code.DefenseBonuses.Select(bonus => (bonus.BuildingUid, bonus.Property, bonus.Factor)).Should().Equal(
                ("small_animfence_#00", "nw_trebuchet", 0.3),
                ("small_sewers_#00", "nw_shooting", 0.3),
                ("small_ikea_#00", "nw_ikea", 0.3),
                ("small_grinder2_#00", "nw_armory", 0.2));
        }

        [Theory]
        [InlineData("small_animfence_#00", "pet_dog_#00")]
        [InlineData("small_sewers_#00", "grenade_#00")]
        [InlineData("small_ikea_#00", "bed_#00")]
        [InlineData("small_grinder2_#00", "lawn_#00")]
        public void DefenseBonuses_TargetTheItemsHoldingTheGameProperty(string buildingUid, string itemUid)
        {
            var code = LoadCode();

            code.DefenseBonuses.Single(bonus => bonus.BuildingUid == buildingUid).ItemUids.Should().Contain(itemUid);
            code.DefenseBonuses.SelectMany(bonus => bonus.ItemUids).Should().OnlyContain(uid => code.Items.ContainsKey(uid));
        }

        [Fact]
        public void DefenseBonuses_AreMappedToIdItem_AndUnknownUidsSkipped()
        {
            var code = LoadCode();

            var dto = NightwatchReferentialMapper.Map(code, new Dictionary<string, int> { { "lawn_#00", 7 }, { "bed_#00", 8 } });

            dto.ItemDefenseRequiresBuildingUid.Should().Be("small_armor_#00");
            dto.DefenseBonuses.Single(bonus => bonus.BuildingUid == "small_grinder2_#00").IdItems.Should().Equal(7);
            dto.DefenseBonuses.Single(bonus => bonus.BuildingUid == "small_ikea_#00").IdItems.Should().Equal(8);
            dto.DefenseBonuses.Single(bonus => bonus.BuildingUid == "small_sewers_#00").IdItems.Should().BeEmpty();
        }

        [Fact]
        public void RepairCost_IsTheLeadsConventionOf2PaPerItem_NotTheGameCostOf1()
        {
            var repairable = LoadCode().Items.Values.Where(item => item.Usage == "repair").ToList();

            repairable.Should().NotBeEmpty().And.OnlyContain(item => item.RepairPa == 2 && item.RepairPaSource == "excel");
        }

        [Fact]
        public void IsEssential_FollowsTheGameProfessionItems()
        {
            var code = LoadCode();

            code.Items["shield_#00"].IsEssential.Should().BeTrue("le bouclier est l'objet de métier du gardien");
            code.Items["lawn_#00"].IsEssential.Should().BeFalse();
            code.Items.Where(pair => pair.Value.IsEssential).Select(pair => pair.Key).Should().BeEquivalentTo("shield_#00");
        }

        [Fact]
        public void IsEssential_IsMappedToTheDto()
        {
            var dto = NightwatchReferentialMapper.Map(LoadCode(), new Dictionary<string, int> { { "shield_#00", 1 }, { "lawn_#00", 2 } });

            dto.Items[1].IsEssential.Should().BeTrue();
            dto.Items[2].IsEssential.Should().BeFalse();
            dto.Items[2].RepairPaSource.Should().Be("excel");
        }
    }
}
