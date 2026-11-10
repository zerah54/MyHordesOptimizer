using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Items;
using MyHordesOptimizerApi.Repository.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>Recettes de recharge déduites des actions du référentiel réel.</summary>
    public class ItemReloadRecipesResolverReferentielTests
    {
        private static readonly List<ItemWithoutRecipeDto> Catalog = RealItemCatalog.Build();
        private static readonly Dictionary<string, List<ItemRecipeDto>> RecipesByUid = Build();

        private static Dictionary<string, List<ItemRecipeDto>> Build()
        {
            var repository = new MyHordesCodeRepository();
            return ItemReloadRecipesResolver.Build(Catalog, repository.GetActions(), repository.GetMetaResults(), repository.GetResultGroups());
        }

        private static List<ItemRecipeDto> Recipes(string uid) => RecipesByUid.GetValueOrDefault(uid) ?? new List<ItemRecipeDto>();

        private static ItemRecipeDto SingleRecipe(string uid) => Recipes(uid).Should().ContainSingle(uid).Which;

        private static void ShouldBe(ItemRecipeDto recipe, string[] components, params (string Uid, double Probability)[] results)
        {
            recipe.Type.Should().Be("Recipe::ManualAnywhere");
            recipe.Components.Select(c => (c.Item.Uid, c.Count)).Should().Equal(components.Select(uid => (uid, 1)));
            recipe.Result.Select(r => r.Item.Uid).Should().BeEquivalentTo(results.Select(r => r.Uid));
            foreach (var (uid, probability) in results)
            {
                recipe.Result.Single(r => r.Item.Uid == uid).Probability.Should().BeApproximately(probability, 1e-9, uid);
            }
        }

        /// <summary>Liste figée : une recharge de plus ou de moins dans les fixtures doit être relue.</summary>
        [Fact]
        public void ListeComplete_DesObjetsAvecRecetteDeRecharge()
        {
            RecipesByUid.SelectMany(e => e.Value.Select(r => $"{e.Key}:{r.Name}")).Should().BeEquivalentTo(
                "alarm_off_#00:alarm_clock", "bgrenade_empty_#00:fill_exgrenade1", "big_pgun_empty_#00:load_pilegun3",
                "chainsaw_empty_#00:load_chainsaw", "grenade_empty_#00:fill_grenade1", "jerrygun_off_#00:fill_jsplash",
                "kalach_#01:fill_ksplash1", "lamp_#00:load_lamp", "lpoint_#00:load_lpointer", "maglite_1_#00:load_maglite",
                "maglite_off_#00:load_maglite", "mixergun_empty_#00:load_mixergun", "pilegun_empty_#00:load_pilegun",
                "pilegun_up_empty_#00:load_pilegun2", "radio_off_#00:load_radio", "radius_mk2_part_#00:load_rmk2",
                "sport_elec_empty_#00:load_emt", "taser_empty_#00:load_taser",
                "vibr_empty_#00:load_dildo", "water_can_1_#00:fill_watercan1", "water_can_2_#00:fill_watercan2",
                "water_can_empty_#00:fill_watercan0", "watergun_empty_#00:fill_splash1", "watergun_opt_empty_#00:fill_asplash1");
        }

        [Fact]
        public void LancePile_PileDonneLaFormeChargee()
        {
            ShouldBe(SingleRecipe("pilegun_empty_#00"), new[] { "pilegun_empty_#00", "pile_#00" }, ("pilegun_#00", 1.0));
        }

        /// <summary><c>fill_splash1</c> et <c>fill_splash2</c> ne diffèrent que par leurs conditions : une seule recette.</summary>
        [Fact]
        public void PistoletAEau_UneSeuleRecetteDeRemplissage()
        {
            ShouldBe(SingleRecipe("watergun_empty_#00"), new[] { "watergun_empty_#00", "water_#00" }, ("watergun_3_#00", 1.0));
        }

        /// <summary><c>load_lpointer</c> : résultat en forme objet, lpoint4 tiré deux fois sur quatre.</summary>
        [Fact]
        public void PointeurLaser_TroisResultatsPonderes()
        {
            ShouldBe(SingleRecipe("lpoint_#00"), new[] { "lpoint_#00", "pile_#00" },
                ("lpoint4_#00", 0.5), ("lpoint3_#00", 0.25), ("lpoint2_#00", 0.25));
        }

        [Fact]
        public void ObjetsQuiNAttaquentPas_OntAussiLeurRecette()
        {
            ShouldBe(SingleRecipe("lamp_#00"), new[] { "lamp_#00", "pile_#00" }, ("lamp_on_#00", 1.0));
            ShouldBe(SingleRecipe("maglite_1_#00"), new[] { "maglite_1_#00", "pile_#00" }, ("maglite_2_#00", 1.0));
            ShouldBe(SingleRecipe("water_can_empty_#00"), new[] { "water_can_empty_#00", "water_#00" }, ("water_can_1_#00", 1.0));
        }

        [Theory]
        [InlineData("pile_#00")]
        [InlineData("water_#00")]
        [InlineData("pilegun_#00")]
        [InlineData("jerrycan_#00")]
        [InlineData("water_cup_part_#00")]
        [InlineData("tamed_pet_#00")]
        public void SansActionQuiTransformeEnConsommantUnAutreObjet_AucuneRecette(string uid)
        {
            Recipes(uid).Should().BeEmpty();
        }

        /// <summary>Copies neuves : un composant qui serait l'instance du catalogue embarquerait ses recettes, en boucle.</summary>
        [Fact]
        public void ComposantsEtResultats_SontDesCopies()
        {
            var recipe = SingleRecipe("pilegun_empty_#00");
            recipe.Components[0].Item.Should().NotBeSameAs(Catalog.Single(i => i.Uid == "pilegun_empty_#00"));
            recipe.Components[0].Item.Should().BeOfType<ItemWithoutRecipeDto>();
            recipe.Result[0].Item.Should().BeOfType<ItemWithoutRecipeDto>();
        }
    }
}
