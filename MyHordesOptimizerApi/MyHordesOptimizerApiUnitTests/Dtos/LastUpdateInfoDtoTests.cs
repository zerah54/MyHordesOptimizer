using System;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Dtos
{
    /// <summary>
    /// MySQL ne conserve pas le Kind d'un DateTime : une valeur UTC écrite puis relue via EF
    /// revient en DateTimeKind.Unspecified. System.Text.Json sérialise alors sans suffixe 'Z',
    /// et le front-end interprète la date comme locale au lieu de la convertir depuis l'UTC
    /// (décalage de 2h en été pour un client en France).
    /// </summary>
    public class LastUpdateInfoDtoTests
    {
        [Fact]
        public void UpdateTime_AffecteAvecKindUnspecified_EstForceEnUtc()
        {
            var unspecified = new DateTime(2026, 9, 14, 8, 44, 46, DateTimeKind.Unspecified);

            var dto = new LastUpdateInfoDto { UpdateTime = unspecified };

            dto.UpdateTime.Kind.Should().Be(DateTimeKind.Utc);
            dto.UpdateTime.Should().Be(unspecified);
        }

        [Fact]
        public void UpdateTime_AffecteAvecKindUtc_RestInchange()
        {
            var utc = DateTime.UtcNow;

            var dto = new LastUpdateInfoDto { UpdateTime = utc };

            dto.UpdateTime.Kind.Should().Be(DateTimeKind.Utc);
            dto.UpdateTime.Should().Be(utc);
        }
    }
}
