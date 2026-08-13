using FluentAssertions;
using MyHordesOptimizerApi.Models.Expeditions;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Expeditions
{
    /// <summary>
    /// Règle : les jours antérieurs au jour actuel de la ville sont verrouillés,
    /// le jour actuel et les jours suivants restent modifiables.
    /// </summary>
    public class ExpeditionDayLockTests
    {
        [Theory]
        [InlineData(4, 5)]
        [InlineData(1, 5)]
        public void JourAnterieurAuJourDeLaVille_EstVerrouille(int expeditionDay, int townDay)
        {
            ExpeditionDayLock.IsLocked(expeditionDay, townDay).Should().BeTrue();
        }

        [Theory]
        [InlineData(5, 5)]
        [InlineData(6, 5)]
        [InlineData(100, 5)]
        public void JourActuelOuFutur_NEstPasVerrouille(int expeditionDay, int townDay)
        {
            ExpeditionDayLock.IsLocked(expeditionDay, townDay).Should().BeFalse();
        }

        [Fact]
        public void JourAbsent_NEstPasVerrouille()
        {
            ExpeditionDayLock.IsLocked(null, 5).Should().BeFalse();
        }
    }
}
