using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.ExternalTools
{
    /// <summary>ZenHordes ne se déclenche que sur une case envoyée par l'addon, jamais en s'appuyant sur les autres outils.</summary>
    public class ExternalToolsUpdatePlanZenTests
    {
        private static UpdateRequestDto Request(string isZenHordes, UpdateCellInfoDto? zenHordesCell)
        {
            return new UpdateRequestDto
            {
                TownDetails = new UpdateTownDetailsDto { TownId = 1 },
                Map = new UpdateRequestMapDto
                {
                    ZenHordesCell = zenHordesCell,
                    ToolsToUpdate = new UpdateRequestMapToolsToUpdateDetailsDto
                    {
                        IsMyHordesOptimizer = "none",
                        IsGestHordes = "none",
                        IsFataMorgana = "none",
                        IsBigBrothHordes = "none",
                        IsZenHordes = isZenHordes
                    }
                }
            };
        }

        [Fact]
        public void Build_ZenHordesCellAvecCase_PlanifieSeulementZen()
        {
            var plan = ExternalToolsUpdatePlan.Build(Request("cell", new UpdateCellInfoDto { X = 1, Y = 2 }));

            plan.Zen.Should().BeTrue();
            plan.MhoMap.Should().BeFalse();
            plan.GhMap.Should().BeFalse();
            plan.Fata.Should().BeFalse();
            plan.Bbh.Should().BeFalse();
        }

        [Theory]
        [InlineData("none")]
        [InlineData("api")]
        [InlineData(null)]
        public void Build_ZenHordesSansDemandeDeCase_NePlanifiePasZen(string isZenHordes)
        {
            var plan = ExternalToolsUpdatePlan.Build(Request(isZenHordes, new UpdateCellInfoDto { X = 1, Y = 2 }));

            plan.Zen.Should().BeFalse();
        }

        [Fact]
        public void Build_ZenHordesCellSansCase_NePlanifiePasZen()
        {
            var plan = ExternalToolsUpdatePlan.Build(Request("cell", null));

            plan.Zen.Should().BeFalse();
        }
    }
}
