using System;
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
    /// Issues probabilisées d'actions réelles du jeu, décodées depuis des extraits de
    /// meta-results.json et result-groups.json recopiés à la main.
    /// </summary>
    public class ActionOutcomeDecoderTests
    {
        private const string ItemEffect = MetaResultAtomExtensions.ItemEffectAtomType;
        private const string ZoneEffect = MetaResultAtomExtensions.ZoneEffectAtomType;
        private const string StatusEffect = MetaResultAtomExtensions.StatusEffectAtomType;
        private const string MessageEffect = "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\MessageEffect";

        private static readonly Dictionary<string, MyHordesMetaResultCodeModel> MetaResultsByName = new()
        {
            ["do_nothing"] = new MyHordesMetaResultCodeModel(),
            ["do_nothing_attack"] = MetaResult(MessageEffect, """{"text": "rate"}"""),
            ["do_nothing_attack2"] = MetaResult(MessageEffect, """{"text": "rate"}"""),
            ["spawn_metalbox"] = MetaResult(ItemEffect, """{"spawnAt": 1, "spawn": [[["bandage_#00", 1], 28], [["vodka_#00", 1], 20], [["drug_hero_#00", 1], 16], [["drug_#00", 1], 16], [["explo_#00", 1], 8], [["rhum_#00", 1], 8], [["lights_#00", 1], 4]]}"""),
            ["break_item"] = MetaResult(ItemEffect, """{"consumeSource": false, "morphSource": true, "morphSourceType": null, "breakSource": true, "dropSource": false}"""),
            ["consume_item"] = MetaResult(ItemEffect, """{"consumeSource": true, "morphSource": false, "morphSourceType": null, "breakSource": null}"""),
            ["consume_micropur"] = MetaResult(ItemEffect, """{"consumeItem": "water_cleaner_#00", "consumeItemCount": 1}"""),
            ["spawn_2_water"] = MetaResult(ItemEffect, """{"spawnAt": 4, "spawn": [[["water_#00", 2], 1]]}"""),
            ["spawn_3_water"] = MetaResult(ItemEffect, """{"spawnAt": 4, "spawn": [[["water_#00", 3], 1]]}"""),
            ["spawn_empty_battery"] = MetaResult(ItemEffect, """{"spawnAt": 2, "spawn": [[["pile_broken_#00", 1], 1]]}"""),
            ["spawn_battery"] = MetaResult(ItemEffect, """{"spawnAt": 2, "spawn": [[["pile_#00", 1], 1]]}"""),
            ["morph_big_pgun_empty"] = MetaResult(ItemEffect, """{"consumeSource": false, "morphSource": true, "morphSourceType": "big_pgun_empty_#00", "breakSource": null}"""),
            ["morph_taser_empty"] = MetaResult(ItemEffect, """{"consumeSource": false, "morphSource": true, "morphSourceType": "taser_empty_#00", "breakSource": null}"""),
            ["msg_battery_destroy"] = MetaResult(MessageEffect, """{"text": "detruite", "order": 100}"""),
            ["msg_battery_drop"] = MetaResult(MessageEffect, """{"text": "rendue", "order": 100}"""),
            ["msg_battery_use"] = MetaResult(MessageEffect, """{"text": "videe", "order": 100}"""),
            ["kill_1_zombie"] = MetaResult(ZoneEffect, """{"zombieMin": 1, "zombieMax": 1, "zombieKillRange": 0}"""),
            ["kill_2_zombie"] = MetaResult(ZoneEffect, """{"zombieMin": 2, "zombieMax": 2, "zombieKillRange": 0}"""),
            ["kill_all_zombie"] = MetaResult(ZoneEffect, """{"zombieMin": 999999, "zombieMax": 999999, "zombieKillRange": 0}"""),
            ["minus_1ap"] = MetaResult(StatusEffect, """{"pointType": 1, "pointRelativeToMax": 0, "pointValue": -1, "pointExceedMax": 0}"""),
            ["spawn_safe"] = MetaResult(ItemEffect, """{"spawnAt": 1, "spawn": [[["pocket_belt_#00", 1], 15], [["watergun_opt_part_#00", 1], 10], [["lawn_part_#00", 1], 10], [["chainsaw_part_#00", 1], 10], [["mixergun_part_#00", 1], 10], [["cutcut_#00", 1], 10], [["pilegun_upkit_#00", 1], 10], [["meca_parts_#00", 1], 10], [["big_pgun_part_#00", 1], 5], [["book_gen_letter_#00", 1], 5]]}"""),
            ["spawn_poids_nuls"] = MetaResult(ItemEffect, """{"spawnAt": 1, "spawn": [[["water_#00", 1], 0], [["pile_#00", 1], 0], [["pile_broken_#00", 1], 0], [["bandage_#00", 1], 0]]}"""),
        };

        private static readonly Dictionary<string, JArray> ResultGroupsByName = new()
        {
            ["g_break_20"] = JArray.Parse("""[[["do_nothing"], 80], [["break_item"], 20]]"""),
            ["g_kill_1z_33"] = JArray.Parse("""[[["do_nothing_attack"], 67], [["kill_1_zombie"], 33]]"""),
            ["g_kill_1z_30_taser"] = JArray.Parse("""[[["do_nothing_attack2"], 70], [["kill_1_zombie"], 30]]"""),
        };

        private static readonly Dictionary<string, ItemWithoutRecipeDto> CatalogByUid = new[]
            {
                "bandage_#00", "vodka_#00", "drug_hero_#00", "drug_#00", "explo_#00", "rhum_#00", "lights_#00",
                "water_#00", "pile_#00", "pile_broken_#00", "big_pgun_empty_#00", "taser_empty_#00",
                "pocket_belt_#00", "watergun_opt_part_#00", "lawn_part_#00", "chainsaw_part_#00", "mixergun_part_#00",
                "cutcut_#00", "pilegun_upkit_#00", "meca_parts_#00", "big_pgun_part_#00", "book_gen_letter_#00",
            }
            .ToDictionary(uid => uid, uid => new ItemWithoutRecipeDto { Uid = uid, Img = uid, Label = new Dictionary<string, string> { ["fr"] = uid } });

        private static MyHordesMetaResultCodeModel MetaResult(string atomType, string payloadJson) => new()
        {
            AtomList = new List<MetaResultAtom>
            {
                new() { Atom = atomType, Payload = JObject.Parse(payloadJson) }
            }
        };

        /// <summary>Jetons chaîne en <c>string</c>, objets en <c>JObject</c>, comme <see cref="ActionResultConverter"/>.</summary>
        private static List<object> Result(string json) =>
            JArray.Parse(json).Select(token => token.Type == JTokenType.String ? (object)token.Value<string>()! : token).ToList();

        private static List<ActionOutcomeDto> Decode(string resultJson, bool conditionalOnSuccess = false) =>
            ActionOutcomeDecoder.Decode(Result(resultJson), MetaResultsByName, ResultGroupsByName, CatalogByUid, conditionalOnSuccess);

        private static ActionOutcomeDto SingleOutcome(List<ActionOutcomeDto> outcomes, ActionOutcomeKind kind, string? uid = null, int? quantity = null) =>
            outcomes.Should().ContainSingle(o => o.Kind == kind && (o.Item == null ? null : o.Item.Uid) == uid && (quantity == null || o.Quantity == quantity)).Subject;

        [Fact]
        public void SpawnPondere_SpawnMetalbox()
        {
            var outcomes = Decode("""["spawn_metalbox"]""");

            outcomes.Should().HaveCount(7).And.OnlyContain(o => o.Kind == ActionOutcomeKind.Produced && o.Quantity == 1);
            SingleOutcome(outcomes, ActionOutcomeKind.Produced, "bandage_#00").Probability.Should().BeApproximately(0.28, 1e-9);
            SingleOutcome(outcomes, ActionOutcomeKind.Produced, "lights_#00").Probability.Should().BeApproximately(0.04, 1e-9);
        }

        [Fact]
        public void GroupeNomme_GBreak20()
        {
            var outcomes = Decode("""[{"group": "g_break_20"}]""");

            outcomes.Should().ContainSingle();
            SingleOutcome(outcomes, ActionOutcomeKind.Broken).Probability.Should().BeApproximately(0.2, 1e-9);
        }

        [Fact]
        public void GroupeKill_G_kill_1z_33()
        {
            var outcomes = Decode("""[{"group": "g_kill_1z_33"}]""");

            outcomes.Should().ContainSingle();
            var kill = SingleOutcome(outcomes, ActionOutcomeKind.Kill);
            kill.KillMin.Should().Be(1);
            kill.KillMax.Should().Be(1);
            kill.Probability.Should().BeApproximately(0.33, 1e-9);
        }

        /// <summary>Le jeu code « tous les zombies » par 999999 : l'issue Kill n'a alors aucune borne.</summary>
        [Fact]
        public void KillAllZombie_SansBornes()
        {
            var kill = SingleOutcome(Decode("""["kill_all_zombie"]"""), ActionOutcomeKind.Kill);

            kill.KillMin.Should().BeNull();
            kill.KillMax.Should().BeNull();
        }

        [Fact]
        public void BrancheEnChaine_Jerrycan1()
        {
            var outcomes = Decode("""["consume_micropur", "consume_item", {"group": [["spawn_2_water", 75], ["spawn_3_water", 25]]}]""");

            outcomes.Should().HaveCount(3);
            SingleOutcome(outcomes, ActionOutcomeKind.Consumed).Probability.Should().BeApproximately(1, 1e-9);
            SingleOutcome(outcomes, ActionOutcomeKind.Produced, "water_#00", 2).Probability.Should().BeApproximately(0.75, 1e-9);
            SingleOutcome(outcomes, ActionOutcomeKind.Produced, "water_#00", 3).Probability.Should().BeApproximately(0.25, 1e-9);
        }

        [Fact]
        public void PileDetruiteOuRendue_FirePilegun3()
        {
            var outcomes = Decode("""[{"group": [[["msg_battery_destroy", "spawn_empty_battery", "morph_big_pgun_empty"], 50], [["msg_battery_drop", "spawn_battery", "morph_big_pgun_empty"], 50]]}, "kill_2_zombie"]""");

            outcomes.Should().HaveCount(4);
            SingleOutcome(outcomes, ActionOutcomeKind.Produced, "pile_broken_#00").Probability.Should().BeApproximately(0.5, 1e-9);
            SingleOutcome(outcomes, ActionOutcomeKind.Produced, "pile_#00").Probability.Should().BeApproximately(0.5, 1e-9);
            SingleOutcome(outcomes, ActionOutcomeKind.Transformed, "big_pgun_empty_#00").Probability.Should().BeApproximately(1, 1e-9);
            var kill = SingleOutcome(outcomes, ActionOutcomeKind.Kill);
            kill.KillMin.Should().Be(2);
            kill.KillMax.Should().Be(2);
            kill.Probability.Should().BeApproximately(1, 1e-9);
        }

        [Fact]
        public void DechargementAleatoire_FireTaser()
        {
            var outcomes = Decode("""[{"group": "g_kill_1z_30_taser"}, {"group": [[["do_nothing"], 3], [["msg_battery_use", "morph_taser_empty"], 7]]}]""");

            SingleOutcome(outcomes, ActionOutcomeKind.Transformed, "taser_empty_#00").Probability.Should().BeApproximately(0.7, 1e-9);
            SingleOutcome(outcomes, ActionOutcomeKind.Kill).Probability.Should().BeApproximately(0.3, 1e-9);
        }

        [Fact]
        public void ConditionnelAuSucces_OpenSafe()
        {
            var outcomes = Decode("""["minus_1ap", {"group": [[["do_nothing"], 95], [["consume_item", "spawn_safe"], 5]]}]""", conditionalOnSuccess: true);

            SingleOutcome(outcomes, ActionOutcomeKind.Consumed).Probability.Should().BeApproximately(1, 1e-9);
            SingleOutcome(outcomes, ActionOutcomeKind.Produced, "pocket_belt_#00").Probability.Should().BeApproximately(15.0 / 95, 1e-9);
        }

        [Fact]
        public void CleInconnue_Leve()
        {
            var act = () => Decode("""["identifiant_absent"]""");

            act.Should().Throw<InvalidOperationException>().WithMessage("*identifiant_absent*");
        }

        /// <summary>Somme des poids nulle → tirage uniforme (RandomGenerator::pickEntryFromRawRandomArray côté jeu).</summary>
        [Fact]
        public void GroupeAPoidsNuls_TirageUniforme()
        {
            var outcomes = Decode("""[{"group": [[["consume_item"], 0], [["break_item"], 0]]}]""");

            outcomes.Should().HaveCount(2);
            SingleOutcome(outcomes, ActionOutcomeKind.Consumed).Probability.Should().BeApproximately(0.5, 1e-9);
            SingleOutcome(outcomes, ActionOutcomeKind.Broken).Probability.Should().BeApproximately(0.5, 1e-9);
        }

        [Fact]
        public void SpawnAPoidsNuls_TirageUniforme()
        {
            var outcomes = Decode("""["spawn_poids_nuls"]""");

            outcomes.Should().HaveCount(4).And.OnlyContain(o => o.Kind == ActionOutcomeKind.Produced);
            outcomes.Should().OnlyContain(o => Math.Abs(o.Probability - 0.25) < 1e-9);
        }
    }
}
