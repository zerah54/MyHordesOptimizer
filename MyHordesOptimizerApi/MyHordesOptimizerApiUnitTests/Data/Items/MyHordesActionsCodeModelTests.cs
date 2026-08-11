using System.Collections.Generic;
using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Extensions;
using Newtonsoft.Json.Linq;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Data.Items
{
    /// <summary>
    /// Verrou sur le comportement de désérialisation Newtonsoft dont dépend
    /// <see cref="MyHordesOptimizerApi.MappingProfiles.Items.ItemOpenerResolver"/> : les tokens
    /// simples désérialisent en <c>string</c>, les objets imbriqués (<c>{"group": [...]}</c>) en
    /// <c>JObject</c>/<c>JArray</c> — jamais en <c>Dictionary</c>/<c>List</c> générique.
    /// </summary>
    public class MyHordesActionsCodeModelTests
    {
        [Fact]
        public void DeserialiseUnResultMixteDeTokensEtDeGroupe_CommeDansActionsJson()
        {
            var json = """
            {
                "open_safe": {
                    "meta": ["min_1_ap", "not_tired"],
                    "result": [
                        "minus_1ap",
                        { "group": [ [["do_nothing"], 95], [["consume_item", "spawn_safe"], 5] ] }
                    ]
                }
            }
            """;

            var actions = json.FromJson<Dictionary<string, MyHordesActionsCodeModel>>();
            var openSafe = actions["open_safe"];

            openSafe.Meta.Should().BeEquivalentTo("min_1_ap", "not_tired");
            openSafe.Result.Should().HaveCount(2);
            openSafe.Result[0].Should().Be("minus_1ap");
            openSafe.Result[1].Should().BeOfType<JObject>();
            ((JObject)openSafe.Result[1])["group"].Should().BeOfType<JArray>();
        }

        [Fact]
        public void UnResultExprimeCommeUnObjetJson_DeserialiseEnListeVideSansException()
        {
            var json = """
            {
                "load_lpointer": {
                    "meta": ["have_battery"],
                    "result": { "0": "consume_battery", "chances": { "group": [["morph_lpoint4", 1]] } }
                }
            }
            """;

            var actions = json.FromJson<Dictionary<string, MyHordesActionsCodeModel>>();

            actions["load_lpointer"].Result.Should().BeEmpty();
        }
    }
}
