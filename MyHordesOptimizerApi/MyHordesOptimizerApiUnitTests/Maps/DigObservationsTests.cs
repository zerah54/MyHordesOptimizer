using FluentAssertions;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Maps;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Maps
{
    /// <summary>
    /// Observations de l'état de fouille : une case vue vide puis retrouvée non vide a été régénérée,
    /// et, si une seule nuit au vent inconnu pouvait le faire, elle révèle ce vent.
    /// </summary>
    public class DigObservationsTests
    {
        private const double Chance = 0.85;
        private const double AverageAmount = 11.5;

        private sealed class ScrutateurConfiguration : IMyHordesScrutateurConfiguration
        {
            public int Id => 80;
            public int Level0 => 25;
            public int Level1 => 37;
            public int Level2 => 49;
            public int Level3 => 61;
            public int Level4 => 73;
            public int Level5 => 85;
            public int StartItemMin => 4;
            public int StartItemMax => 8;
            public int MinItemAdd => 8;
            public int MaxItemAdd => 15;
            public int? MaxItemPerCell => null;
            public int DigThrottle => 10;
            public int WindDistance => 2;
            public int WindDistanceSmallMap => -1;
        }

        private static MapCellDigUpdate Night(int day, DirectionEnum wind)
        {
            return new MapCellDigUpdate { IdTown = 1, Day = day, DirectionRegen = (int)wind, LevelRegen = 5, TauxRegen = 85 };
        }

        private static MapCell Cell(DirectionEnum zone, int km, float average, int maximum, bool isDryed = false, int? observedDay = null)
        {
            return new MapCell
            {
                IsTown = false,
                NbKm = km,
                ZoneRegen = (int)zone,
                AveragePotentialRemainingDig = average,
                MaxPotentialRemainingDig = maximum,
                IsDryed = isDryed,
                DigsObservedDay = observedDay
            };
        }

        private static DigObservations Observations(int day, List<MapCellDigUpdate> nights, List<MapCell> cells, int digsSince = 0)
        {
            return new DigObservations(day, 2, new ScrutateurConfiguration(), () => nights, (_, _) => digsSince, () => cells);
        }

        [Fact]
        public void CaseVueVide_RetrouveeNonVide_ApresUneNuitAuVentConnu_ARecuUneRegeneration()
        {
            var cell = Cell(DirectionEnum.North, 5, (float)(Chance * AverageAmount), 15, isDryed: true, observedDay: 3);
            var night = Night(4, DirectionEnum.North);

            Observations(4, new List<MapCellDigUpdate> { night }, new List<MapCell> { cell }).Observe(cell, DigBounds.NotDepleted);

            cell.AveragePotentialRemainingDig.Should().BeApproximately(11.5f, 0.001f);
            cell.MaxPotentialRemainingDig.Should().Be(15);
            cell.IsDryed.Should().BeFalse();
            cell.DigsObservedDay.Should().Be(4);
            night.DirectionRegen.Should().Be((int)DirectionEnum.North);
        }

        [Fact]
        public void LesFouillesReussiesDepuisSontDeduites_EtLeMinimumTient()
        {
            var cell = Cell(DirectionEnum.North, 5, 1, 15, isDryed: true, observedDay: 3);

            Observations(5, new List<MapCellDigUpdate> { Night(4, DirectionEnum.North) }, new List<MapCell> { cell }, digsSince: 3)
                .Observe(cell, DigBounds.NotDepleted);

            cell.AveragePotentialRemainingDig.Should().BeApproximately(8.5f, 0.001f);
            cell.MaxPotentialRemainingDig.Should().Be(12);
        }

        [Fact]
        public void UneSeuleNuitPossible_AuVentInconnu_RevueLeVent_EtCorrigeLesAutresCases()
        {
            var revealer = Cell(DirectionEnum.North, 5, (float)(Chance * AverageAmount / 8), 15, isDryed: true, observedDay: 3);
            var sameWind = Cell(DirectionEnum.North, 6, 2, 10);
            var otherWind = Cell(DirectionEnum.South, 6, 2, 20);
            var observedSince = Cell(DirectionEnum.South, 6, 2, 20, observedDay: 4);
            var tooClose = Cell(DirectionEnum.South, 2, 2, 20);
            var night = Night(4, DirectionEnum.All);
            var cells = new List<MapCell> { revealer, sameWind, otherWind, observedSince, tooClose };

            Observations(4, new List<MapCellDigUpdate> { night }, cells).Observe(revealer, DigBounds.NotDepleted);

            night.DirectionRegen.Should().Be((int)DirectionEnum.North);
            revealer.AveragePotentialRemainingDig.Should().BeApproximately(11.5f, 0.001f);
            double eighth = Chance * AverageAmount / 8;
            sameWind.AveragePotentialRemainingDig.Should().BeApproximately((float)(2 + 7 * eighth), 0.001f);
            sameWind.MaxPotentialRemainingDig.Should().Be(10);
            otherWind.AveragePotentialRemainingDig.Should().BeApproximately((float)(2 - eighth), 0.001f);
            otherWind.MaxPotentialRemainingDig.Should().Be(5);
            observedSince.AveragePotentialRemainingDig.Should().Be(2);
            observedSince.MaxPotentialRemainingDig.Should().Be(20);
            tooClose.AveragePotentialRemainingDig.Should().Be(2);
            tooClose.MaxPotentialRemainingDig.Should().Be(20);
        }

        [Fact]
        public void PlusieursNuitsPossibles_MoyenneConditionnelle_SansRevelation()
        {
            var cell = Cell(DirectionEnum.North, 5, 0, 30, isDryed: true, observedDay: 3);
            var unknown = Night(4, DirectionEnum.All);
            var known = Night(5, DirectionEnum.North);

            Observations(5, new List<MapCellDigUpdate> { unknown, known }, new List<MapCell> { cell }).Observe(cell, DigBounds.NotDepleted);

            double p1 = Chance / 8;
            double p2 = Chance;
            double expected = (p1 + p2) / (1 - (1 - p1) * (1 - p2)) * AverageAmount;
            cell.AveragePotentialRemainingDig.Should().BeApproximately((float)expected, 0.001f);
            cell.MaxPotentialRemainingDig.Should().Be(30);
            unknown.DirectionRegen.Should().Be((int)DirectionEnum.All);
        }

        [Fact]
        public void LesNuitsHorsDuVentNeComptentPas_EtUneNuitInconnueRestanteEstRevelee()
        {
            var cell = Cell(DirectionEnum.North, 5, 1, 15, isDryed: true, observedDay: 3);
            var outOfWind = Night(4, DirectionEnum.South);
            var unknown = Night(5, DirectionEnum.All);

            Observations(5, new List<MapCellDigUpdate> { outOfWind, unknown }, new List<MapCell> { cell }).Observe(cell, DigBounds.NotDepleted);

            cell.MaxPotentialRemainingDig.Should().Be(15);
            unknown.DirectionRegen.Should().Be((int)DirectionEnum.North);
        }

        [Fact]
        public void CaseToujoursVide_RevientAZero_EtLHistoriqueRepart()
        {
            var cell = Cell(DirectionEnum.North, 5, (float)(Chance * AverageAmount), 15, isDryed: true, observedDay: 3);

            Observations(4, new List<MapCellDigUpdate> { Night(4, DirectionEnum.North) }, new List<MapCell> { cell }).Observe(cell, DigBounds.Depleted);

            cell.AveragePotentialRemainingDig.Should().Be(0);
            cell.MaxPotentialRemainingDig.Should().Be(0);
            cell.IsDryed.Should().BeTrue();
            cell.DigsObservedDay.Should().Be(4);
        }

        [Fact]
        public void AucuneNuitPossible_LObservationSeuleSApplique()
        {
            var cell = Cell(DirectionEnum.North, 5, 0, 0, isDryed: true, observedDay: 4);

            Observations(4, new List<MapCellDigUpdate> { Night(4, DirectionEnum.North) }, new List<MapCell> { cell }).Observe(cell, DigBounds.NotDepleted);

            cell.AveragePotentialRemainingDig.Should().Be(1);
            cell.MaxPotentialRemainingDig.Should().Be(1);
            cell.IsDryed.Should().BeFalse();
        }

        [Fact]
        public void LeFouineurLEmporteSurLaDeduction()
        {
            var cell = Cell(DirectionEnum.North, 5, 1, 15, isDryed: true, observedDay: 3);

            Observations(4, new List<MapCellDigUpdate> { Night(4, DirectionEnum.North) }, new List<MapCell> { cell }).Observe(cell, DigBounds.ForScavLevel(1));

            cell.AveragePotentialRemainingDig.Should().Be(2);
            cell.MaxPotentialRemainingDig.Should().Be(2);
            cell.IsDryed.Should().BeFalse();
        }

        [Fact]
        public void SansHistorique_ObservationSeule_SansDate()
        {
            var cell = Cell(DirectionEnum.North, 5, 0, 15, isDryed: true, observedDay: 3);

            DigObservations.WithoutHistory(new ScrutateurConfiguration()).Observe(cell, DigBounds.NotDepleted);

            cell.AveragePotentialRemainingDig.Should().Be(1);
            cell.MaxPotentialRemainingDig.Should().Be(15);
            cell.DigsObservedDay.Should().Be(3);
        }

        [Fact]
        public void EtatNatif_AppliqueEnDernier_LaPageQuiLeContreditEstIgnoree()
        {
            // Page affichée avant qu'un autre citoyen vide la zone : « non vide » ; l'API, lue ensuite : vide.
            var cell = Cell(DirectionEnum.North, 5, 1, 15, isDryed: true, observedDay: 3);
            var night = Night(4, DirectionEnum.All);
            var observations = Observations(4, new List<MapCellDigUpdate> { night }, new List<MapCell> { cell });

            observations.ObserveAuthoritative(cell, DigBounds.Depleted);
            observations.Observe(cell, DigBounds.NotDepleted).Should().BeFalse();
            var applied = observations.ApplyAuthoritative();

            applied.Should().ContainSingle();
            cell.AveragePotentialRemainingDig.Should().Be(0);
            cell.MaxPotentialRemainingDig.Should().Be(0);
            cell.IsDryed.Should().BeTrue();
            // Ni déduction ni vent révélé sur la foi d'une page périmée.
            night.DirectionRegen.Should().Be((int)DirectionEnum.All);
        }

        [Fact]
        public void EtatNatif_CompatibleAvecLaPage_LesDeuxSeCombinent()
        {
            var cell = Cell(DirectionEnum.North, 5, 9, 15);
            var observations = Observations(4, new List<MapCellDigUpdate>(), new List<MapCell> { cell });

            observations.ObserveAuthoritative(cell, DigBounds.NotDepleted);
            observations.Observe(cell, DigBounds.ForScavLevel(2)).Should().BeTrue();
            observations.ApplyAuthoritative();

            cell.AveragePotentialRemainingDig.Should().Be(6);
            cell.MaxPotentialRemainingDig.Should().Be(6);
            cell.IsDryed.Should().BeFalse();
        }

        [Fact]
        public void EtatNatif_NonAppliqueAvantLaFin()
        {
            var cell = Cell(DirectionEnum.North, 5, 4, 8);
            var observations = Observations(4, new List<MapCellDigUpdate>(), new List<MapCell> { cell });

            observations.ObserveAuthoritative(cell, DigBounds.Depleted);

            cell.AveragePotentialRemainingDig.Should().Be(4);
            observations.ApplyAuthoritative();
            cell.AveragePotentialRemainingDig.Should().Be(0);
        }

        [Fact]
        public void Deduction_PlusDeFouillesQuePossible_ResteAuMoinsUne()
        {
            var inference = RegenerationInference.From(new List<double> { 0.5 }, 20, AverageAmount, 8, 15, null);

            inference.Should().Be(new RegenerationInference(1, 1, 1));
            RegenerationInference.From(new List<double>(), 0, AverageAmount, 8, 15, null).Should().BeNull();
        }

        [Fact]
        public void CorrectionDuVent_ZoneDejaRemplie_ChanceReduite()
        {
            var cell = Cell(DirectionEnum.North, 5, 12, 30);

            DigObservations.CorrectForRevealedWind(cell, true, Chance, AverageAmount, 15, 10, null);

            cell.AveragePotentialRemainingDig.Should().BeApproximately((float)(12 + 7 * Chance * 0.33 * AverageAmount / 8), 0.001f);
            cell.MaxPotentialRemainingDig.Should().Be(30);
        }
    }
}
