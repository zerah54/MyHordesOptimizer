using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch;
using System;
using System.Text.Json;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Nightwatch
{
    public class NightwatchStateDtoTests
    {
        [Fact]
        public void BagAndChestDates_Unspecified_AreSerializedAsUtc()
        {
            // MySQL rend des DateTime Unspecified : sans correction, la chaîne n'aurait pas de 'Z'.
            var citizen = new NightwatchCitizenStateDto
            {
                BagUpdatedAt = new DateTime(2026, 11, 13, 10, 0, 0, DateTimeKind.Unspecified),
                ChestUpdatedAt = new DateTime(2026, 11, 13, 9, 0, 0, DateTimeKind.Unspecified)
            };

            var json = JsonSerializer.Serialize(citizen);

            json.Should().Contain("\"BagUpdatedAt\":\"2026-11-13T10:00:00Z\"");
            json.Should().Contain("\"ChestUpdatedAt\":\"2026-11-13T09:00:00Z\"");
        }

        [Fact]
        public void BagAndChestDates_Null_StayNull()
        {
            var citizen = new NightwatchCitizenStateDto { BagUpdatedAt = null, ChestUpdatedAt = null };

            citizen.BagUpdatedAt.Should().BeNull();
            citizen.ChestUpdatedAt.Should().BeNull();
            JsonSerializer.Serialize(citizen).Should().Contain("\"BagUpdatedAt\":null");
        }
    }
}
