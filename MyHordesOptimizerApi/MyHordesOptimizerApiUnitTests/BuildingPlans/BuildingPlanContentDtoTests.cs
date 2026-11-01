using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Extensions;
using System.Collections.Generic;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.BuildingPlans
{
    public class BuildingPlanContentDtoTests
    {
        [Fact]
        public void Content_RoundTripsAndKeepsUnknownIds()
        {
            var content = new BuildingPlanContentDto
            {
                AttackOverride = 1443,
                AllowedOverflow = 21,
                EveningVoteBuildingId = 12,
                ManageBanned = true,
                BasePa = 19,
                Instructions = "Planches en banque avant 18h.",
                PlanTiers = new Dictionary<int, int> { { 777777, 2 } },
                Citizens = { new PlanCitizenDto { UserId = 999999, Tasks = { new PlanTaskDto { Kind = "home", Ref = "level", Level = 3, Pa = 5 } } } },
                TownLines = { new PlanTownLineDto { Label = "Guitare", Pool = "regular", Pa = 40 } },
                Programs =
                {
                    Banned = { new PlanStepDto { BuildingId = 777777, Kind = "build", Mode = "leave", TargetRemaining = 2, Note = "après 20h" } },
                    Regular =
                    {
                        new PlanStepDto { Kind = "instruction", Text = "Attendre le retour de l'expé" },
                        new PlanStepDto { BuildingId = 12, Kind = "repair", Mode = "survive" }
                    }
                },
                DefenseSources = { new PlanDefenseSourceDto { Label = "OD", Pa = 1, Def = 2, Qty = 10 } }
            };

            var restored = content.ToJson().FromJson<BuildingPlanContentDto>();

            restored.Should().BeEquivalentTo(content);
            restored.Citizens[0].UserId.Should().Be(999999);
            restored.Programs.Banned[0].BuildingId.Should().Be(777777);
            restored.Programs.Regular[0].BuildingId.Should().BeNull();
            restored.PlanTiers[777777].Should().Be(2);
            restored.ManageBanned.Should().BeTrue();
        }

        [Fact]
        public void Content_ReadsLegacyStepWithoutNewFields()
        {
            var restored = "{\"Programs\":{\"Regular\":[{\"BuildingId\":5,\"Kind\":\"build\",\"TargetRemaining\":0}]}}".FromJson<BuildingPlanContentDto>();

            var step = restored.Programs.Regular[0];
            step.BuildingId.Should().Be(5);
            step.Mode.Should().BeNull();
            step.Note.Should().BeNull();
            step.Text.Should().BeNull();
            restored.Instructions.Should().BeNull();
            restored.PlanTiers.Should().BeEmpty();
        }

        [Fact]
        public void Content_DefaultsAreUsableWithoutAnyField()
        {
            var restored = "{}".FromJson<BuildingPlanContentDto>();

            restored.BasePa.Should().Be(19);
            restored.ManageBanned.Should().BeFalse();
            restored.Citizens.Should().BeEmpty();
            restored.Programs.Banned.Should().BeEmpty();
            restored.Programs.Regular.Should().BeEmpty();
            restored.Instructions.Should().BeNull();
            restored.PlanTiers.Should().BeEmpty();
        }
    }
}
