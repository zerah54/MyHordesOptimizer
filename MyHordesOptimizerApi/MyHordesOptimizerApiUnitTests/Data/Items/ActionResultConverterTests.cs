using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.MappingProfiles.Items;
using MyHordesOptimizerApi.Repository.Impl;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Data.Items
{
    /// <summary>
    /// <see cref="ActionResultConverter"/> : la forme objet de "result" est aplatie dans l'ordre des
    /// clés, sans perdre d'effet, avec les mêmes types de jetons que la forme tableau.
    /// </summary>
    public class ActionResultConverterTests
    {
        [Fact]
        public void FormeObjet_EstAplatieDansLOrdreDesCles()
        {
            var json = "{\"result\": {\"0\": \"kill_1_zombie_s\", \"chances\": {\"group\": [[[\"do_nothing\"],80],[[\"consume_item\"],20]]}}}";

            var model = JsonConvert.DeserializeObject<MyHordesActionsCodeModel>(json)!;

            model.Result.Should().HaveCount(2);
            model.Result[0].Should().BeOfType<string>().Which.Should().Be("kill_1_zombie_s");
            model.Result[1].Should().BeOfType<JObject>().Which.Should().ContainKey("group");
        }

        [Fact]
        public void FormeTableau_Inchangee()
        {
            var json = "{\"result\": [\"consume_item\", {\"group\": \"g_break_20\"}]}";

            var model = JsonConvert.DeserializeObject<MyHordesActionsCodeModel>(json)!;

            model.Result[0].Should().BeOfType<string>();
            model.Result[1].Should().BeOfType<JObject>();
        }

        [Fact]
        public void SurLeReferentielReel_LoadLpointerEtThrowAnimalCatT1NeSontPlusVides()
        {
            var actions = new MyHordesCodeRepository().GetActions();

            actions["load_lpointer"].Result.Should().Contain("consume_battery");
            actions["throw_animal_cat_t1"].Result.Should().Contain("kill_1_zombie_s");
            actions["load_lpointer"].Label.Should().Be("Laden");
        }

        [Fact]
        public void SurLeReferentielReel_OpenAsafeGardeSonCoutEtSaChance()
        {
            var actions = new MyHordesCodeRepository().GetActions();

            ItemOpenerResolver.ParseCostAndChance(actions["open_asafe"].Result).Should().Be((1, (int?)null, (double?)0.05));
        }
    }
}
