using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.PreTowns;
using MyHordesOptimizerApi.Services.Impl.PreTowns.Mergers;
using MyHordesOptimizerApi.Services.Interfaces;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.PreTowns
{
    public class PreTownMergersOrderTests
    {
        [Fact]
        public void Sorted_MergersEnDesordre_GroupesAvantObjets()
        {
            var shuffled = new IPreTownMerger[] { new NoteMerger(), new WishListItemMerger(), new BuildingPlanMerger(), new WishListGroupMerger() };

            var sorted = PreTownMergers.Sorted(shuffled);

            sorted.Select(m => m.TableName).Should().StartWith("TownWishListGroup", "TownWishListItem");
            sorted.Skip(2).Select(m => m.TableName).Should().Equal("TownNote", "TownBuildingPlan");
        }
    }
}
