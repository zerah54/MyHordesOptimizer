using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Extensions;
using System.Collections.Generic;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Data.Items
{
    /// <summary>
    /// Verrou sur la désérialisation de <c>meta-results.json</c>, vérifié byte pour byte contre le
    /// contenu réel du fichier (entrée <c>eat_ap6</c>, relevée le 2026-08-14).
    /// </summary>
    public class MyHordesMetaResultCodeModelTests
    {
        private const string EatAp6Json = """
        {
            "eat_ap6": {
                "atomList": [
                    {
                        "processor": "App\\Service\\Actions\\Game\\AtomProcessors\\Effect\\ProcessStatusEffect",
                        "atom": "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\StatusEffect",
                        "payload": {
                            "pointType": 1,
                            "pointRelativeToMax": 1,
                            "pointValue": 0,
                            "pointExceedMax": 0,
                            "pointCapAt": null,
                            "statusTo": "haseaten",
                            "statusFrom": null
                        }
                    },
                    {
                        "processor": "App\\Service\\Actions\\Game\\AtomProcessors\\Effect\\ProcessStatusEffect",
                        "atom": "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\StatusEffect",
                        "payload": {
                            "pointType": 4,
                            "pointRelativeToMax": 2,
                            "pointValue": 0,
                            "pointExceedMax": 0,
                            "pointCapAt": null
                        }
                    },
                    {
                        "processor": "App\\Service\\Actions\\Game\\AtomProcessors\\Effect\\ProcessMessageEffect",
                        "atom": "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\MessageEffect",
                        "payload": {
                            "escort": false,
                            "text": "..."
                        }
                    }
                ],
                "identifier": "eat_ap6"
            }
        }
        """;

        [Fact]
        public void DeserialiseEatAp6_AvecTroisAtomesHeterogenes()
        {
            var results = EatAp6Json.FromJson<Dictionary<string, MyHordesMetaResultCodeModel>>();
            var eatAp6 = results["eat_ap6"];

            eatAp6.Identifier.Should().Be("eat_ap6");
            eatAp6.AtomList.Should().HaveCount(3);
        }

        [Fact]
        public void PremierAtome_EstUnEffetPointAp_RelatifAuMaxSansBonus()
        {
            var results = EatAp6Json.FromJson<Dictionary<string, MyHordesMetaResultCodeModel>>();
            var atome = results["eat_ap6"].AtomList[0];

            atome.IsStatusEffect().Should().BeTrue();
            var effet = atome.AsStatusEffect()!;
            effet.PointType.Should().Be(PointType.Ap);
            effet.PointRelativeToMax.Should().Be(RelativeMaxPoint.RelativeToMax);
            effet.PointValue.Should().Be(0);
            effet.StatusTo.Should().Be("haseaten");
        }

        [Fact]
        public void DeuxiemeAtome_EstUnEffetPointSp_RelatifAuMaxExtensionSeul()
        {
            var results = EatAp6Json.FromJson<Dictionary<string, MyHordesMetaResultCodeModel>>();
            var atome = results["eat_ap6"].AtomList[1];

            var effet = atome.AsStatusEffect()!;
            effet.PointType.Should().Be(PointType.Sp);
            effet.PointRelativeToMax.Should().Be(RelativeMaxPoint.RelativeToExtensionMax);
        }

        [Fact]
        public void TroisiemeAtome_NEstPasUnEffetPoint_AsStatusEffectRenvoieNull()
        {
            var results = EatAp6Json.FromJson<Dictionary<string, MyHordesMetaResultCodeModel>>();
            var atome = results["eat_ap6"].AtomList[2];

            atome.IsStatusEffect().Should().BeFalse();
            atome.AsStatusEffect().Should().BeNull();
        }

        [Fact]
        public void UneEntreeExprimeeCommeUnTableauVide_DeserialiseSansExceptionAvecUneListeVide()
        {
            var json = """
            {
                "do_nothing": []
            }
            """;

            var results = json.FromJson<Dictionary<string, MyHordesMetaResultCodeModel>>();

            results["do_nothing"].AtomList.Should().BeEmpty();
        }
    }
}
