using FluentAssertions;
using MyHordesOptimizerApi.Repository.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Buildings
{
    public class ToolsUpdateFieldsTests
    {
        [Theory]
        [InlineData("chantiers.fields(id,icon,name,pa,paCurrent,difficulty,maxLife,votes,breakable,def,resources.fields(amount,rsc.fields(id,name)),resourcesCurrent.fields(amount,rsc.fields(id,name)),actions,hasLevels)")]
        [InlineData("buildings.fields(id,name,life,maxLife,breakable,def,hasUpgrade,rarity,temporary,parent,paCurrent,difficulty,resourcesCurrent.fields(amount,rsc.fields(id,name)),actions,hasLevels)")]
        public void ToolsUpdateFields_AsksForTheCurrentCostsOfTheCityBuildings(string expectedFragment)
        {
            MyHordesApiRepository.ToolsUpdateFields.Should().Contain(expectedFragment);
        }
    }
}
