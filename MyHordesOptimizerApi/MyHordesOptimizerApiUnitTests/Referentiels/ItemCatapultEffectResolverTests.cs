using System;
using System.Collections.Generic;
using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Items;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// Un cas par fate réel du jeu (voir ActionCatapultProvider.php côté MyHordes), résolu
    /// mécaniquement depuis actions.json + meta-results.json, sans table codée en dur.
    /// </summary>
    public class ItemCatapultEffectResolverTests
    {
        private static readonly Dictionary<string, MyHordesActionsCodeModel> ActionsByName = new()
        {
            ["cata_rsc_fine"] = new MyHordesActionsCodeModel { Result = new List<object> { "morph_cata_fine" } },
            ["cata_rsc_destroy"] = new MyHordesActionsCodeModel { Result = new List<object> { "consume_item" } },
            ["cata_wpn_break_1_rid"] = new MyHordesActionsCodeModel { Result = new List<object> { "morph_cata_break", "cata_kill_1_rid" } },
            ["cata_wpn_scrap_c_low"] = new MyHordesActionsCodeModel { Result = new List<object> { "morph_cata_scrap", "cata_kill_c_low" } },
            ["cata_wpn_destroy_c_ctrl"] = new MyHordesActionsCodeModel { Result = new List<object> { "consume_item", "cata_kill_c_ctrl" } },
            ["cata_effet_inconnu"] = new MyHordesActionsCodeModel { Result = new List<object> { "identifiant_absent" } },
        };

        private static readonly Dictionary<string, MyHordesMetaResultCodeModel> MetaResultsByName = new()
        {
            ["morph_cata_fine"] = MetaResult(MetaResultAtomExtensions.ItemEffectAtomType, """{"morphSourceType": null, "breakSource": null}"""),
            ["morph_cata_break"] = MetaResult(MetaResultAtomExtensions.ItemEffectAtomType, """{"morphSourceType": null, "breakSource": true}"""),
            ["morph_cata_scrap"] = MetaResult(MetaResultAtomExtensions.ItemEffectAtomType, """{"morphSourceType": "metal_bad_#00", "breakSource": null}"""),
            ["cata_kill_1_rid"] = MetaResult(MetaResultAtomExtensions.ZoneEffectAtomType, """{"zombieMin": 0, "zombieMax": 3, "zombieKillRange": 0}"""),
            ["cata_kill_c_low"] = MetaResult(MetaResultAtomExtensions.ZoneEffectAtomType, """{"zombieMin": 4, "zombieMax": 10, "zombieKillRange": 1}"""),
            ["cata_kill_c_ctrl"] = MetaResult(MetaResultAtomExtensions.ZoneEffectAtomType, """{"escape": 300, "escapeRange": 1}"""),
        };

        private static MyHordesMetaResultCodeModel MetaResult(string atomType, string payloadJson) => new()
        {
            AtomList = new List<MetaResultAtom>
            {
                new() { Atom = atomType, Payload = Newtonsoft.Json.Linq.JObject.Parse(payloadJson) }
            }
        };

        private static readonly List<ItemWithoutRecipeDto> Catalog = new()
        {
            new ItemWithoutRecipeDto { Uid = "metal_bad_#00", Img = "item_metal_bad.gif", Label = new Dictionary<string, string> { ["fr"] = "Mauvais métal" } },
        };

        [Fact]
        public void UnObjetCataRscFine_EstIntactSansEffetDeZone()
        {
            var items = new List<ItemWithoutRecipeDto> { new() { Uid = "wood2_#00" } };
            var catapultByUid = new Dictionary<string, string> { ["wood2_#00"] = "cata_rsc_fine" };

            ItemCatapultEffectResolver.PopulateCatapultEffects(items, Catalog, catapultByUid, ActionsByName, MetaResultsByName);

            items[0].CatapultEffect.Fate.Should().Be(CatapultFate.Intact);
            items[0].CatapultEffect.KillMin.Should().BeNull();
        }

        [Fact]
        public void UnObjetSansConsumeItemNiMorph_EstDetruit()
        {
            var items = new List<ItemWithoutRecipeDto> { new() { Uid = "egg_#00" } };
            var catapultByUid = new Dictionary<string, string> { ["egg_#00"] = "cata_rsc_destroy" };

            ItemCatapultEffectResolver.PopulateCatapultEffects(items, Catalog, catapultByUid, ActionsByName, MetaResultsByName);

            items[0].CatapultEffect.Fate.Should().Be(CatapultFate.Destroyed);
        }

        [Fact]
        public void UnObjetArmeQuiCasse_PorteSonFateEtSaPlageDeKillsSansRayon()
        {
            var items = new List<ItemWithoutRecipeDto> { new() { Uid = "bone_#00" } };
            var catapultByUid = new Dictionary<string, string> { ["bone_#00"] = "cata_wpn_break_1_rid" };

            ItemCatapultEffectResolver.PopulateCatapultEffects(items, Catalog, catapultByUid, ActionsByName, MetaResultsByName);

            var effect = items[0].CatapultEffect;
            effect.Fate.Should().Be(CatapultFate.Broken);
            effect.KillMin.Should().Be(0);
            effect.KillMax.Should().Be(3);
            effect.Radius.Should().Be(CatapultRadius.Target);
            effect.RepelSeconds.Should().BeNull();
        }

        [Fact]
        public void UnObjetTransforme_PorteLeResumeDeLObjetObtenuEtSonRayonEnCroix()
        {
            var items = new List<ItemWithoutRecipeDto> { new() { Uid = "cinema_#00" } };
            var catapultByUid = new Dictionary<string, string> { ["cinema_#00"] = "cata_wpn_scrap_c_low" };

            ItemCatapultEffectResolver.PopulateCatapultEffects(items, Catalog, catapultByUid, ActionsByName, MetaResultsByName);

            var effect = items[0].CatapultEffect;
            effect.Fate.Should().Be(CatapultFate.Transformed);
            effect.MorphTarget.Uid.Should().Be("metal_bad_#00");
            effect.KillMin.Should().Be(4);
            effect.KillMax.Should().Be(10);
            effect.Radius.Should().Be(CatapultRadius.Cross);
        }

        [Fact]
        public void UnObjetARepulsion_PorteLaDureeSansPlageDeKills()
        {
            var items = new List<ItemWithoutRecipeDto> { new() { Uid = "flash_#00" } };
            var catapultByUid = new Dictionary<string, string> { ["flash_#00"] = "cata_wpn_destroy_c_ctrl" };

            ItemCatapultEffectResolver.PopulateCatapultEffects(items, Catalog, catapultByUid, ActionsByName, MetaResultsByName);

            var effect = items[0].CatapultEffect;
            effect.Fate.Should().Be(CatapultFate.Destroyed);
            effect.RepelSeconds.Should().Be(300);
            effect.KillMin.Should().BeNull();
            effect.Radius.Should().Be(CatapultRadius.Cross);
        }

        [Fact]
        public void UnObjetSansActionCatapulte_NObtientAucunEffet()
        {
            var items = new List<ItemWithoutRecipeDto> { new() { Uid = "sans_catapulte_#00" } };

            ItemCatapultEffectResolver.PopulateCatapultEffects(items, Catalog, new Dictionary<string, string>(), ActionsByName, MetaResultsByName);

            items[0].CatapultEffect.Should().BeNull();
        }

        [Fact]
        public void UnIdentifiantDeResultatInconnuDeMetaResults_LeveUneException()
        {
            var items = new List<ItemWithoutRecipeDto> { new() { Uid = "mystere_#00" } };
            var catapultByUid = new Dictionary<string, string> { ["mystere_#00"] = "cata_effet_inconnu" };

            var act = () => ItemCatapultEffectResolver.PopulateCatapultEffects(items, Catalog, catapultByUid, ActionsByName, MetaResultsByName);

            act.Should().Throw<InvalidOperationException>();
        }
    }
}
