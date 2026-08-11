using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Items;
using MyHordesOptimizerApi.Repository.Impl;
using Newtonsoft.Json.Linq;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// Dérivation du coût (PA/PC) et de la chance de réussite d'une action d'ouverture à partir
    /// de son <c>result</c> brut — jamais un poids de groupe lu comme un pourcentage brut (les
    /// poids ne sont pas garantis sommer à 100, cf. <c>load_lpointer</c> dans le jeu).
    /// </summary>
    public class ItemOpenerResolverCostTests
    {
        private static JObject Group(params (object[] actions, int weight)[] branches)
        {
            var group = new JArray();
            foreach (var (actions, weight) in branches)
            {
                group.Add(new JArray(new JArray(actions), weight));
            }
            return new JObject { ["group"] = group };
        }

        [Fact]
        public void UneActionSansCoutNiGroupe_NeRenvoieRien()
        {
            var result = new object[] { "consume_item", "spawn_abox" };

            var (apCost, cpCost, successRate) = ItemOpenerResolver.ParseCostAndChance(result);

            apCost.Should().BeNull();
            cpCost.Should().BeNull();
            successRate.Should().BeNull();
        }

        [Fact]
        public void UneActionAvecMinus1ApEtGroupe95_5_RenvoieLeCoutEtLaChanceDeReussite()
        {
            var result = new object[]
            {
                "minus_1ap",
                Group((new object[] { "do_nothing" }, 95), (new object[] { "consume_item", "spawn_safe" }, 5))
            };

            var (apCost, cpCost, successRate) = ItemOpenerResolver.ParseCostAndChance(result);

            apCost.Should().Be(1);
            cpCost.Should().BeNull();
            successRate.Should().Be(0.05);
        }

        [Fact]
        public void DesPoidsQuiNeSommentPasA100_SontNormalisesParLeTotal()
        {
            // Reproduit load_lpointer : quatre branches de poids 1, dont une do_nothing (échec 1/4, succès 3/4).
            var result = new object[]
            {
                Group((new object[] { "morph_a" }, 1), (new object[] { "morph_b" }, 1), (new object[] { "do_nothing" }, 1), (new object[] { "morph_c" }, 1))
            };

            var (_, _, successRate) = ItemOpenerResolver.ParseCostAndChance(result);

            successRate.Should().Be(0.75);
        }

        [Fact]
        public void UnGroupeSansBrancheDoNothing_NeRenvoiePasDeChance()
        {
            var result = new object[] { Group((new object[] { "morph_a" }, 50), (new object[] { "morph_b" }, 50)) };

            var (_, _, successRate) = ItemOpenerResolver.ParseCostAndChance(result);

            successRate.Should().BeNull();
        }

        [Fact]
        public void UnGroupeExprimeCommeUneChaine_EstIgnore()
        {
            // Forme `{"group": "g_immune_98"}` utilisée ailleurs dans le jeu (référence à un
            // groupe nommé) — pas une chance exploitable ici.
            var result = new object[] { new JObject { ["group"] = "g_immune_98" } };

            var (apCost, cpCost, successRate) = ItemOpenerResolver.ParseCostAndChance(result);

            apCost.Should().BeNull();
            cpCost.Should().BeNull();
            successRate.Should().BeNull();
        }

        [Fact]
        public void UneActionAvecMinus1Cp_RenvoieLeCoutEnPc()
        {
            var result = new object[] { "minus_1cp", "consume_item", "spawn_metalbox" };

            var (apCost, cpCost, successRate) = ItemOpenerResolver.ParseCostAndChance(result);

            apCost.Should().BeNull();
            cpCost.Should().Be(1);
            successRate.Should().BeNull();
        }

        [Fact]
        public void UnGroupeAvecPoidsNonNumerique_NeLevePasEtNeRenvoiePasDeChance()
        {
            // Un poids non scalaire (ex. futur format de groupe non prévu) ne doit pas faire
            // planter la résolution de tout le catalogue : cf. ItemOpenerResolver.cs, aucun
            // appelant ne protège PopulateOpenerRelations par un try/catch.
            var group = new JArray { new JArray(new JArray("do_nothing"), "beaucoup") };
            var result = new object[] { new JObject { ["group"] = group } };

            Action act = () => ItemOpenerResolver.ParseCostAndChance(result);
            act.Should().NotThrow();

            var (apCost, cpCost, successRate) = ItemOpenerResolver.ParseCostAndChance(result);
            apCost.Should().BeNull();
            cpCost.Should().BeNull();
            successRate.Should().BeNull();
        }

        [Fact]
        public void UnResultNul_NeRenvoieRien()
        {
            var (apCost, cpCost, successRate) = ItemOpenerResolver.ParseCostAndChance(null);

            apCost.Should().BeNull();
            cpCost.Should().BeNull();
            successRate.Should().BeNull();
        }

        [Fact]
        public void SurLeReferentielReel_OpenAsafeExposeLeCoutEtLaChanceAttendus()
        {
            var actionsByName = new MyHordesCodeRepository().GetActions();

            var (apCost, cpCost, successRate) = ItemOpenerResolver.ParseCostAndChance(actionsByName["open_asafe"].Result);

            apCost.Should().Be(1);
            cpCost.Should().BeNull();
            successRate.Should().Be(0.05);
        }

        private static ItemWithoutRecipeDto Item(string uid, IEnumerable<string> properties, IEnumerable<string> actions)
        {
            return new ItemWithoutRecipeDto { Uid = uid, Img = uid + ".gif", Properties = properties, Actions = actions };
        }

        private static readonly Dictionary<string, MyHordesActionsCodeModel> ActionsByName = new()
        {
            { "open_safe", new MyHordesActionsCodeModel
                {
                    Meta = new List<string> { "min_1_ap", "not_tired", "is_not_wounded_hands" },
                    Result = new List<object> { "minus_1ap", Group((new object[] { "do_nothing" }, 95), (new object[] { "consume_item", "spawn_safe" }, 5)) }
                }
            },
            { "open_metalbox", new MyHordesActionsCodeModel { Meta = new List<string> { "not_profession_tech", "have_can_opener" } } },
            { "open_metalbox_t2", new MyHordesActionsCodeModel
                {
                    Meta = new List<string> { "profession_tech", "not_have_can_opener_hd", "min_1_cp" },
                    Result = new List<object> { "minus_1cp", "consume_item", "spawn_metalbox" }
                }
            },
            { "open_matbox1", new MyHordesActionsCodeModel { Meta = new List<string> { "is_not_wounded_hands" } } }
        };

        [Fact]
        public void UnContenantSansOutilAvecCoutEtChance_ExposeOpenApCostEtOpenSuccessRate()
        {
            var safe = Item("safe_#00", new string[0], new[] { "open_safe" });
            var items = new List<ItemWithoutRecipeDto> { safe };

            ItemOpenerResolver.PopulateOpenerRelations(items, items, ActionsByName);

            safe.OpenApCost.Should().Be(1);
            safe.OpenSuccessRate.Should().Be(0.05);
            safe.TechnicianOpenCpCost.Should().BeNull();
        }

        [Fact]
        public void UnContenantAOutilAvecAlternativeTechnicien_ExposeTechnicianOpenCpCost()
        {
            var canOpener = Item("can_opener_#00", new[] { "can_opener" }, new string[0]);
            var chestMetal = Item("chest_#00", new string[0], new[] { "open_metalbox", "open_metalbox_t2" });
            var items = new List<ItemWithoutRecipeDto> { canOpener, chestMetal };

            ItemOpenerResolver.PopulateOpenerRelations(items, items, ActionsByName);

            chestMetal.OpenedWith.Select(i => i.Uid).Should().BeEquivalentTo("can_opener_#00");
            chestMetal.TechnicianOpenCpCost.Should().Be(1);
            chestMetal.OpenApCost.Should().BeNull();
        }

        [Fact]
        public void UnContenantGratuitSansRisque_NaNiCoutNiChanceNiAlternative()
        {
            var rscPack = Item("rsc_pack_1_#00", new string[0], new[] { "open_matbox1" });
            var items = new List<ItemWithoutRecipeDto> { rscPack };

            ItemOpenerResolver.PopulateOpenerRelations(items, items, ActionsByName);

            rscPack.OpenApCost.Should().BeNull();
            rscPack.OpenSuccessRate.Should().BeNull();
            rscPack.TechnicianOpenCpCost.Should().BeNull();
        }
    }
}
