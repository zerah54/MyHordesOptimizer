using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Repository.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    public class MyHordesCodeRepositoryFichesObjetsTests
    {
        private readonly MyHordesCodeRepository _repository = new();

        [Fact]
        public void GetItemExtras_BouclierEtSac()
        {
            var extras = _repository.GetItemExtras();

            extras["shield_#00"].WatchImpact.Should().Be(5);
            extras["lamp_on_#00"].WatchImpact.Should().Be(-1);
            extras["bag_#00"].BagExtensionType.Should().Be(1);
            extras["pocket_belt_#00"].BagExtensionType.Should().Be(2);
        }

        [Fact]
        public void GetResultGroups_GBreak20()
        {
            var groups = _repository.GetResultGroups();

            var branches = groups["g_break_20"];
            branches.Should().HaveCount(2);
            branches.Select(b => (int)b[1]).Should().Equal(80, 20);
        }

        [Fact]
        public void GetMetaRequirements_ChantierDesApprivoiseurs()
        {
            var requirements = _repository.GetMetaRequirements();

            requirements["must_have_tamer_building"].AtomList.Single().AsBuildingRequirement()
                .Should().Be(("small_pet_#00", true));
            requirements["must_not_have_tamer_building"].AtomList.Single().AsBuildingRequirement()
                .Should().Be(("small_pet_#00", false));
        }

        [Fact]
        public void GetItemsNightwatch_BouclierSansEffet()
        {
            var nightwatch = _repository.GetItemsNightwatch();

            nightwatch["shield_#00"].Should().Be("nw_void");
            nightwatch["lawn_#00"].Should().Be("nw_break");
        }

        [Fact]
        public void AucunSpawnCountSuperieurAUn()
        {
            var effets = _repository.GetMetaResults().Values
                .SelectMany(m => m.AtomList)
                .Select(a => a.AsItemEffect())
                .Where(e => e != null);

            effets.Should().NotContain(e => e!.SpawnCount > 1);
        }

        [Fact]
        public void SpawnMetalbox_SeptEntrees()
        {
            var spawn = _repository.GetMetaResults()["spawn_metalbox"].AtomList
                .Select(a => a.AsItemEffect())
                .First(e => e != null && e.Spawn != null)!.Spawn!;

            spawn.Should().HaveCount(7);
            spawn[0].ToString(Newtonsoft.Json.Formatting.None).Should().Be("[[\"bandage_#00\",1],28]");
        }
    }
}
