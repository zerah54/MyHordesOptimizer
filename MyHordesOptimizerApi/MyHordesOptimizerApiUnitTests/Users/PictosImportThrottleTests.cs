using System;
using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Users
{
    public class PictosImportThrottleTests
    {
        private static readonly DateTime Now = new(2026, 11, 23, 12, 0, 0, DateTimeKind.Utc);

        [Theory]
        [InlineData(null, null, 100, false)] // jamais importé
        [InlineData(25, 100, 100, false)]    // import de plus de 24 h
        [InlineData(1, 100, 100, true)]      // toujours dans la ville du dernier import
        [InlineData(1, 100, 200, false)]     // ville quittée depuis le dernier import
        [InlineData(1, 100, 0, false)]       // hors ville depuis le dernier import
        [InlineData(1, 0, 200, false)]       // en ville après un import hors ville
        [InlineData(1, 0, 0, true)]          // toujours hors ville
        [InlineData(1, null, 200, true)]     // ville du dernier import non retenue
        [InlineData(1, 100, null, true)]     // ville courante inconnue (import depuis un profil)
        public void IsPictosImportThrottled_LeveLaLimiteDes24hQuandLeJoueurAQuitteSaVille(
            int? importedHoursAgo, int? importMapId, int? currentMapId, bool expected)
        {
            DateTime? importedAt = importedHoursAgo.HasValue ? Now.AddHours(-importedHoursAgo.Value) : null;

            MyHordesFetcherService.IsPictosImportThrottled(importedAt, importMapId, currentMapId, Now)
                .Should().Be(expected);
        }
    }
}
