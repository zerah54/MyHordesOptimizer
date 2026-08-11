using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Items;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// Verrou de non-régression sur l'état actuel du référentiel MyHordes (constaté le 2026-08-10,
    /// croisé dans <c>actions.json</c>/<c>item-properties.json</c>/<c>item-actions.json</c>) :
    /// 6 contenants exigent l'une des 3 catégories d'ouvre-boîte, les autres n'exigent aucun outil.
    /// </summary>
    public class ItemOpenerResolverReferentielTests
    {
        private static ItemWithoutRecipeDto Item(string uid, IEnumerable<string> properties, IEnumerable<string> actions)
        {
            return new ItemWithoutRecipeDto { Uid = uid, Img = uid + ".gif", Properties = properties, Actions = actions };
        }

        private static MyHordesActionsCodeModel ActionModel(IEnumerable<string> meta)
        {
            return new MyHordesActionsCodeModel { Meta = meta.ToList() };
        }

        private static readonly Dictionary<string, MyHordesActionsCodeModel> ActionMeta = new()
        {
            { "can", ActionModel(new[] { "not_profession_tech", "have_can_opener", "is_not_wounded_hands" }) },
            { "open_metalbox", ActionModel(new[] { "not_profession_tech", "have_can_opener", "is_not_wounded_hands" }) },
            { "open_metalbox2", ActionModel(new[] { "not_profession_tech", "have_can_opener", "is_not_wounded_hands" }) },
            { "open_catbox", ActionModel(new[] { "not_profession_tech", "have_can_opener", "is_not_wounded_hands" }) },
            { "open_toolbox", ActionModel(new[] { "not_profession_tech", "have_box_opener", "is_not_wounded_hands" }) },
            { "open_foodbox", ActionModel(new[] { "not_profession_tech", "have_parcel_opener", "is_not_wounded_hands" }) },
            { "open_safe", ActionModel(new[] { "min_1_ap", "not_tired", "is_not_wounded_hands" }) },
            { "open_doggybag", ActionModel(new[] { "is_not_wounded_hands" }) }
        };

        private static List<ItemWithoutRecipeDto> BuildCatalogue()
        {
            var items = new List<ItemWithoutRecipeDto>
            {
                Item("can_opener_#00", new[] { "can_opener", "box_opener", "parcel_opener" }, new string[0]),
                Item("wrench_#00", new[] { "box_opener", "parcel_opener" }, new string[0]),
                Item("can_#00", new string[0], new[] { "can" }),
                Item("chest_#00", new string[0], new[] { "open_metalbox" }),
                Item("chest_xl_#00", new string[0], new[] { "open_metalbox2" }),
                Item("catbox_#00", new string[0], new[] { "open_catbox" }),
                Item("chest_tools_#00", new string[0], new[] { "open_toolbox" }),
                Item("chest_food_#00", new string[0], new[] { "open_foodbox" }),
                Item("safe_#00", new string[0], new[] { "open_safe" }),
                Item("food_bag_#00", new string[0], new[] { "open_doggybag" }),
                Item("knife_#00", new[] { "weapon", "box_opener", "parcel_opener" }, new string[0])
            };
            ItemOpenerResolver.PopulateOpenerRelations(items, items, ActionMeta);
            return items;
        }

        [Theory]
        [InlineData("can_#00")]
        [InlineData("chest_#00")]
        [InlineData("chest_xl_#00")]
        [InlineData("catbox_#00")]
        public void LesContenantsCanOpener_SeTrouventOuvertsParLesObjetsPortantLaProprieteCanOpener(string uid)
        {
            var items = BuildCatalogue();
            var box = items.Single(i => i.Uid == uid);

            box.OpenedWith.Select(i => i.Uid).Should().BeEquivalentTo("can_opener_#00");
        }

        [Fact]
        public void LeCoffreAOutils_SeTrouveOuvertParLesObjetsPortantLaProprieteBoxOpener()
        {
            var items = BuildCatalogue();
            var chestTools = items.Single(i => i.Uid == "chest_tools_#00");

            chestTools.OpenedWith.Select(i => i.Uid).Should().BeEquivalentTo("can_opener_#00", "wrench_#00", "knife_#00");
        }

        [Fact]
        public void LeColisAlimentaire_SeTrouveOuvertParLesObjetsPortantLaProprieteParcelOpener()
        {
            var items = BuildCatalogue();
            var chestFood = items.Single(i => i.Uid == "chest_food_#00");

            chestFood.OpenedWith.Select(i => i.Uid).Should().BeEquivalentTo("can_opener_#00", "wrench_#00", "knife_#00");
        }

        [Theory]
        [InlineData("safe_#00")]
        [InlineData("food_bag_#00")]
        public void LesContenantsSansOutilRequis_ARenvoieUneListeVideEtNonNulle(string uid)
        {
            var items = BuildCatalogue();
            var box = items.Single(i => i.Uid == uid);

            box.OpenedWith.Should().NotBeNull().And.BeEmpty();
        }

        [Fact]
        public void LOuvreBoiteQuiCumuleLesTroisCategories_OuvreLesSixContenantsAOutilRequis()
        {
            var items = BuildCatalogue();
            var canOpener = items.Single(i => i.Uid == "can_opener_#00");

            canOpener.Opens.Select(i => i.Uid).Should().BeEquivalentTo(
                "can_#00", "chest_#00", "chest_xl_#00", "catbox_#00", "chest_tools_#00", "chest_food_#00");
        }

        [Fact]
        public void UnObjetQuiNEstNiBoiteNiOutil_NApparaitDansAucuneRelation()
        {
            var items = BuildCatalogue();
            var wrench = items.Single(i => i.Uid == "wrench_#00");

            wrench.OpenedWith.Should().BeNull();
        }
    }
}
