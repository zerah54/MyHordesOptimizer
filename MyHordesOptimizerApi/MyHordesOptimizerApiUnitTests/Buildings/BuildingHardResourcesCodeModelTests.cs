using FluentAssertions;
using MyHordesOptimizerApi.Data.Buildings;
using MyHordesOptimizerApi.Extensions;
using System.Collections.Generic;

namespace MyHordesOptimizerApiUnitTests.Buildings
{
    public class BuildingHardResourcesCodeModelTests
    {
        [Fact]
        public void DeserialiseLesTroisPaliers()
        {
            const string json = """
                {
                  "small_wallimprove_#00": {
                    "tier0": { "resources": { "wood2_#00": 10 }, "ap": 25 },
                    "tier1": { "resources": { "wood2_#00": 8 }, "ap": 20 },
                    "tier2": { "ap": 13 }
                  }
                }
                """;

            var resultat = json.FromJson<Dictionary<string, BuildingHardResourcesCodeModel>>();

            resultat["small_wallimprove_#00"].Tier0.Ap.Should().Be(25);
            resultat["small_wallimprove_#00"].Tier0.Resources["wood2_#00"].Should().Be(10);
            resultat["small_wallimprove_#00"].Tier1.Ap.Should().Be(20);
            resultat["small_wallimprove_#00"].Tier2.Ap.Should().Be(13);
        }

        [Fact]
        public void DeserialiseLaRareteEffectiveQuandPresente()
        {
            const string json = """
                {
                  "small_wallimprove_#00": {
                    "tier0": { "resources": { "wood2_#00": 10 }, "ap": 25 },
                    "tier1": { "resources": { "wood2_#00": 8 }, "ap": 20 },
                    "tier2": { "ap": 13 },
                    "rareteEffective": 1
                  }
                }
                """;

            var resultat = json.FromJson<Dictionary<string, BuildingHardResourcesCodeModel>>();

            resultat["small_wallimprove_#00"].RareteEffective.Should().Be(1);
        }

        [Fact]
        public void RareteEffectiveEstNulleQuandAbsente()
        {
            const string json = """
                {
                  "small_autre_#00": {
                    "tier0": { "resources": {}, "ap": 40 },
                    "tier1": { "resources": {}, "ap": 30 },
                    "tier2": { "ap": 30 }
                  }
                }
                """;

            var resultat = json.FromJson<Dictionary<string, BuildingHardResourcesCodeModel>>();

            resultat["small_autre_#00"].RareteEffective.Should().BeNull();
        }
    }
}
