using FluentAssertions;
using MyHordesOptimizerApi.Data.Citizens;
using MyHordesOptimizerApi.Extensions;
using System;
using System.Collections.Generic;
using System.IO;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Citizens
{
    public class HomeReferentialCodeModelTests
    {
        [Fact]
        public void HomeLevel_ReadsResourcesObjectAndEmptyArray()
        {
            const string json = @"[
              {""label"":""Feldbett"",""icon"":""home_lv0"",""def"":0,""ap"":0,""ap_urbanism"":0,""resources"":[],""resources_urbanism"":[],""building"":null,""upgrades"":false,""theft"":false},
              {""label"":""Baracke"",""icon"":""home_lv2"",""def"":4,""ap"":4,""ap_urbanism"":3,""resources"":{""wood_bad_#00"":1},""resources_urbanism"":[],""building"":null,""upgrades"":true,""theft"":false}]";

            var levels = json.FromJson<List<HomeLevelCodeModel>>();

            levels.Should().HaveCount(2);
            levels[0].Resources.Should().BeEmpty();
            levels[1].Def.Should().Be(4);
            levels[1].ApUrbanism.Should().Be(3);
            levels[1].Resources.Should().ContainKey("wood_bad_#00").WhoseValue.Should().Be(1);
        }

        [Fact]
        public void RealFiles_ProducedByTheExtractorAreReadable()
        {
            var directory = new DirectoryInfo(AppContext.BaseDirectory);
            while (directory != null && !Directory.Exists(Path.Combine(directory.FullName, "MyHordesOptimizerApi", "Data", "Citizens")))
            {
                directory = directory.Parent;
            }
            directory.Should().NotBeNull("le dossier Data/Citizens de l'API doit se trouver au-dessus du binaire de test");
            var data = Path.Combine(directory!.FullName, "MyHordesOptimizerApi", "Data", "Citizens");

            var levels = File.ReadAllText(Path.Combine(data, "home-levels.json")).FromJson<List<HomeLevelCodeModel>>();
            var upgrades = File.ReadAllText(Path.Combine(data, "home-upgrades.json")).FromJson<List<HomeUpgradeCodeModel>>();

            levels.Should().NotBeEmpty();
            levels[0].Ap.Should().Be(0);
            upgrades.Should().NotBeEmpty().And.OnlyContain(upgrade => upgrade.Levels.Count > 0);
        }

        [Fact]
        public void HomeUpgrade_ReadsLevelsAsApAndResources()
        {
            const string json = @"[{""name"":""lab"",""label"":""Hobbylabor"",""desc"":""..."",""levels"":{""1"":[6,{""machine_1_#00"":1}],""2"":[9,[]]}}]";

            var upgrades = json.FromJson<List<HomeUpgradeCodeModel>>();

            upgrades[0].Name.Should().Be("lab");
            upgrades[0].Levels["1"].Ap.Should().Be(6);
            upgrades[0].Levels["1"].Resources.Should().ContainKey("machine_1_#00");
            upgrades[0].Levels["2"].Ap.Should().Be(9);
            upgrades[0].Levels["2"].Resources.Should().BeEmpty();
        }
    }
}
