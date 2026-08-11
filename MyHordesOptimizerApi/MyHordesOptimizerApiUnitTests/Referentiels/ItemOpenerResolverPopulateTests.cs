using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Items;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// Calcule, pour un lot d'objets déjà mappés, les relations boîte ↔ ouvre-boîte à partir du
    /// meta des actions ("have_&lt;propriété&gt;") — sans table de correspondance codée en dur.
    /// </summary>
    public class ItemOpenerResolverPopulateTests
    {
        private static ItemWithoutRecipeDto Item(string uid, IEnumerable<string> properties, IEnumerable<string> actions)
        {
            return new ItemWithoutRecipeDto
            {
                Uid = uid,
                Label = new Dictionary<string, string> { { "fr", uid } },
                Img = uid + ".gif",
                Properties = properties,
                Actions = actions
            };
        }

        private static MyHordesActionsCodeModel ActionModel(IEnumerable<string> meta)
        {
            return new MyHordesActionsCodeModel { Meta = meta.ToList() };
        }

        private static readonly Dictionary<string, MyHordesActionsCodeModel> ActionMeta = new()
        {
            { "open_foodbox", ActionModel(new[] { "not_profession_tech", "have_parcel_opener" }) },
            { "open_toolbox", ActionModel(new[] { "not_profession_tech", "have_box_opener" }) },
            { "open_metalbox", ActionModel(new[] { "not_profession_tech", "have_can_opener" }) },
            { "open_matbox1", ActionModel(new[] { "is_not_wounded_hands" }) },
            { "throw_b_knife", ActionModel(new string[0]) }
        };

        [Fact]
        public void UneBoiteAvecOutilRequis_ListeLesObjetsPortantLaProprieteAssociee()
        {
            var parcelTool = Item("parcel_tool_#00", new[] { "parcel_opener" }, new string[0]);
            var chestFood = Item("chest_food_#00", new string[0], new[] { "open_foodbox" });
            var items = new List<ItemWithoutRecipeDto> { parcelTool, chestFood };

            ItemOpenerResolver.PopulateOpenerRelations(items, items, ActionMeta);

            chestFood.OpenedWith.Select(i => i.Uid).Should().BeEquivalentTo("parcel_tool_#00");
        }

        [Fact]
        public void UnOutil_ListeLesBoitesQuIlPermetDOuvrir()
        {
            var canOpener = Item("can_opener_#00", new[] { "can_opener" }, new string[0]);
            var chestMetal = Item("chest_#00", new string[0], new[] { "open_metalbox" });
            var items = new List<ItemWithoutRecipeDto> { canOpener, chestMetal };

            ItemOpenerResolver.PopulateOpenerRelations(items, items, ActionMeta);

            canOpener.Opens.Select(i => i.Uid).Should().BeEquivalentTo("chest_#00");
        }

        [Fact]
        public void UneBoiteSansOutilRequis_ARenvoieUneListeVideEtNonNulle()
        {
            var rscPack = Item("rsc_pack_1_#00", new string[0], new[] { "open_matbox1" });
            var items = new List<ItemWithoutRecipeDto> { rscPack };

            ItemOpenerResolver.PopulateOpenerRelations(items, items, ActionMeta);

            rscPack.OpenedWith.Should().NotBeNull().And.BeEmpty();
        }

        [Fact]
        public void UnObjetOrdinaire_ARenvoieOpenedWithNulEtOpensVide()
        {
            var weapon = Item("knife_#00", new[] { "weapon" }, new[] { "throw_b_knife" });
            var items = new List<ItemWithoutRecipeDto> { weapon };

            ItemOpenerResolver.PopulateOpenerRelations(items, items, ActionMeta);

            weapon.OpenedWith.Should().BeNull();
            weapon.Opens.Should().NotBeNull().And.BeEmpty();
        }

        [Fact]
        public void UnLotPartiel_TrouveQuandMemeLesObjetsPertinentsDansLeCatalogueComplet()
        {
            // Reproduit la banque : le lot à enrichir ne contient que la boîte, l'ouvre-boîte
            // n'existe que dans le catalogue complet (il n'est pas dans cette banque).
            var chestFood = Item("chest_food_#00", new string[0], new[] { "open_foodbox" });
            var itemsToEnrich = new List<ItemWithoutRecipeDto> { chestFood };
            var parcelTool = Item("parcel_tool_#00", new[] { "parcel_opener" }, new string[0]);
            var catalog = new List<ItemWithoutRecipeDto> { chestFood, parcelTool };

            ItemOpenerResolver.PopulateOpenerRelations(itemsToEnrich, catalog, ActionMeta);

            chestFood.OpenedWith.Select(i => i.Uid).Should().BeEquivalentTo("parcel_tool_#00");
        }
    }
}
