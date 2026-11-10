using FluentAssertions;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Maps;
using System.Collections.Generic;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Maps
{
    /// <summary>
    /// Passages d'éclaireur sur la case courante. Le niveau d'exploration prime : un nombre connu est
    /// ramené dans sa plage (MyHordes <c>Zone::getScoutLevel</c> : <c>min(3, floor(passages / 5))</c>).
    /// Sans niveau, un nombre saisi donne le niveau ; un nombre vidé dans la popup devient inconnu.
    /// </summary>
    public class MapCellScoutVisitsTests
    {
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

        [Theory]
        // Popup, sans niveau : le nombre (borné à 0-15) donne le niveau
        [InlineData(null, true, 7, null, 7, 1)]
        [InlineData(null, true, 20, null, 15, 3)]
        [InlineData(null, true, -3, null, 0, 0)]
        // Popup, avec niveau : il prime, le nombre est ramené dans sa plage
        [InlineData(12, true, 2, 2, 10, 2)]
        [InlineData(12, true, 2, 0, 2, 0)]
        [InlineData(null, true, 7, 2, 10, 2)]
        [InlineData(null, true, 12, 3, 15, 3)]
        // Popup, champ vidé : le nombre devient inconnu, le niveau ne bouge pas
        [InlineData(12, true, null, 2, null, 2)]
        [InlineData(12, true, null, null, null, 2)]
        // Addon : le niveau lu prime, le nombre connu est ramené dans sa plage dans les deux sens
        [InlineData(4, false, null, 2, 10, 2)]
        [InlineData(7, false, null, 1, 7, 1)]
        [InlineData(12, false, null, 1, 9, 1)]
        [InlineData(14, false, null, 3, 15, 3)]
        // Addon, nombre inconnu : il le reste
        [InlineData(null, false, null, 2, null, 2)]
        // Addon, aucun niveau lu : rien ne change
        [InlineData(7, false, null, null, 7, 1)]
        public void PassagesEtNiveauDExploration(int? storedVisits, bool entered, int? visits, int? level, int? expectedVisits, int? expectedLevel)
        {
            var cell = new MapCell { X = 0, Y = 0, ScoutVisits = storedVisits, ScoutZoneLevel = storedVisits / 5 };
            var cells = new List<MapCell> { cell };

            cells.ApplyJobRadars(DigObservations.WithoutHistory(new ScrutateurConfiguration()), 0, 0, null, level, visits, entered, null, null, 1);

            cell.ScoutVisits.Should().Be(expectedVisits);
            cell.ScoutZoneLevel.Should().Be(expectedLevel);
        }
    }
}
