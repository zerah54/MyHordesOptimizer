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
    /// <summary>Armes déchargées et charges à la recharge sur le référentiel réel, après les effets d'actions.</summary>
    public class ItemWeaponChargesResolverReferentielTests
    {
        private static readonly List<ItemWithoutRecipeDto> Catalog = Populate();

        private static List<ItemWithoutRecipeDto> Populate()
        {
            var repository = new MyHordesCodeRepository();
            var actions = repository.GetActions();
            var metaResults = repository.GetMetaResults();
            var resultGroups = repository.GetResultGroups();
            var catalog = RealItemCatalog.Build();
            ItemActionEffectsResolver.PopulateActionEffects(catalog, catalog, actions, metaResults, resultGroups,
                repository.GetMetaRequirements(), repository.GetItemsNightwatch(), null);
            ItemWeaponChargesResolver.PopulateReloads(catalog, catalog, actions, metaResults, resultGroups);
            return catalog;
        }

        private static ItemWithoutRecipeDto Item(string uid) => Catalog.Single(i => i.Uid == uid);

        private static void ShouldHaveCharges(string uid, params (int Charges, double Probability)[] expected) =>
            Item(uid).ReloadCharges.Should().BeEquivalentTo(
                expected.Select(e => new ChargeChanceDto { Charges = e.Charges, Probability = e.Probability }),
                options => options.Using<double>(ctx => ctx.Subject.Should().BeApproximately(ctx.Expectation, 1e-9)).WhenTypeIs<double>(),
                uid);

        private static ItemActionEffectsDto BorrowedAttack(string uid, string loadedUid) =>
            Item(uid).ActionEffects.Should().Contain(e => e.Kind == ItemActionKind.Attack && e.ViaLoadedForm != null && e.ViaLoadedForm.Uid == loadedUid).Which;

        [Fact]
        public void PistoletAEau_TroisCharges()
        {
            ShouldHaveCharges("watergun_empty_#00", (3, 1.0));
            ShouldHaveCharges("watergun_3_#00", (3, 1.0));
            ShouldHaveCharges("watergun_1_#00", (3, 1.0));
        }

        [Fact]
        public void AquaSplash_CinqCharges()
        {
            ShouldHaveCharges("watergun_opt_empty_#00", (5, 1.0));
        }

        [Fact]
        public void Kalachnikeau_UneCharge()
        {
            ShouldHaveCharges("kalach_#01", (1, 1.0));
        }

        /// <summary><c>load_lpointer</c> tire lpoint4 deux fois sur quatre, lpoint3 et lpoint2 une fois chacun.</summary>
        [Fact]
        public void PointeurLaser_DeuxAQuatre()
        {
            ShouldHaveCharges("lpoint_#00", (4, 0.5), (3, 0.25), (2, 0.25));
            ShouldHaveCharges("lpoint1_#00", (4, 0.5), (3, 0.25), (2, 0.25));
        }

        [Fact]
        public void LancePileVide_MontreLesAttaquesDuChargé()
        {
            BorrowedAttack("pilegun_empty_#00", "pilegun_#00").Outcomes.Should().Contain(o => o.Kind == ActionOutcomeKind.Kill);
            ShouldHaveCharges("pilegun_empty_#00", (1, 1.0));
        }

        /// <summary>15 % de se vider à chaque tir : pas de nombre de charges fixe.</summary>
        [Fact]
        public void JerrycanGun_SansCharges()
        {
            Item("jerrygun_off_#00").ReloadCharges.Should().BeNull();
            BorrowedAttack("jerrygun_off_#00", "jerrygun_#00");
        }

        /// <summary>Manger l'Os charnu donne un Os humain fêlé qui attaque, mais ne consomme aucun autre objet : pas une recharge.</summary>
        [Fact]
        public void OsCharnu_PasUneArmeDechargee()
        {
            var boneMeat = Item("bone_meat_#00");

            boneMeat.ReloadCharges.Should().BeNull();
            boneMeat.ActionEffects.Should().NotContain(e => e.ViaLoadedForm != null);
        }

        /// <summary>Les autres formes vides réelles, toutes rechargées en consommant eau ou pile.</summary>
        [Theory]
        [InlineData("pilegun_up_empty_#00", "pilegun_up_#00")]
        [InlineData("big_pgun_empty_#00", "big_pgun_#00")]
        [InlineData("mixergun_empty_#00", "mixergun_#00")]
        [InlineData("chainsaw_empty_#00", "chainsaw_#00")]
        [InlineData("taser_empty_#00", "taser_#00")]
        [InlineData("grenade_empty_#00", "grenade_#00")]
        [InlineData("bgrenade_empty_#00", "bgrenade_#00")]
        public void AutresFormesVides_MontrentLesAttaquesDuCharge(string emptyUid, string loadedUid)
        {
            BorrowedAttack(emptyUid, loadedUid);
        }

        /// <summary>L'attaque empruntée est une copie : la forme chargée garde sa propre attaque.</summary>
        [Fact]
        public void FormeChargee_GardeSonAttaquePropre()
        {
            Item("pilegun_#00").ActionEffects.Where(e => e.Kind == ItemActionKind.Attack)
                .Should().NotBeEmpty().And.OnlyContain(e => e.ViaLoadedForm == null);
        }
    }
}
