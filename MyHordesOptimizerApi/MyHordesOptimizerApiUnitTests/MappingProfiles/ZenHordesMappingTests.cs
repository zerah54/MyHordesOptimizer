using System.Collections.Generic;
using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.ZenHordes;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.MappingProfiles;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.MappingProfiles
{
    /// <summary>
    /// ZenHordes valide chaque champ avec Zod : un champ optionnel doit être omis, jamais envoyé à null.
    /// Les données de case viennent de <c>Map.ZenHordesCell</c>, jamais de <c>Map.Cell</c> (réservée aux autres outils).
    /// </summary>
    public class ZenHordesMappingTests
    {
        private static IMapper NewMapper()
        {
            return new MapperConfiguration(cfg => cfg.AddMaps(typeof(FataMorganaMappingProfiles).Assembly), NullLoggerFactory.Instance).CreateMapper();
        }

        private static UpdateRequestDto Request(UpdateCellInfoDto zenHordesCell, UpdateCellInfoDto? cell = null)
        {
            return new UpdateRequestDto
            {
                TownDetails = new UpdateTownDetailsDto { TownId = 4242, TownX = 10, TownY = 10 },
                Map = new UpdateRequestMapDto { ZenHordesCell = zenHordesCell, Cell = cell }
            };
        }

        [Fact]
        public void CaseComplete_ChampsRecopies()
        {
            var cell = new UpdateCellInfoDto
            {
                X = -3,
                Y = 5,
                Zombies = 4,
                ZoneEmpty = true,
                Objects = new List<UpdateObjectDto> { new() { Id = 12, Count = 3, IsBroken = true }, new() { Id = 7, Count = 1, IsBroken = false } },
                ScavNextCells = new ScavNextCellsDto { North = true, East = false },
                ScoutNextCells = new ScoutNextCellsDto { South = 6, West = 0 }
            };

            var dto = NewMapper().Map<ZenHordesUpdateRequestDto>(Request(cell));

            dto.TownId.Should().Be(4242);
            dto.X.Should().Be(-3);
            dto.Y.Should().Be(5);
            dto.Zombies.Should().Be(4);
            dto.Depleted.Should().BeTrue();
            dto.Items.Should().BeEquivalentTo(new List<ZenHordesItemDto>
            {
                new() { Id = 12, Quantity = 3, Broken = true },
                new() { Id = 7, Quantity = 1, Broken = false }
            });
            dto.ScavRadar!.North.Should().BeTrue();
            dto.ScavRadar.East.Should().BeFalse();
            dto.ScoutRadar!.South.Should().Be(6);
            dto.ScoutRadar.West.Should().Be(0);
        }

        [Fact]
        public void CaseMinimale_AucunChampOptionnelDansLeJson()
        {
            var dto = NewMapper().Map<ZenHordesUpdateRequestDto>(Request(new UpdateCellInfoDto { X = 1, Y = 2 }));
            dto.UserId = 9;
            dto.Key = "cle";

            var json = dto.ToJson();

            json.Should().NotContain("null");
            json.Should().NotContain("zombies");
            json.Should().NotContain("depleted");
            json.Should().NotContain("items");
            json.Should().NotContain("scoutRadar");
            json.Should().NotContain("scavRadar");
            json.Should().Contain("\"key\":\"cle\"").And.Contain("\"townId\":4242").And.Contain("\"userId\":9").And.Contain("\"x\":1").And.Contain("\"y\":2");
        }

        [Fact]
        public void RadarPartiel_SeulsLesCotesRenseignesSontEnvoyes()
        {
            var cell = new UpdateCellInfoDto { X = 0, Y = 0, ScavNextCells = new ScavNextCellsDto { North = true } };

            var json = NewMapper().Map<ZenHordesUpdateRequestDto>(Request(cell)).ToJson();

            json.Should().Contain("\"scavRadar\":{\"north\":true}");
        }

        [Fact]
        public void CaseDesAutresOutils_Ignoree()
        {
            var otherToolsCell = new UpdateCellInfoDto { X = 99, Y = 99, Zombies = 50 };

            var dto = NewMapper().Map<ZenHordesUpdateRequestDto>(Request(new UpdateCellInfoDto { X = 1, Y = 2 }, otherToolsCell));

            dto.X.Should().Be(1);
            dto.Y.Should().Be(2);
            dto.Zombies.Should().BeNull();
        }
    }
}
