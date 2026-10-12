using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.MappingProfiles.Citizens;
using MyHordesOptimizerApi.Models;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.MappingProfiles
{
    /// <summary>Campings et capacités saisis à la main : servis avec le citoyen, jamais écrasés par un citoyen relu chez MyHordes.</summary>
    public class CitizenCampingSkillsMappingTests
    {
        private static IMapper NewMapper()
        {
            return new MapperConfiguration(cfg => cfg.AddMaps(typeof(CitizenMappingProfile).Assembly), NullLoggerFactory.Instance).CreateMapper();
        }

        [Fact]
        public void Citoyen_CampingsEtCapacites()
        {
            var citizen = new TownCitizen
            {
                IdTown = 1,
                IdUser = 7,
                IdTownNavigation = new Town { IdTown = 1 },
                IdUserNavigation = new User { IdUser = 7, Name = "Bob" },
                CampingCount = 3,
                HeroSkillLevelS = 1,
                HeroSkillLevelE = 4,
                HeroSkillLevelR = 2
            };

            var dto = NewMapper().Map<CitizenDto>(citizen);

            dto.CampingCount.Should().Be(3);
            dto.HeroSkills.S.Should().Be(1);
            dto.HeroSkills.U.Should().BeNull();
            dto.HeroSkills.P.Should().BeNull();
            dto.HeroSkills.E.Should().Be(4);
            dto.HeroSkills.R.Should().Be(2);
        }

        [Fact]
        public void CampingsJamaisSaisis_Zero()
        {
            var citizen = new TownCitizen
            {
                IdTown = 1,
                IdUser = 7,
                IdTownNavigation = new Town { IdTown = 1 },
                IdUserNavigation = new User { IdUser = 7, Name = "Bob" }
            };

            var dto = NewMapper().Map<CitizenDto>(citizen);

            dto.CampingCount.Should().Be(0);
            dto.HeroSkills.R.Should().BeNull();
        }

        [Fact]
        public void CitoyenReluChezMyHordes_NeRemplitPasLesSaisies()
        {
            var fromMyHordes = new CitizenDto { Id = 7, CampingCount = 5, HeroSkills = new CitizenHeroSkillLevelsDto { R = 3 } };

            var model = NewMapper().Map<TownCitizen>(fromMyHordes);

            model.CampingCount.Should().BeNull();
            model.HeroSkillLevelR.Should().BeNull();
        }
    }
}
