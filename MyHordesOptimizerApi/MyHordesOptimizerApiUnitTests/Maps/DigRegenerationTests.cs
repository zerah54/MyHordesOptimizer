using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Maps;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Maps
{
    /// <summary>
    /// Régénération nocturne, alignée sur MyHordes : vent dans un octant, au-delà de la distance du
    /// vent, chance de la Tour de guet avancée (×0,33 au-delà de 10 objets), 8 à 15 objets.
    /// </summary>
    public class DigRegenerationTests
    {
        // Ville en (10, 10) : une case en (10, 5) est à 5 km plein nord (le nord vers les y décroissants en base).
        private const int TownX = 10;
        private const int TownY = 10;

        private static RegenerationNight Night(DirectionEnum? wind, bool hasNight = true, int windDistance = 2)
        {
            return new RegenerationNight(Day: 5, HasNight: hasNight, Wind: wind, ScrutateurLevel: 0, ChancePercent: 25,
                WindDistance: windDistance, AverageAmount: 11.5, MaximumAmount: 15, CrowdThreshold: 10, MaxItemPerCell: null);
        }

        private static MapCell Cell(int x, int y, float average, int maximum, bool isDryed = false)
        {
            return new MapCell { X = x, Y = y, IsTown = false, AveragePotentialRemainingDig = average, MaxPotentialRemainingDig = maximum, IsDryed = isDryed };
        }

        [Fact]
        public void VentConnu_CaseDansLOctant_GagneLEsperanceEtLeMaximum_SansCertitude()
        {
            var cell = Cell(10, 5, 0, 0, isDryed: true);

            DigRegeneration.ApplyNight(cell, TownX, TownY, Night(DirectionEnum.North));

            cell.AveragePotentialRemainingDig.Should().BeApproximately(0.25f * 11.5f, 0.001f);
            cell.MaxPotentialRemainingDig.Should().Be(15);
            // 25 % de chances seulement : la case reste vue vide jusqu'à la prochaine observation.
            cell.IsDryed.Should().BeTrue();
            cell.ZoneRegen.Should().Be((int)DirectionEnum.North);
            cell.NbKm.Should().Be(5);
        }

        [Fact]
        public void VentConnu_CaseHorsOctant_Inchangee()
        {
            var cell = Cell(10, 15, 3, 5);

            DigRegeneration.ApplyNight(cell, TownX, TownY, Night(DirectionEnum.North));

            cell.AveragePotentialRemainingDig.Should().Be(3);
            cell.MaxPotentialRemainingDig.Should().Be(5);
        }

        [Fact]
        public void CaseEnDecaDeLaDistanceDuVent_Inchangee()
        {
            var cell = Cell(10, 8, 3, 5);

            DigRegeneration.ApplyNight(cell, TownX, TownY, Night(DirectionEnum.North));

            cell.AveragePotentialRemainingDig.Should().Be(3);
            cell.MaxPotentialRemainingDig.Should().Be(5);
        }

        [Fact]
        public void PetiteCarte_ToutesDistances()
        {
            var cell = Cell(10, 9, 0, 0);

            DigRegeneration.ApplyNight(cell, TownX, TownY, Night(DirectionEnum.North, windDistance: -1));

            cell.MaxPotentialRemainingDig.Should().Be(15);
        }

        [Fact]
        public void VentInconnu_UneChanceSurHuit_EtLObservationTient()
        {
            var cell = Cell(10, 5, 0, 0, isDryed: true);

            DigRegeneration.ApplyNight(cell, TownX, TownY, Night(null));

            cell.AveragePotentialRemainingDig.Should().BeApproximately(0.25f * 11.5f / 8, 0.001f);
            cell.MaxPotentialRemainingDig.Should().Be(15);
            cell.IsDryed.Should().BeTrue();
        }

        [Fact]
        public void ZoneDejaBienRemplie_ChanceReduite()
        {
            var cell = Cell(10, 5, 12, 20);

            DigRegeneration.ApplyNight(cell, TownX, TownY, Night(DirectionEnum.North));

            cell.AveragePotentialRemainingDig.Should().BeApproximately(12 + 0.25f * 0.33f * 11.5f, 0.001f);
            cell.MaxPotentialRemainingDig.Should().Be(35);
        }

        [Fact]
        public void PremierJour_AucuneNuit()
        {
            var cell = Cell(10, 5, 6, 8);

            DigRegeneration.ApplyNight(cell, TownX, TownY, Night(DirectionEnum.North, hasNight: false));

            cell.AveragePotentialRemainingDig.Should().Be(6);
            cell.MaxPotentialRemainingDig.Should().Be(8);
        }

        [Fact]
        public void ProbabiliteDeRegeneration_SelonLeVentEtLaDistance()
        {
            var north = new MapCell { IsTown = false, NbKm = 5, ZoneRegen = (int)DirectionEnum.North };
            var close = new MapCell { IsTown = false, NbKm = 2, ZoneRegen = (int)DirectionEnum.North };
            MapCellDigUpdate NightOf(DirectionEnum wind, int chance = 85) => new MapCellDigUpdate { Day = 4, DirectionRegen = (int)wind, TauxRegen = chance };

            DigRegeneration.RegenerationProbability(north, NightOf(DirectionEnum.North), 2).Should().BeApproximately(0.85, 0.0001);
            DigRegeneration.RegenerationProbability(north, NightOf(DirectionEnum.South), 2).Should().Be(0);
            DigRegeneration.RegenerationProbability(north, NightOf(DirectionEnum.All), 2).Should().BeApproximately(0.85 / 8, 0.0001);
            DigRegeneration.RegenerationProbability(close, NightOf(DirectionEnum.North), 2).Should().Be(0);
            DigRegeneration.RegenerationProbability(close, NightOf(DirectionEnum.North), -1).Should().BeApproximately(0.85, 0.0001);
            DigRegeneration.RegenerationProbability(north, NightOf(DirectionEnum.North, chance: 0), 2).Should().Be(0);
        }

        [Fact]
        public void LaVilleNEstJamaisRegeneree()
        {
            var cell = new MapCell { X = TownX, Y = TownY, IsTown = true };

            DigRegeneration.ApplyNight(cell, TownX, TownY, Night(null));

            cell.MaxPotentialRemainingDig.Should().BeNull();
        }
    }
}
