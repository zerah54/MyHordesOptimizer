using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.MappingProfiles.Expeditions;
using MyHordesOptimizerApi.Models;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.MappingProfiles
{
    public class ExpeditionOrderMappingTests
    {
        private static readonly IMapper Mapper = new MapperConfiguration(cfg => cfg.AddMaps(typeof(ExpeditionMappingProfiles).Assembly), NullLoggerFactory.Instance).CreateMapper();

        [Fact]
        public void Consigne_NoteEtExpeditionAAttendre_AllerRetour()
        {
            var model = Mapper.Map<ExpeditionOrder>(new ExpeditionOrderDto { Kind = "wait", Note = "  avancer ensemble  ", TargetExpeditionId = 7 });

            model.Note.Should().Be("avancer ensemble");
            model.IdTargetExpedition.Should().Be(7);
            var dto = Mapper.Map<ExpeditionOrderDto>(model);
            dto.Note.Should().Be("avancer ensemble");
            dto.TargetExpeditionId.Should().Be(7);
        }

        [Fact]
        public void Consigne_Passage_AllerRetour()
        {
            Mapper.Map<ExpeditionOrder>(new ExpeditionOrderDto { X = 3, Y = 3, Passage = 2 }).Passage.Should().Be(2);
            Mapper.Map<ExpeditionOrderDto>(new ExpeditionOrder { X = 3, Y = 3, Passage = 2 }).Passage.Should().Be(2);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Consigne_NoteVide_Null(string? note)
        {
            Mapper.Map<ExpeditionOrder>(new ExpeditionOrderDto { Kind = "camp", Note = note }).Note.Should().BeNull();
        }
    }
}
