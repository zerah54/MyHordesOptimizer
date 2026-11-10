using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Services.Impl.BuildingPlans;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.BuildingPlans
{
    public class BuildingPlanValidatorTests
    {
        [Theory]
        [InlineData("  Plan A  ", "Plan A")]
        [InlineData("Plan B 🧟", "Plan B 🧟")]
        public void NormalizeName_TrimsAndAcceptsEmoji(string input, string expected)
        {
            BuildingPlanValidator.NormalizeName(input).Should().Be(expected);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void NormalizeName_RejectsEmpty(string? input)
        {
            var act = () => BuildingPlanValidator.NormalizeName(input);
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void NormalizeName_RejectsMoreThan64Characters()
        {
            var act = () => BuildingPlanValidator.NormalizeName(new string('a', 65));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_AcceptsAnEmptyContent()
        {
            BuildingPlanValidator.SerializeContent(new BuildingPlanContentDto()).Should().Contain("\"BasePa\":19");
        }

        [Fact]
        public void SerializeContent_RejectsNull()
        {
            var act = () => BuildingPlanValidator.SerializeContent(null);
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsNegativePaInSteps()
        {
            var content = new BuildingPlanContentDto { Programs = { Regular = { new PlanStepDto { BuildingId = 1, Kind = "build", TargetRemaining = -1 } } } };
            var act = () => BuildingPlanValidator.SerializeContent(content);
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsUnknownStepKind()
        {
            var content = new BuildingPlanContentDto { Programs = { Banned = { new PlanStepDto { BuildingId = 1, Kind = "destroy" } } } };
            var act = () => BuildingPlanValidator.SerializeContent(content);
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsUnknownPool()
        {
            var content = new BuildingPlanContentDto { TownLines = { new PlanTownLineDto { Label = "x", Pool = "everyone", Pa = 1 } } };
            var act = () => BuildingPlanValidator.SerializeContent(content);
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_AcceptsNegativeTownLines()
        {
            var content = new BuildingPlanContentDto { TownLines = { new PlanTownLineDto { Label = "Portes", Pool = "regular", Pa = -2 } } };
            BuildingPlanValidator.SerializeContent(content).Should().Contain("-2");
        }

        [Fact]
        public void SerializeContent_RejectsTooManyRows()
        {
            var content = new BuildingPlanContentDto();
            content.Programs.Regular.AddRange(Enumerable.Range(0, 501).Select(i => new PlanStepDto { BuildingId = i, Kind = "build" }));
            var act = () => BuildingPlanValidator.SerializeContent(content);
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsContentOver256KiB()
        {
            var content = new BuildingPlanContentDto();
            for (var i = 0; i < 500; i++)
            {
                content.DefenseSources.Add(new PlanDefenseSourceDto { Label = new string('é', 64), Pa = 1, Def = 1, Qty = 1 });
            }
            for (var i = 0; i < 500; i++)
            {
                content.TownLines.Add(new PlanTownLineDto { Label = new string('é', 64), Pool = "regular", Pa = 1 });
            }
            for (var i = 0; i < 500; i++)
            {
                content.Citizens.Add(new PlanCitizenDto { UserId = i, Tasks = Enumerable.Range(0, 500).Select(t => new PlanTaskDto { Kind = "free", Label = new string('é', 64), Pa = 1 }).ToList() });
            }
            var act = () => BuildingPlanValidator.SerializeContent(content);
            act.Should().Throw<MhoTechnicalException>();
        }

        private static BuildingPlanContentDto WithRegular(params PlanStepDto[] steps)
        {
            var content = new BuildingPlanContentDto();
            content.Programs.Regular.AddRange(steps);
            return content;
        }

        [Fact]
        public void SerializeContent_AcceptsLegacyStepWithoutMode()
        {
            var json = BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { BuildingId = 1, Kind = "build", TargetRemaining = 10 }));
            json.Should().Contain("\"TargetRemaining\":10");
        }

        [Theory]
        [InlineData("build", "finish")]
        [InlineData("build", "leave")]
        [InlineData("repair", "finish")]
        [InlineData("repair", "leave")]
        [InlineData("repair", "survive")]
        public void SerializeContent_AcceptsKnownModes(string kind, string mode)
        {
            BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { BuildingId = 1, Kind = kind, Mode = mode }));
        }

        [Fact]
        public void SerializeContent_RejectsUnknownMode()
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { BuildingId = 1, Kind = "build", Mode = "half" }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsSurviveOnBuild()
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { BuildingId = 1, Kind = "build", Mode = "survive" }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsBuildStepWithoutBuilding()
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { Kind = "repair", Mode = "finish" }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_AcceptsInstruction()
        {
            var json = BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { Kind = "instruction", Text = "Attendre l'expé" }));
            json.Should().Contain("Attendre l'expé");
        }

        [Fact]
        public void SerializeContent_RejectsInstructionWithBuilding()
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { BuildingId = 1, Kind = "instruction", Text = "x" }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsInstructionWithMode()
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { Kind = "instruction", Text = "x", Mode = "finish" }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void SerializeContent_RejectsBlankInstruction(string? text)
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { Kind = "instruction", Text = text }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsInstructionOver200Characters()
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { Kind = "instruction", Text = new string('a', 201) }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_AcceptsNoteOfExactly200Characters()
        {
            BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { BuildingId = 1, Kind = "build", Note = new string('é', 200) }));
        }

        [Fact]
        public void SerializeContent_RejectsNoteOver200Characters()
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { BuildingId = 1, Kind = "build", Note = new string('é', 201) }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsNoteOnInstruction()
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { Kind = "instruction", Text = "x", Note = "y" }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsTextOnBuildingStep()
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithRegular(new PlanStepDto { BuildingId = 1, Kind = "build", Text = "x" }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_AcceptsInstructionsOf2000Characters()
        {
            BuildingPlanValidator.SerializeContent(new BuildingPlanContentDto { Instructions = new string('a', 2000) });
        }

        [Fact]
        public void SerializeContent_RejectsInstructionsOver2000Characters()
        {
            var act = () => BuildingPlanValidator.SerializeContent(new BuildingPlanContentDto { Instructions = new string('a', 2001) });
            act.Should().Throw<MhoTechnicalException>();
        }

        [Theory]
        [InlineData(0)]
        [InlineData(2)]
        public void SerializeContent_AcceptsPlanTierInRange(int tier)
        {
            BuildingPlanValidator.SerializeContent(new BuildingPlanContentDto { PlanTiers = new Dictionary<int, int> { { 5, tier } } });
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(3)]
        public void SerializeContent_RejectsPlanTierOutOfRange(int tier)
        {
            var act = () => BuildingPlanValidator.SerializeContent(new BuildingPlanContentDto { PlanTiers = new Dictionary<int, int> { { 5, tier } } });
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsTooManyPlanTiers()
        {
            var content = new BuildingPlanContentDto { PlanTiers = Enumerable.Range(0, 501).ToDictionary(i => i, _ => 1) };
            var act = () => BuildingPlanValidator.SerializeContent(content);
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void ValidateItemValues_RejectsNegativeValues()
        {
            var act = () => BuildingPlanValidator.ValidateItemValues(new Dictionary<int, int> { { 5, -1 } });
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void ValidateItemValues_AcceptsZeroAndEmpty()
        {
            BuildingPlanValidator.ValidateItemValues(new Dictionary<int, int> { { 5, 0 } });
            BuildingPlanValidator.ValidateItemValues(new Dictionary<int, int>());
        }

        private static BuildingPlanContentDto WithTasks(params PlanTaskDto[] tasks)
        {
            var content = new BuildingPlanContentDto();
            content.Citizens.Add(new PlanCitizenDto { UserId = 1, Tasks = tasks.ToList() });
            return content;
        }

        [Fact]
        public void SerializeContent_AcceptsActionTask()
        {
            BuildingPlanValidator.SerializeContent(WithTasks(new PlanTaskDto { Id = "a1", Kind = "action", Ref = "home_crows", Pa = 1 }));
        }

        [Fact]
        public void SerializeContent_AcceptsPlannedLosses()
        {
            var content = new BuildingPlanContentDto();
            content.Losses.Add(new PlanLossDto { BuildingId = 3, Kind = "destroyed" });
            content.Losses.Add(new PlanLossDto { BuildingId = 3, Kind = "bonus" });

            BuildingPlanValidator.SerializeContent(content);
        }

        [Theory]
        [InlineData("burnt", 4)]
        [InlineData("destroyed", 3)]
        public void SerializeContent_RejectsUnknownOrDuplicateLoss(string kind, int buildingId)
        {
            var content = new BuildingPlanContentDto();
            content.Losses.Add(new PlanLossDto { BuildingId = 3, Kind = "destroyed" });
            content.Losses.Add(new PlanLossDto { BuildingId = buildingId, Kind = kind });

            var act = () => BuildingPlanValidator.SerializeContent(content);
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_AcceptsActionTaskWithSeveralUses()
        {
            BuildingPlanValidator.SerializeContent(WithTasks(new PlanTaskDto { Id = "a1", Kind = "action", Ref = "home_scavenge", Count = 3, Pa = 3 }));
        }

        [Theory]
        [InlineData("action", 0)]
        [InlineData("action", 4)]
        [InlineData("free", 2)]
        public void SerializeContent_RejectsInvalidUses(string kind, int count)
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithTasks(new PlanTaskDto { Kind = kind, Ref = "home_scavenge", Label = "x", Count = count }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Theory]
        [InlineData("../../DataImport/all")]
        [InlineData("home crows")]
        [InlineData("Home_Crows")]
        public void SerializeContent_RejectsActionRefThatIsNotAnActionKey(string reference)
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithTasks(new PlanTaskDto { Kind = "action", Ref = reference }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Theory]
        [InlineData(null)]
        [InlineData(" ")]
        public void SerializeContent_RejectsActionTaskWithoutRef(string? reference)
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithTasks(new PlanTaskDto { Kind = "action", Ref = reference }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Theory]
        [InlineData(null)]
        [InlineData(0)]
        [InlineData(21)]
        public void SerializeContent_RejectsStructuredHomeUpgradeWithoutValidLevel(int? level)
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithTasks(new PlanTaskDto { Kind = "homeUpgrade", Ref = "kitchenLevel", Level = level }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_AcceptsLegacyHomeUpgradeWithLabelOnly()
        {
            BuildingPlanValidator.SerializeContent(WithTasks(new PlanTaskDto { Kind = "homeUpgrade", Label = "Cuisine" }));
        }

        [Fact]
        public void SerializeContent_AcceptsTaskWithoutId()
        {
            BuildingPlanValidator.SerializeContent(WithTasks(new PlanTaskDto { Kind = "free", Label = "x" }));
        }

        [Theory]
        [InlineData("")]
        [InlineData("a b")]
        [InlineData("é")]
        [InlineData("abcdefghijklmnopqrstuvwxy")]
        public void SerializeContent_RejectsInvalidTaskId(string id)
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithTasks(new PlanTaskDto { Id = id, Kind = "free" }));
            act.Should().Throw<MhoTechnicalException>();
        }

        [Fact]
        public void SerializeContent_RejectsDuplicateTaskIdForACitizen()
        {
            var act = () => BuildingPlanValidator.SerializeContent(WithTasks(new PlanTaskDto { Id = "x_1", Kind = "free" }, new PlanTaskDto { Id = "x_1", Kind = "free" }));
            act.Should().Throw<MhoTechnicalException>();
        }
    }
}
