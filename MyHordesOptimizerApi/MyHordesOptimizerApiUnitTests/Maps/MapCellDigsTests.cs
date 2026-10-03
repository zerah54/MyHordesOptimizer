using FluentAssertions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Maps
{
    /// <summary>
    /// Fouilles restantes stockées : une observation ramène les valeurs dans sa fourchette, les
    /// fouilles réussies les font baisser sans passer sous 0, les ajouts les font remonter.
    /// </summary>
    public class MapCellDigsTests
    {
        private static MapCell Cell(float? average, int? maximum, bool? isDryed = false)
        {
            return new MapCell { AveragePotentialRemainingDig = average, MaxPotentialRemainingDig = maximum, IsDryed = isDryed };
        }

        [Fact]
        public void CaseEpuisee_RestantsAZero_QuellesQueSoientLesValeursPrecedentes()
        {
            var cell = Cell(12.5f, 20);

            cell.ApplyObservation(DigBounds.Depleted);

            cell.AveragePotentialRemainingDig.Should().Be(0);
            cell.MaxPotentialRemainingDig.Should().Be(0);
            cell.IsDryed.Should().BeTrue();
        }

        [Fact]
        public void CaseNonEpuisee_RestantsRemontesAUn_EtMarqueurLeve()
        {
            var cell = Cell(0.4f, 0, isDryed: true);

            cell.ApplyObservation(DigBounds.NotDepleted);

            cell.AveragePotentialRemainingDig.Should().Be(1);
            cell.MaxPotentialRemainingDig.Should().Be(1);
            cell.IsDryed.Should().BeFalse();
        }

        [Fact]
        public void CaseNonEpuisee_NeTouchePasAUnRestantDejaSuffisant()
        {
            var cell = Cell(6.2f, 9);

            cell.ApplyObservation(DigBounds.NotDepleted);

            cell.AveragePotentialRemainingDig.Should().Be(6.2f);
            cell.MaxPotentialRemainingDig.Should().Be(9);
        }

        [Theory]
        [InlineData(0, 0, 0)]
        [InlineData(1, 1, 2)]
        [InlineData(2, 3, 6)]
        public void NiveauFouineur_FourchetteDuJeu(int level, int min, int max)
        {
            DigBounds.ForScavLevel(level).Should().Be(new DigBounds(min, max));
        }

        [Fact]
        public void NiveauFouineurTrois_SansBorneHaute()
        {
            DigBounds.ForScavLevel(3).Should().Be(new DigBounds(7, null));
        }

        [Fact]
        public void NiveauFouineur_RameneLesDeuxValeursDansLaFourchette()
        {
            var cell = Cell(1.5f, 15);

            cell.ApplyObservation(DigBounds.ForScavLevel(2));

            cell.AveragePotentialRemainingDig.Should().Be(3);
            cell.MaxPotentialRemainingDig.Should().Be(6);
            cell.IsDryed.Should().BeFalse();
        }

        [Fact]
        public void DeuxObservations_OnGardeLeurIntersection()
        {
            DigBounds.NotDepleted.Intersect(DigBounds.ForScavLevel(1)).Should().Be(new DigBounds(1, 2));
            DigBounds.ForScavLevel(3).Intersect(new DigBounds(0, 10)).Should().Be(new DigBounds(7, 10));
        }

        [Fact]
        public void Recouvrement()
        {
            DigBounds.NotDepleted.Overlaps(DigBounds.ForScavLevel(2)).Should().BeTrue();
            DigBounds.Depleted.Overlaps(DigBounds.NotDepleted).Should().BeFalse();
            DigBounds.ForScavLevel(1).Overlaps(DigBounds.ForScavLevel(2)).Should().BeFalse();
        }

        [Fact]
        public void DeuxObservationsContradictoires_LaPlusRecenteLEmporte()
        {
            DigBounds.Depleted.Intersect(DigBounds.NotDepleted).Should().Be(DigBounds.NotDepleted);
            DigBounds.ForScavLevel(3).Intersect(DigBounds.Depleted).Should().Be(DigBounds.Depleted);
        }

        [Fact]
        public void FouillesReussies_FontBaisser_SansPasserSousZero()
        {
            var cell = Cell(2.5f, 3);

            cell.ApplySuccessfulDigsDelta(4);

            cell.AveragePotentialRemainingDig.Should().Be(0);
            cell.MaxPotentialRemainingDig.Should().Be(0);
        }

        [Fact]
        public void EstimationRevueALaBaisse_RendLesFouilles()
        {
            var cell = Cell(2f, 3);

            cell.ApplySuccessfulDigsDelta(-2);

            cell.AveragePotentialRemainingDig.Should().Be(4);
            cell.MaxPotentialRemainingDig.Should().Be(5);
        }

        [Fact]
        public void EstimationRevueALaBaisse_NeRendRienAUneCaseVueEpuisee()
        {
            var cell = Cell(0f, 0, isDryed: true);

            cell.ApplySuccessfulDigsDelta(-2);

            cell.AveragePotentialRemainingDig.Should().Be(0);
            cell.MaxPotentialRemainingDig.Should().Be(0);
        }

        [Fact]
        public void Ajout_RespecteLePlafond_EtNeLevePasLeMarqueur()
        {
            var cell = Cell(8f, 12, isDryed: true);

            cell.AddDigs(3.5, 15, 20);

            cell.AveragePotentialRemainingDig.Should().Be(11.5f);
            cell.MaxPotentialRemainingDig.Should().Be(20);
            cell.IsDryed.Should().BeTrue();
        }

        [Fact]
        public void Excavation_RemplaceLEstimation_EtLeveLeMarqueur()
        {
            // Le jeu n'excave qu'une zone vide : l'estimation d'avant (ici fausse) ne compte plus.
            var cell = Cell(3f, 9, isDryed: true);

            cell.ApplyExcavation(11.5, 15, null);

            cell.AveragePotentialRemainingDig.Should().Be(11.5f);
            cell.MaxPotentialRemainingDig.Should().Be(15);
            cell.IsDryed.Should().BeFalse();
        }
    }
}
