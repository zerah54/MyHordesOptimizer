using System.Collections.Generic;
using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.Estimations;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Estimations
{
    public class SoulsJsonTests
    {
        [Fact]
        public void Serialize_omits_zero_rows_and_sorts_by_percent() =>
            SoulsJson.Serialize(new Dictionary<int, int> { [38] = 2, [33] = 1, [42] = 0 }).Should().Be("{\"33\":1,\"38\":2}");

        [Fact]
        public void Serialize_stores_an_empty_object_without_any_soul_so_that_clearing_is_persisted() =>
            SoulsJson.Serialize(new Dictionary<int, int> { [33] = 0 }).Should().Be("{}");

        [Fact]
        public void Parse_reads_the_stored_json() =>
            SoulsJson.Parse("{\"33\":1,\"38\":2}").Should().Equal(new Dictionary<int, int> { [33] = 1, [38] = 2 });

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("{}")]
        [InlineData("pas du json")]
        public void Parse_returns_an_empty_dictionary_for_missing_empty_or_invalid_json(string? json) =>
            SoulsJson.Parse(json).Should().BeEmpty();
    }
}
