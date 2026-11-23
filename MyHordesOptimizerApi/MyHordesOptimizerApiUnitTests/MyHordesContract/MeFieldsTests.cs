using FluentAssertions;
using MyHordesOptimizerApi.Repository.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    public class MeFieldsTests
    {
        [Theory]
        [InlineData("zones.fields(")]
        [InlineData("chantiers.fields(")]
        [InlineData("defense.fields(")]
        [InlineData("upgrades.fields(")]
        [InlineData("expeditions.fields(")]
        [InlineData("rewards.fields(")]
        public void MeFields_NeDemandePlusCeQueLeLoginNEnregistrePas(string fragment)
        {
            MyHordesApiRepository.MeFields.Should().NotContain(fragment);
        }

        [Theory]
        [InlineData("buildings.fields(id,hasLevels)")]
        [InlineData("news.fields(regenDir)")]
        [InlineData("bank.fields(uid,id,count,broken)")]
        [InlineData("cleanup.fields(user,type),rewards)")]
        [InlineData("shaman,guide,cata")]
        public void MeFields_DemandeCeQueLeLoginLit(string fragment)
        {
            MyHordesApiRepository.MeFields.Should().Contain(fragment);
        }
    }
}
