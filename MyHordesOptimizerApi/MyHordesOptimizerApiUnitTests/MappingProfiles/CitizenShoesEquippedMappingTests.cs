using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.MappingProfiles.Citizens;
using MyHordesOptimizerApi.Models;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.MappingProfiles
{
    /// <summary>Chaussures équipées (déclarées dans la liste des citoyens ou envoyées par le script) : servies avec le citoyen, jamais écrasées par un citoyen relu chez MyHordes.</summary>
    public class CitizenShoesEquippedMappingTests
    {
        private static IMapper NewMapper()
        {
            return new MapperConfiguration(cfg => cfg.AddMaps(typeof(CitizenMappingProfile).Assembly), NullLoggerFactory.Instance).CreateMapper();
        }

        private static TownCitizen NewCitizen(bool? shoesEquipped)
        {
            return new TownCitizen
            {
                IdTown = 1,
                IdUser = 7,
                IdTownNavigation = new Town { IdTown = 1 },
                IdUserNavigation = new User { IdUser = 7, Name = "Bob" },
                ShoesEquipped = shoesEquipped
            };
        }

        [Fact]
        public void ChaussuresSaisies_Servies()
        {
            NewMapper().Map<CitizenDto>(NewCitizen(true)).ShoesEquipped.Should().BeTrue();
            NewMapper().Map<CitizenDto>(NewCitizen(false)).ShoesEquipped.Should().BeFalse();
        }

        [Fact]
        public void ChaussuresJamaisSaisies_False()
        {
            NewMapper().Map<CitizenDto>(NewCitizen(null)).ShoesEquipped.Should().BeFalse();
        }

        [Fact]
        public void CitoyenReluChezMyHordes_NeRemplitPasLesChaussures()
        {
            var fromMyHordes = new CitizenDto { Id = 7, ShoesEquipped = true };

            var model = NewMapper().Map<TownCitizen>(fromMyHordes);

            model.ShoesEquipped.Should().BeNull();
        }
    }
}
