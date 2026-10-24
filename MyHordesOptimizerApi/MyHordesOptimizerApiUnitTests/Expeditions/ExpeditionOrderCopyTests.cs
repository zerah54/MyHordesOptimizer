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
    }
}
