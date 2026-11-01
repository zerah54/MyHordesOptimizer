using FluentAssertions;
using MyHordesOptimizerApi.Extensions.Models.Expeditions;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApiUnitTests.Expeditions
{
    public class ExpeditionOrderCopyTests
    {
        [Fact]
        public void Copy_GardeLExpeditionAAttendreEtLaNote()
        {
            var copy = new ExpeditionOrder { IdExpeditionOrder = 5, Kind = "wait", IdTargetExpedition = 7, Note = "avancer ensemble" }.Copy();

            copy.IdExpeditionOrder.Should().Be(0);
            copy.IdTargetExpedition.Should().Be(7);
            copy.Note.Should().Be("avancer ensemble");
        }

        [Fact]
        public void Copy_GardeLePassage()
        {
            new ExpeditionOrder { X = 3, Y = 3, Passage = 2 }.Copy().Passage.Should().Be(2);
        }
    }
}
