using FluentAssertions;
using MyHordesOptimizerApi.Repository.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Buildings
{
    public class ToolsUpdateFieldsTests
    {
        [Theory]
        [InlineData("chantiers.fields(id,paCurrent,difficulty,maxLife,def,resourcesCurrent.fields(amount,rsc.fields(id)),actions,hasLevels)")]
        [InlineData("buildings.fields(id,life,maxLife,def,paCurrent,difficulty,resourcesCurrent.fields(amount,rsc.fields(id)),actions,hasLevels)")]
        public void ToolsUpdateFields_AsksForTheCurrentCostsOfTheCityBuildings(string expectedFragment)
        {
            MyHordesApiRepository.ToolsUpdateFields.Should().Contain(expectedFragment);
        }

        [Theory]
        [InlineData("votes")]
        [InlineData("icon")]
        [InlineData("breakable")]
        [InlineData("hasUpgrade")]
        [InlineData("rarity")]
        [InlineData("temporary")]
        [InlineData("parent")]
        [InlineData("resources.fields(")]
        [InlineData("rsc.fields(id,name)")]
        public void ToolsUpdateFields_NeDemandePasCeQueLeReferentielFournitDeja(string fragment)
        {
            MyHordesApiRepository.ToolsUpdateFields.Should().NotContain(fragment);
        }

        [Fact]
        public void ToolsUpdateFields_AsksForTheBankItemUid_SoThatMyHordesSendsTheUuid()
        {
            MyHordesApiRepository.ToolsUpdateFields.Should().Contain("bank.fields(uid,id,count,broken)");
        }
    }
}
