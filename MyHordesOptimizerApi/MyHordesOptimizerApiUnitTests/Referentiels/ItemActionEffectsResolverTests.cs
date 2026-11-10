using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Items;
using Newtonsoft.Json.Linq;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// Classement, fusion des variantes et marquage du chantier, sur des extraits d'actions.json,
    /// meta-results.json et meta-requirements.json recopiés à la main.
    /// </summary>
    public class ItemActionEffectsResolverTests
    {
        private const string BuildingRequirement = MetaResultAtomExtensions.BuildingRequirementAtomType;
        private const string Tamer = "small_pet_#00";

        private static readonly Dictionary<string, MyHordesMetaResultCodeModel> MetaResultsByName = new()
        {
            ["do_nothing"] = new MyHordesMetaResultCodeModel(),
            ["consume_item"] = Atom(MetaResultAtomExtensions.ItemEffectAtomType, """{"consumeSource": true}"""),
            ["spawn_box"] = Atom(MetaResultAtomExtensions.ItemEffectAtomType, """{"spawn": [[["bandage_#00", 1], 3], [["vodka_#00", 1], 1]]}"""),
            ["spawn_meat"] = Atom(MetaResultAtomExtensions.ItemEffectAtomType, """{"spawn": [[["meat_#00", 2], 1]]}"""),
            ["kill_1_zombie_s"] = Atom(MetaResultAtomExtensions.ZoneEffectAtomType, """{"zombieMin": 1, "zombieMax": 1}"""),
            ["minus_1ap"] = Atom(MetaResultAtomExtensions.StatusEffectAtomType, """{"pointType": 1, "pointValue": -1}"""),
            ["minus_1cp"] = Atom(MetaResultAtomExtensions.StatusEffectAtomType, """{"pointType": 2, "pointValue": -1}"""),
        };

        private static readonly Dictionary<string, MyHordesMetaResultCodeModel> MetaRequirementsByName = new()
        {
            ["must_have_tamer_building"] = Atom(BuildingRequirement, """{"building_small_pet_#00": true}"""),
            ["must_not_have_tamer_building"] = Atom(BuildingRequirement, """{"building_small_pet_#00": false}"""),
            ["profession_tech"] = Atom("MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Requirement\\ProfessionRequirement", """{"profession": "tech"}"""),
        };

        private const string CatChances = """{"group": [[["do_nothing"], 80], [["consume_item"], 20]]}""";
        private const string ChickChances = """{"group": [[["do_nothing"], 1], [["consume_item"], 1]]}""";

        private static readonly Dictionary<string, MyHordesActionsCodeModel> ActionsByName = new()
        {
            ["open_safe"] = Action("Öffnen", new string[0], """["minus_1ap", {"group": [[["do_nothing"], 95], [["consume_item", "spawn_box"], 5]]}]"""),
            ["open_toolbox"] = Action("Öffnen", new string[0], """["consume_item", "spawn_box"]"""),
            ["open_toolbox_t2"] = Action("Öffnen (1 BP)", new[] { "profession_tech" }, """["minus_1cp", "consume_item", "spawn_box"]"""),
            ["slaughter_2x"] = Action("Ausweiden", new string[0], """["consume_item", "spawn_meat"]"""),
            ["throw_animal_cat"] = Action("Waffe einsetzen", new[] { "must_not_have_tamer_building" }, $"[{CatChances}, \"kill_1_zombie_s\"]"),
            // Jetons dans l'autre ordre, comme la forme objet aplatie : la comparaison des issues n'en dépend pas.
            ["throw_animal_cat_t1"] = Action("Waffe einsetzen", new[] { "must_have_tamer_building" }, $"[\"kill_1_zombie_s\", {CatChances}]"),
            ["throw_animal_cat_t2"] = Action("Waffe einsetzen", new[] { "must_have_tamer_building" }, $"[{CatChances}, \"kill_1_zombie_s\"]"),
            ["throw_animal"] = Action("Waffe einsetzen", new[] { "must_not_have_tamer_building" }, """["consume_item", "kill_1_zombie_s"]"""),
            ["throw_animal_t1"] = Action("Waffe einsetzen", new[] { "must_have_tamer_building" }, $"[{ChickChances}, \"kill_1_zombie_s\"]"),
            ["throw_animal_t2"] = Action("Waffe einsetzen", new[] { "must_have_tamer_building" }, $"[{ChickChances}, \"kill_1_zombie_s\"]"),
        };

        private static MyHordesMetaResultCodeModel Atom(string atomType, string payloadJson) => new()
        {
            AtomList = new List<MetaResultAtom> { new() { Atom = atomType, Payload = JObject.Parse(payloadJson) } }
        };

        /// <summary>Jetons chaîne en <c>string</c>, objets en <c>JObject</c>, comme <see cref="ActionResultConverter"/>.</summary>
        private static MyHordesActionsCodeModel Action(string label, IEnumerable<string> meta, string resultJson) => new()
        {
            Label = label,
            Meta = meta.ToList(),
            Result = JArray.Parse(resultJson).Select(token => token.Type == JTokenType.String ? (object)token.Value<string>()! : token).ToList(),
        };

        private static ItemWithoutRecipeDto Item(string uid, params string[] actions) =>
            new() { Uid = uid, Img = uid, Actions = actions, Properties = new string[0] };

        private static List<ItemActionEffectsDto> Effects(string uid, IReadOnlySet<string>? builtBuildingUids = null)
        {
            var items = new List<ItemWithoutRecipeDto>
            {
                Item("safe_#00", "open_safe"),
                // Variante PC en premier : sans la règle PC, la fusion la garderait à la place de open_toolbox.
                Item("chest_tools_#00", "open_toolbox_t2", "open_toolbox"),
                Item("chest_food_#00", "action_absente_du_json", "open_toolbox"),
                Item("pet_cat_#00", "throw_animal_cat", "throw_animal_cat_t1", "throw_animal_cat_t2"),
                Item("pet_chick_#00", "slaughter_2x", "throw_animal", "throw_animal_t1", "throw_animal_t2"),
                Item("bandage_#00"),
                Item("vodka_#00"),
                Item("meat_#00"),
            };
            ItemActionEffectsResolver.PopulateActionEffects(items, items, ActionsByName, MetaResultsByName, new Dictionary<string, JArray>(),
                MetaRequirementsByName, new Dictionary<string, string>(), builtBuildingUids);
            return items.Single(i => i.Uid == uid).ActionEffects;
        }

        private static ActionOutcomeDto Outcome(ItemActionEffectsDto effects, ActionOutcomeKind kind, string? uid = null) =>
            effects.Outcomes.Should().ContainSingle(o => o.Kind == kind && (o.Item == null ? null : o.Item.Uid) == uid).Subject;

        [Fact]
        public void UneOuvertureDonneSonContenu()
        {
            var open = Effects("safe_#00").Should().ContainSingle().Subject;

            open.Kind.Should().Be(ItemActionKind.Open);
            open.ActionName.Should().Be("open_safe");
            open.ApCost.Should().Be(1);
            Outcome(open, ActionOutcomeKind.Consumed).Probability.Should().BeApproximately(1, 1e-9);
            Outcome(open, ActionOutcomeKind.Produced, "bandage_#00").Probability.Should().BeApproximately(0.75, 1e-9);
            Outcome(open, ActionOutcomeKind.Produced, "vodka_#00").Probability.Should().BeApproximately(0.25, 1e-9);
        }

        [Fact]
        public void LaVarianteTechnicienEnPcEstIgnoree()
        {
            var open = Effects("chest_tools_#00").Should().ContainSingle().Subject;

            open.ActionName.Should().Be("open_toolbox");
            open.Kind.Should().Be(ItemActionKind.Open);
        }

        /// <summary><c>item.Actions</c> vient de la base et peut précéder actions.json livré.</summary>
        [Fact]
        public void UneActionAbsenteDuJsonEstIgnoree()
        {
            var open = Effects("chest_food_#00").Should().ContainSingle().Subject;

            open.ActionName.Should().Be("open_toolbox");
        }

        [Fact]
        public void DesVariantesIdentiquesSontFusionneesSansCondition()
        {
            var attack = Effects("pet_cat_#00").Should().ContainSingle().Subject;

            attack.Kind.Should().Be(ItemActionKind.Attack);
            attack.ActionName.Should().Be("throw_animal_cat");
            attack.BuildingCondition.Should().BeNull();
            Outcome(attack, ActionOutcomeKind.Consumed).Probability.Should().BeApproximately(0.2, 1e-9);
            Outcome(attack, ActionOutcomeKind.Kill).Probability.Should().BeApproximately(1, 1e-9);
        }

        [Fact]
        public void DesVariantesDifferentesGardentLeurCondition()
        {
            var effects = Effects("pet_chick_#00");

            effects.Select(e => e.ActionName).Should().Equal("slaughter_2x", "throw_animal", "throw_animal_t1");
            effects[0].BuildingCondition.Should().BeNull();
            effects[1].BuildingCondition.Should().BeEquivalentTo(new BuildingConditionDto { BuildingUid = Tamer, Built = false });
            Outcome(effects[1], ActionOutcomeKind.Consumed).Probability.Should().BeApproximately(1, 1e-9);
            effects[2].BuildingCondition.Should().BeEquivalentTo(new BuildingConditionDto { BuildingUid = Tamer, Built = true });
            Outcome(effects[2], ActionOutcomeKind.Consumed).Probability.Should().BeApproximately(0.5, 1e-9);
        }

        [Fact]
        public void SansVilleAucuneVarianteNEstMarquee()
        {
            Effects("pet_chick_#00").Should().OnlyContain(e => e.AppliesToTown == null);
        }

        [Fact]
        public void ChantierConstruit_MarqueLaVarianteAvecChantier()
        {
            var effects = Effects("pet_chick_#00", new HashSet<string> { Tamer });

            effects.Single(e => e.ActionName == "slaughter_2x").AppliesToTown.Should().BeTrue();
            effects.Single(e => e.ActionName == "throw_animal").AppliesToTown.Should().BeFalse();
            effects.Single(e => e.ActionName == "throw_animal_t1").AppliesToTown.Should().BeTrue();
        }

        [Fact]
        public void ChantierAbsent_MarqueLaVarianteSansChantier()
        {
            var effects = Effects("pet_chick_#00", new HashSet<string>());

            effects.Single(e => e.ActionName == "slaughter_2x").AppliesToTown.Should().BeTrue();
            effects.Single(e => e.ActionName == "throw_animal").AppliesToTown.Should().BeTrue();
            effects.Single(e => e.ActionName == "throw_animal_t1").AppliesToTown.Should().BeFalse();
        }
    }
}
