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
                EveningSecondVoteBuildingId = 13,
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
            restored.EveningSecondVoteBuildingId.Should().BeNull();
            restored.BudgetMode.Should().BeNull();
            restored.BasePaTier.Should().BeNull();
            restored.ExpeditionRab.Should().Be(0);
            restored.ValidatedBudget.Should().BeNull();
        }

        [Fact]
        public void Content_RoundTripsPlannedChaos()
        {
            var restored = new BuildingPlanContentDto { Chaos = true }.ToJson().FromJson<BuildingPlanContentDto>();

            restored.Chaos.Should().BeTrue();
            new BuildingPlanContentDto().ToJson().FromJson<BuildingPlanContentDto>().Chaos.Should().BeFalse();
        }

        [Fact]
        public void Content_RoundTripsSimpleBudgetFields()
        {
            var content = new BuildingPlanContentDto
            {
                BudgetMode = "simple",
                BasePaTier = "b7",
                ExpeditionRab = 12,
                Citizens = { new PlanCitizenDto { UserId = 1, Worker = true, Ghoul = true } },
                ValidatedBudget = new ValidatedBudgetDto
                {
                    ValidatedAt = "2026-11-13T10:00:00Z",
                    Pools = { { "banned", new ValidatedPoolDto { Budget = 10, Cost = 8 } }, { "regular", new ValidatedPoolDto { Budget = 100, Cost = 90 } } },
                    Steps = { new ValidatedStepDto { BuildingId = 12, Kind = "build", Pool = "banned", PaCost = 30, Invested = 12, Life = 7 } }
                }
            };

            var restored = content.ToJson().FromJson<BuildingPlanContentDto>();

            restored.Should().BeEquivalentTo(content);
            restored.Citizens[0].Worker.Should().BeTrue();
            restored.Citizens[0].Ghoul.Should().BeTrue();
            restored.ValidatedBudget!.Pools["regular"].Cost.Should().Be(90);
            restored.ValidatedBudget.Steps[0].Pool.Should().Be("banned");
            restored.ValidatedBudget.Steps[0].Invested.Should().Be(12);
            restored.ValidatedBudget.Steps[0].Life.Should().Be(7);
            "{\"buildingId\":1,\"kind\":\"build\",\"paCost\":3}".FromJson<ValidatedStepDto>().Invested.Should().Be(0);
            "{\"buildingId\":1,\"kind\":\"repair\",\"paCost\":3}".FromJson<ValidatedStepDto>().Life.Should().Be(0);
        }
    }
}
