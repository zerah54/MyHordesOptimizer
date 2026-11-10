using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Items;
using MyHordesOptimizerApi.Repository.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>Impact en veille et extension de sac sur le référentiel réel.</summary>
    public class ItemWatchAndBagResolverTests
    {
        private static readonly List<ItemWithoutRecipeDto> Catalog = Populate();

        private static List<ItemWithoutRecipeDto> Populate()
        {
            var catalog = RealItemCatalog.Build();
            ItemWatchAndBagResolver.Populate(catalog, catalog, new MyHordesCodeRepository().GetItemExtras());
            return catalog;
        }

        private static ItemWithoutRecipeDto Item(string uid) => Catalog.Single(i => i.Uid == uid);

        [Fact]
        public void Bouclier_Plus5() => Item("shield_#00").WatchImpact.Should().Be(5);

        [Fact]
        public void ChaineHifi_Moins2() => Item("music_#00").WatchImpact.Should().Be(-2);

        [Fact]
        public void SacSuperPratique_Plus3EtExclusifAvecLesDeuxAutresSacs()
        {
            var bag = Item("bagxl_#00");
            bag.BagCapacityBonus.Should().Be(3);
            bag.BagExclusiveGroup!.Select(i => i.Uid).Should().BeEquivalentTo("bag_#00", "bagxl_#00", "cart_#00");
            bag.BagExclusiveGroup!.Single(i => i.Uid == "bag_#00").Img.Should().Be("bag_#00");
        }

        [Fact]
        public void CeintureAPoches_Plus2SeuleDansSonGroupe()
        {
            var belt = Item("pocket_belt_#00");
            belt.BagCapacityBonus.Should().Be(2);
            belt.BagExclusiveGroup!.Select(i => i.Uid).Should().Equal("pocket_belt_#00");
        }

        [Fact]
        public void Planche_SansRien()
        {
            var planche = Item("wood2_#00");
            planche.WatchImpact.Should().Be(0);
            planche.BagCapacityBonus.Should().BeNull();
            planche.BagExclusiveGroup.Should().BeNull();
        }
    }
}
