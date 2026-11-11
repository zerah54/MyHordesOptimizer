using FluentAssertions;
using MyHordesOptimizerApi.Extensions;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Extensions
{
    /// <summary>
    /// Fourchette de zombies déduite de l'estimation de l'Éclaireur (MyHordes <c>Zone::getPersonalScoutEstimation</c> :
    /// 0 zombie donne exactement 0, sinon <c>max(0, zombies + bruit)</c> avec un bruit de ±max(2 - niveau, 0)).
    /// </summary>
    public class MapCellRadarExtensionsTests
    {
        [Theory]
        [InlineData(0, null, 0, 2)]
        [InlineData(0, 0, 0, 2)]
        [InlineData(0, 1, 0, 1)]
        [InlineData(0, 2, 0, 0)]
        [InlineData(1, null, 1, 3)]
        [InlineData(1, 1, 1, 2)]
        [InlineData(1, 2, 1, 1)]
        [InlineData(4, null, 2, 6)]
        [InlineData(4, 3, 4, 4)]
        public void FourchetteDeZombies(int estimation, int? niveau, int minAttendu, int maxAttendu)
        {
            MapCellRadarExtensions.GetScoutEstimationMin(estimation, niveau).Should().Be(minAttendu);
            MapCellRadarExtensions.GetScoutEstimationMax(estimation, niveau).Should().Be(maxAttendu);
        }
    }
}
