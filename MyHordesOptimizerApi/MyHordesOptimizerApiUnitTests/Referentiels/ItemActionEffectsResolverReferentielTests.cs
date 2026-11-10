using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Items;
using MyHordesOptimizerApi.Repository.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// Effets d'actions sur le référentiel réel : tout le catalogue est enrichi une fois, ce qui
    /// fait aussi passer chaque action réelle par le décodeur.
    /// </summary>
    public class ItemActionEffectsResolverReferentielTests
    {
        private static readonly Dictionary<string, MyHordesActionsCodeModel> Actions = new MyHordesCodeRepository().GetActions();
        private static readonly List<ItemWithoutRecipeDto> Catalog = Populate();

        private static List<ItemWithoutRecipeDto> Populate()
        {
            var repository = new MyHordesCodeRepository();
            var catalog = RealItemCatalog.Build();
            ItemActionEffectsResolver.PopulateActionEffects(catalog, catalog, Actions, repository.GetMetaResults(), repository.GetResultGroups(),
                repository.GetMetaRequirements(), repository.GetItemsNightwatch(), null);
            return catalog;
        }

        private static List<ItemActionEffectsDto> Effects(string uid, ItemActionKind kind) =>
            Catalog.Single(i => i.Uid == uid).ActionEffects.Where(e => e.Kind == kind).ToList();

        private static ActionOutcomeDto Outcome(ItemActionEffectsDto effects, ActionOutcomeKind kind, string? uid = null, int? quantity = null) =>
            effects.Outcomes.Should().ContainSingle(o => o.Kind == kind && (o.Item == null ? null : o.Item.Uid) == uid && (quantity == null || o.Quantity == quantity)).Subject;

        [Fact]
        public void ChestTools_OuvrirDonneSonContenu()
        {
            var open = Effects("chest_tools_#00", ItemActionKind.Open).Should().ContainSingle().Subject;

            var produced = open.Outcomes.Where(o => o.Kind == ActionOutcomeKind.Produced).ToList();
            produced.Should().NotBeEmpty();
            produced.Sum(o => o.Probability).Should().BeApproximately(1, 1e-9);
        }

        /// <summary><c>can_t3</c> (Technicien sans PC) a un <c>result</c> vide : pas d'entrée Ouvrir vide.</summary>
        [Fact]
        public void Can_UneSeuleOuvertureQuiTransforme()
        {
            var open = Effects("can_#00", ItemActionKind.Open).Should().ContainSingle().Subject;

            open.Outcomes.Should().Contain(o => o.Kind == ActionOutcomeKind.Transformed);
        }

        [Fact]
        public void Jerrycan_PurifierDonneDeuxOuTroisRations()
        {
            var purify = Effects("jerrycan_#00", ItemActionKind.Purify);

            purify.Should().HaveCount(2);
            var free = purify.Should().ContainSingle(e => e.ApCost == null).Subject;
            Outcome(free, ActionOutcomeKind.Produced, "water_#00", 2).Probability.Should().BeApproximately(0.75, 1e-9);
            Outcome(free, ActionOutcomeKind.Produced, "water_#00", 3).Probability.Should().BeApproximately(0.25, 1e-9);
            purify.Should().ContainSingle(e => e.ApCost == 1);
        }

        [Fact]
        public void PetPig_DecouperDonneDeLaViande()
        {
            var slaughter = Effects("pet_pig_#00", ItemActionKind.Slaughter).Should().ContainSingle().Subject;

            slaughter.Outcomes.Should().Contain(o => o.Kind == ActionOutcomeKind.Produced);
        }

        [Fact]
        public void PetChick_DeuxVariantesSelonLeChantier()
        {
            var attacks = Effects("pet_chick_#00", ItemActionKind.Attack);

            attacks.Should().HaveCount(2);
            attacks.Should().OnlyContain(e => e.BuildingCondition != null && e.BuildingCondition.BuildingUid == "small_pet_#00");
            var without = attacks.Single(e => !e.BuildingCondition!.Built);
            Outcome(without, ActionOutcomeKind.Consumed).Probability.Should().BeApproximately(1, 1e-9);
            var with = attacks.Single(e => e.BuildingCondition!.Built);
            Outcome(with, ActionOutcomeKind.Consumed).Probability.Should().BeApproximately(0.5, 1e-9);
        }

        [Fact]
        public void PetCat_UneSeuleVariante()
        {
            var attack = Effects("pet_cat_#00", ItemActionKind.Attack).Should().ContainSingle().Subject;

            attack.BuildingCondition.Should().BeNull();
            Outcome(attack, ActionOutcomeKind.Consumed).Probability.Should().BeApproximately(0.2, 1e-9);
        }

        [Fact]
        public void Cutcut_TueEtPeutCasser()
        {
            var attack = Effects("cutcut_#00", ItemActionKind.Attack).Should().ContainSingle().Subject;

            attack.Outcomes.Should().Contain(o => o.Kind == ActionOutcomeKind.Kill);
            attack.Outcomes.Should().Contain(o => o.Kind == ActionOutcomeKind.Broken);
        }

        [Fact]
        public void PetCatAngry_TueTousLesZombiesSansBornes()
        {
            var attack = Effects("angryc_#00", ItemActionKind.Attack).Should().ContainSingle().Subject;

            var kill = attack.Outcomes.Should().ContainSingle(o => o.Kind == ActionOutcomeKind.Kill).Subject;
            kill.Probability.Should().BeApproximately(0.5, 1e-9);
            kill.KillMin.Should().BeNull();
            kill.KillMax.Should().BeNull();
        }

        [Fact]
        public void Lawn_SeCasseEnVeille()
        {
            var nightwatch = Effects("lawn_#00", ItemActionKind.Nightwatch).Should().ContainSingle().Subject;

            nightwatch.Outcomes.Should().ContainSingle();
            Outcome(nightwatch, ActionOutcomeKind.Broken).Probability.Should().BeApproximately(1, 1e-9);
        }

        [Fact]
        public void Shield_IntactEnVeille()
        {
            var nightwatch = Effects("shield_#00", ItemActionKind.Nightwatch).Should().ContainSingle().Subject;

            nightwatch.Outcomes.Should().BeEmpty();
        }

        [Fact]
        public void AucuneActionCatapulteNiTechnicien()
        {
            var effects = Catalog.SelectMany(i => i.ActionEffects).ToList();

            effects.Should().NotContain(e => e.ActionName.StartsWith("cata_"));
            effects.Where(e => e.Kind == ItemActionKind.Open)
                .Should().OnlyContain(e => ItemOpenerResolver.ParseCostAndChance(Actions[e.ActionName].Result).CpCost == null);
        }

        /// <summary>Le site et le script n'affichent que la condition du Système de Pièges des Apprivoiseurs.</summary>
        [Fact]
        public void SeulLeChantierDesApprivoiseursDistingueDesVariantes()
        {
            Catalog.SelectMany(i => i.ActionEffects)
                .Where(e => e.BuildingCondition != null)
                .Should().NotBeEmpty()
                .And.OnlyContain(e => e.BuildingCondition!.BuildingUid == "small_pet_#00");
        }
    }
}
