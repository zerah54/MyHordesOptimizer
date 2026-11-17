using Xunit;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApiUnitTests.PreTowns;

public class PreTownIdsTests
{
    [Fact]
    public void ToMapId_AjouteOffset() => Assert.Equal(1_000_000_005, PreTownIds.ToMapId(5));

    [Fact]
    public void ToIdTown_EstNegatifOffset() => Assert.Equal(-1_000_000_005, PreTownIds.ToIdTown(5));

    [Theory]
    [InlineData(999_999_999, false)]
    [InlineData(1_000_000_001, true)]
    public void IsPreTownMapId_DistingueLesPlages(int mapId, bool attendu) => Assert.Equal(attendu, PreTownIds.IsPreTownMapId(mapId));

    [Theory]
    [InlineData(-1_000_000_001, true)]
    [InlineData(-42, false)]
    [InlineData(7, false)]
    public void IsPreTownIdTown_DistingueLesPlages(int idTown, bool attendu) => Assert.Equal(attendu, PreTownIds.IsPreTownIdTown(idTown));
}
