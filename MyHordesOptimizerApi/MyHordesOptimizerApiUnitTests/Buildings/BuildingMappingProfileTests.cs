using AutoMapper;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Buildings;
using MyHordesOptimizerApi.MappingProfiles.Buildings;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApiUnitTests.Buildings
{
    public class BuildingMappingProfileTests
    {
        private static IMapper CreerMapper()
        {
            var configuration = new MapperConfiguration(cfg => cfg.AddProfile<BuildingMappingProfile>());
            return configuration.CreateMapper();
        }

        [Fact]
        public void SepareLesRessourcesParPalierSelonResourceTier()
        {
            var mapper = CreerMapper();
            var item = new Item { IdItem = 1, Uid = "wood2_#00", LabelFr = "Bois" };
            var building = new Building
            {
                IdBuilding = 1,
                Uid = "small_wallimprove_#00",
                LabelFr = "Mur", LabelEn = "Wall", LabelEs = "Muro", LabelDe = "Mauer",
                DescriptionFr = "d", DescriptionEn = "d", DescriptionEs = "d", DescriptionDe = "d",
                HasHardMode = true,
                Tier0Ap = 25, Tier1Ap = 20, Tier2Ap = 13,
                BuildingRessources = new List<BuildingRessource>
                {
                    new() { IdBuilding = 1, IdItem = 1, ResourceTier = 0, Count = 4, IdItemNavigation = item },
                    new() { IdBuilding = 1, IdItem = 1, ResourceTier = 1, Count = 10, IdItemNavigation = item },
                    new() { IdBuilding = 1, IdItem = 1, ResourceTier = 2, Count = 8, IdItemNavigation = item },
                }
            };

            var dto = mapper.Map<BuildingDto>(building);

            dto.HasHardMode.Should().BeTrue();
            dto.Resources.Single().Count.Should().Be(4);
            dto.Tier0Resources.Single().Count.Should().Be(10);
            dto.Tier1Resources.Single().Count.Should().Be(8);
        }

        [Fact]
        public void PorteLesTroisCoutsEnPaEtLaDisponibilite()
        {
            var mapper = CreerMapper();
            var building = new Building
            {
                IdBuilding = 1,
                Uid = "small_wallimprove_#00",
                LabelFr = "Mur", LabelEn = "Wall", LabelEs = "Muro", LabelDe = "Mauer",
                DescriptionFr = "d", DescriptionEn = "d", DescriptionEs = "d", DescriptionDe = "d",
                HasHardMode = true,
                Tier0Ap = 25, Tier1Ap = 20, Tier2Ap = 13,
                BuildingRessources = new List<BuildingRessource>(),
                BuildingAvailabilities = new List<BuildingAvailability>
                {
                    new() { IdBuilding = 1, TownType = (int)MyHordesOptimizerApi.Dtos.MyHordesOptimizer.TownType.PANDE, Status = (int)BuildingAvailabilityStatus.Disabled },
                }
            };

            var dto = mapper.Map<BuildingDto>(building);

            dto.Tier0Ap.Should().Be(25);
            dto.Tier1Ap.Should().Be(20);
            dto.Tier2Ap.Should().Be(13);
            dto.Availability[MyHordesOptimizerApi.Dtos.MyHordesOptimizer.TownType.PANDE].Should().Be(BuildingAvailabilityStatus.Disabled);
        }

        [Fact]
        public void PorteLeNiveauDePlanEffectifQuandOverrideNommement()
        {
            var mapper = CreerMapper();
            var building = new Building
            {
                IdBuilding = 1,
                Uid = "small_wallimprove_#00",
                LabelFr = "Mur", LabelEn = "Wall", LabelEs = "Muro", LabelDe = "Mauer",
                DescriptionFr = "d", DescriptionEn = "d", DescriptionEs = "d", DescriptionDe = "d",
                HasHardMode = true,
                Tier0Ap = 25, Tier1Ap = 20, Tier2Ap = 13,
                HardBlueprintLevel = 1,
                BuildingRessources = new List<BuildingRessource>(),
            };

            var dto = mapper.Map<BuildingDto>(building);

            dto.HardBlueprintLevel.Should().Be(1);
        }

        [Fact]
        public void NeportePasDeNiveauDePlanEffectifQuandAbsent()
        {
            var mapper = CreerMapper();
            var building = new Building
            {
                IdBuilding = 1,
                Uid = "small_autre_#00",
                LabelFr = "Autre", LabelEn = "Other", LabelEs = "Otro", LabelDe = "Andere",
                DescriptionFr = "d", DescriptionEn = "d", DescriptionEs = "d", DescriptionDe = "d",
                HasHardMode = true,
                Tier0Ap = 40, Tier1Ap = 30, Tier2Ap = 30,
                HardBlueprintLevel = null,
                BuildingRessources = new List<BuildingRessource>(),
            };

            var dto = mapper.Map<BuildingDto>(building);

            dto.HardBlueprintLevel.Should().BeNull();
        }
    }
}
