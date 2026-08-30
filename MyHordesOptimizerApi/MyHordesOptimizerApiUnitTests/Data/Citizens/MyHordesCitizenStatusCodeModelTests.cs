using FluentAssertions;
using MyHordesOptimizerApi.Data.Citizens;
using MyHordesOptimizerApi.Extensions;
using System.Collections.Generic;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Data.Citizens
{
    /// <summary>
    /// Verrou sur la désérialisation de <c>Citizens/status.json</c>, vérifié contre les valeurs
    /// réelles relevées dans <c>Scripts/Extractor/raw/myhordes.fixtures.citizen.status.json</c>.
    /// </summary>
    public class MyHordesCitizenStatusCodeModelTests
    {
        [Fact]
        public void DeserialiseThirst1_AvecNwDefSeulEtVolatileFaux()
        {
            var json = """
            {
                "thirst1": {
                    "name": "thirst1",
                    "nw_def": -5,
                    "label": "Durst",
                    "description": "Du bist durstig...",
                    "volatile": false
                }
            }
            """;

            var statuses = json.FromJson<Dictionary<string, MyHordesCitizenStatusCodeModel>>();
            var thirst1 = statuses["thirst1"];

            thirst1.Name.Should().Be("thirst1");
            thirst1.NwDef.Should().Be(-5);
            thirst1.NwDeath.Should().BeNull();
            thirst1.Volatile.Should().BeFalse();
        }

        [Fact]
        public void DeserialiseThirst2_AvecNwDefEtNwDeath()
        {
            var json = """
            {
                "thirst2": {
                    "name": "thirst2",
                    "nw_def": -10,
                    "nw_death": 0.03,
                    "label": "Dehydriert",
                    "description": "...",
                    "volatile": false
                }
            }
            """;

            var statuses = json.FromJson<Dictionary<string, MyHordesCitizenStatusCodeModel>>();
            var thirst2 = statuses["thirst2"];

            thirst2.NwDef.Should().Be(-10);
            thirst2.NwDeath.Should().Be(0.03);
        }

        [Fact]
        public void DeserialiseDrugged_AvecNwDefPositifEtVolatileVrai()
        {
            var json = """
            {
                "drugged": {
                    "name": "drugged",
                    "nw_def": 10,
                    "label": "Rauschzustand",
                    "description": "...",
                    "volatile": true
                }
            }
            """;

            var statuses = json.FromJson<Dictionary<string, MyHordesCitizenStatusCodeModel>>();
            var drugged = statuses["drugged"];

            drugged.NwDef.Should().Be(10);
            drugged.NwDeath.Should().BeNull();
            drugged.Volatile.Should().BeTrue();
        }
    }
}
