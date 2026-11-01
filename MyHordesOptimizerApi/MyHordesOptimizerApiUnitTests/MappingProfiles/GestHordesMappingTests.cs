using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.MappingProfiles;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.MappingProfiles
{
    /// <summary>
    /// Corps JSON de /majScript : clés en snake_case (convertisseur de Gest'Hordes), coordonnées absolues,
    /// et champ absent plutôt que null pour un relevé non lu.
    /// </summary>
    public class GestHordesMappingTests
    {
        private static IMapper NewMapper()
        {
            return new MapperConfiguration(cfg => cfg.AddMaps(typeof(GestHordesMappingProfiles).Assembly), NullLoggerFactory.Instance).CreateMapper();
        }

        private static UpdateRequestDto Request(UpdateCellInfoDto gestHordesCell)
        {
            return new UpdateRequestDto
            {
                TownDetails = new UpdateTownDetailsDto { TownId = 4242, TownX = 10, TownY = 10 },
                Map = new UpdateRequestMapDto { GestHordesCell = gestHordesCell }
            };
        }

        [Fact]
        public void Fouineur_NiveauDeFouilleEtRegeneration()
        {
            var cell = new UpdateCellInfoDto { X = 2, Y = -1, ScavZoneLevel = 0, ScavNextCells = new ScavNextCellsDto { North = true, West = false } };

            var dto = NewMapper().Map<GestHordesMajScriptRequest>(Request(cell));
            dto.Key = "cle";

            dto.ToJson().Should().Be("{\"key\":\"cle\",\"x\":12,\"y\":11,\"fouille_lvl\":0,\"regeneration_zone\":{\"north\":true,\"south\":null,\"east\":null,\"west\":false}}");
        }

        [Fact]
        public void Eclaireur_BalisageEtEstimation()
        {
            var cell = new UpdateCellInfoDto { X = -3, Y = 4, ScoutZoneLvl = 2, ScoutNextCells = new ScoutNextCellsDto { East = 0, South = 7 } };

            var dto = NewMapper().Map<GestHordesMajScriptRequest>(Request(cell));
            dto.Key = "cle";

            dto.ToJson().Should().Be("{\"key\":\"cle\",\"x\":7,\"y\":6,\"balisage_lvl\":2,\"estimation_zombie\":{\"north\":null,\"south\":7,\"east\":0,\"west\":null}}");
        }
    }
}
