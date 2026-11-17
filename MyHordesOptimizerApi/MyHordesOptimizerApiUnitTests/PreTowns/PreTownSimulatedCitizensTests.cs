using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.PreTowns;
using Newtonsoft.Json.Linq;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.PreTowns
{
    public class PreTownSimulatedCitizensTests
    {
        [Fact]
        public void Strip_RetireLesUserIdNegatifs_SansCasse()
        {
            var result = PreTownMergers.StripSimulatedCitizens("{\"Watchers\":[{\"UserId\":-3},{\"UserId\":12}],\"AttackOverride\":5}", "watchers");

            var json = JObject.Parse(result!);
            json["Watchers"]!.Should().HaveCount(1);
            json["Watchers"]![0]!["UserId"]!.Value<int>().Should().Be(12);
            json["AttackOverride"]!.Value<int>().Should().Be(5);
        }

        [Fact]
        public void Strip_CamelCase_RetireAussi()
        {
            var result = PreTownMergers.StripSimulatedCitizens("{\"citizens\":[{\"userId\":-1},{\"userId\":4}]}", "Citizens");

            JObject.Parse(result!)["citizens"]!.Should().HaveCount(1);
        }

        [Theory]
        [InlineData("{\"Other\":[]}")]
        [InlineData("pas du json")]
        [InlineData("{\"Watchers\":[{\"UserId\":7}]}")]
        public void Strip_RienARetirer_RenvoieLeContenuIntact(string content)
        {
            PreTownMergers.StripSimulatedCitizens(content, "Watchers").Should().Be(content);
        }

        [Fact]
        public void Strip_Null_RenvoieNull()
        {
            PreTownMergers.StripSimulatedCitizens(null, "Watchers").Should().BeNull();
        }
    }
}
